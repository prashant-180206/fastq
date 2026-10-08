import {
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

import { requireBusinessMember } from "./lib/authorization";
import { requireUser } from "./lib/auth";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function getNotificationOrThrow(
  ctx: QueryCtx | MutationCtx,
  notificationId: Id<"notifications">,
) {
  const notification = await ctx.db.get(notificationId);

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
}

/* -------------------------------------------------------------------------- */
/* Create                                                                     */
/* -------------------------------------------------------------------------- */

export const create = mutation({
  args: {
    businessId: v.optional(v.id("businesses")),
    userId: v.optional(v.id("users")),
    deviceId: v.optional(v.id("kioskDevices")),
    type: v.string(),
    title: v.string(),
    message: v.string(),
  },

  handler: async (ctx, args) => {
    /*
     * A notification must have at least one target.
     */
    if (!args.userId && !args.businessId && !args.deviceId) {
      throw new Error("Notification must have a target");
    }

    /*
     * User-targeted notifications can only be
     * created by the user themselves or by a
     * member of the associated business.
     */
    if (args.userId) {
      const currentUser = await requireUser(ctx);

      if (currentUser._id !== args.userId && args.businessId) {
        await requireBusinessMember(ctx, args.businessId);
      } else if (currentUser._id !== args.userId) {
        throw new Error("You cannot create notifications for another user");
      }
    } else if (args.businessId) {
      await requireBusinessMember(ctx, args.businessId);
    }

    /*
     * Device notifications require access to
     * the device's business.
     */
    if (args.deviceId) {
      const device = await ctx.db.get(args.deviceId);

      if (!device) {
        throw new Error("Device not found");
      }

      await requireBusinessMember(ctx, device.businessId);
    }

    return await ctx.db.insert("notifications", {
      businessId: args.businessId,
      userId: args.userId,
      deviceId: args.deviceId,
      type: args.type,
      title: args.title,
      message: args.message,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

/* -------------------------------------------------------------------------- */
/* User notifications                                                         */
/* -------------------------------------------------------------------------- */

export const listMine = query({
  args: {
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    let notifications;

    if (args.unreadOnly) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_userId_isRead", (q) =>
          q.eq("userId", user._id).eq("isRead", false),
        )
        .order("desc")
        .collect();
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_userId_createdAt", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect();
    }

    if (args.limit !== undefined) {
      return notifications.slice(0, Math.max(1, args.limit));
    }

    return notifications;
  },
});

export const getMine = query({
  args: {
    notificationId: v.id("notifications"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const notification = await getNotificationOrThrow(ctx, args.notificationId);

    if (notification.userId !== user._id) {
      throw new Error("You do not have access to this notification");
    }

    return notification;
  },
});

/* -------------------------------------------------------------------------- */
/* Read state                                                                 */
/* -------------------------------------------------------------------------- */

export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const notification = await getNotificationOrThrow(ctx, args.notificationId);

    if (notification.userId !== user._id) {
      throw new Error("You do not have access to this notification");
    }

    if (notification.isRead) {
      return notification;
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });

    return await ctx.db.get(args.notificationId);
  },
});

export const markAllAsRead = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", user._id).eq("isRead", false),
      )
      .collect();

    const now = Date.now();

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: now,
      });
    }

    return notifications.length;
  },
});

/* -------------------------------------------------------------------------- */
/* Business notifications                                                     */
/* -------------------------------------------------------------------------- */

export const listForBusiness = query({
  args: {
    businessId: v.id("businesses"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    let notifications;

    if (args.unreadOnly) {
      /*
       * There is no businessId + isRead index
       * in the current schema, so filter after
       * querying the business.
       */
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
        .order("desc")
        .collect();

      notifications = notifications.filter(
        (notification) => !notification.isRead,
      );
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
        .order("desc")
        .collect();
    }

    if (args.limit !== undefined) {
      return notifications.slice(0, Math.max(1, args.limit));
    }

    return notifications;
  },
});

/* -------------------------------------------------------------------------- */
/* Device notifications                                                       */
/* -------------------------------------------------------------------------- */

export const listForDevice = query({
  args: {
    deviceId: v.id("kioskDevices"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);

    if (!device) {
      throw new Error("Device not found");
    }

    await requireBusinessMember(ctx, device.businessId);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .collect();

    if (args.limit !== undefined) {
      return notifications.slice(0, Math.max(1, args.limit));
    }

    return notifications;
  },
});

/* -------------------------------------------------------------------------- */
/* Delete                                                                     */
/* -------------------------------------------------------------------------- */

export const remove = mutation({
  args: {
    notificationId: v.id("notifications"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const notification = await getNotificationOrThrow(ctx, args.notificationId);

    /*
     * Users can delete their own notifications.
     *
     * Business members can delete business
     * notifications.
     */
    if (notification.userId === user._id) {
      await ctx.db.delete(args.notificationId);

      return true;
    }

    if (notification.businessId) {
      await requireBusinessMember(ctx, notification.businessId);

      await ctx.db.delete(args.notificationId);

      return true;
    }

    throw new Error("You do not have permission to delete this notification");
  },
});
