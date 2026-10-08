import {
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

import {
  requireBusinessMember,
  requireBusinessRole,
} from "./lib/authorization";

async function getDeviceOrThrow(
  ctx: QueryCtx | MutationCtx,
  deviceId: Id<"kioskDevices">,
) {
  const device = await ctx.db.get(deviceId);

  if (!device) {
    throw new Error("Device not found");
  }

  return device;
}

/* -------------------------------------------------------------------------- */
/* Event creation                                                             */
/* -------------------------------------------------------------------------- */

export const create = mutation({
  args: {
    deviceId: v.id("kioskDevices"),
    eventType: v.string(),
    metadata: v.optional(v.any()),
  },

  handler: async (ctx, args) => {
    const device = await getDeviceOrThrow(ctx, args.deviceId);

    await requireBusinessMember(ctx, device.businessId);

    return await ctx.db.insert("deviceEvents", {
      deviceId: args.deviceId,
      eventType: args.eventType,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

/* -------------------------------------------------------------------------- */
/* Device event history                                                       */
/* -------------------------------------------------------------------------- */

export const list = query({
  args: {
    deviceId: v.id("kioskDevices"),
    eventType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const device = await getDeviceOrThrow(ctx, args.deviceId);

    await requireBusinessMember(ctx, device.businessId);

    let events;

    if (args.eventType) {
      events = await ctx.db
        .query("deviceEvents")
        .withIndex("by_deviceId_createdAt", (q) =>
          q.eq("deviceId", args.deviceId),
        )
        .order("desc")
        .collect();

      events = events.filter((event) => event.eventType === args.eventType);
    } else {
      events = await ctx.db
        .query("deviceEvents")
        .withIndex("by_deviceId_createdAt", (q) =>
          q.eq("deviceId", args.deviceId),
        )
        .order("desc")
        .collect();
    }

    if (args.limit !== undefined) {
      return events.slice(0, Math.max(1, args.limit));
    }

    return events;
  },
});

/* -------------------------------------------------------------------------- */
/* Business-wide device events                                                */
/* -------------------------------------------------------------------------- */

export const listForBusiness = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    const devices = await ctx.db
      .query("kioskDevices")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();

    const events = [];

    for (const device of devices) {
      const deviceEvents = await ctx.db
        .query("deviceEvents")
        .withIndex("by_deviceId_createdAt", (q) => q.eq("deviceId", device._id))
        .order("desc")
        .collect();

      for (const event of deviceEvents) {
        events.push({
          ...event,
          deviceName: device.name,
          deviceIdentifier: device.deviceId,
        });
      }
    }

    events.sort((a, b) => b.createdAt - a.createdAt);

    if (args.limit !== undefined) {
      return events.slice(0, Math.max(1, args.limit));
    }

    return events;
  },
});

/* -------------------------------------------------------------------------- */
/* Administrative cleanup                                                     */
/* -------------------------------------------------------------------------- */

export const clearForDevice = mutation({
  args: {
    deviceId: v.id("kioskDevices"),
  },

  handler: async (ctx, args) => {
    const device = await getDeviceOrThrow(ctx, args.deviceId);

    await requireBusinessRole(ctx, device.businessId, ["OWNER", "ADMIN"]);

    const events = await ctx.db
      .query("deviceEvents")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .collect();

    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    return events.length;
  },
});
