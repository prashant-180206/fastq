import { mutation, query, type QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { requireUser } from "../lib/auth";
import { requireBusinessOwner } from "../lib/authorization";

const MAX_MESSAGE_LENGTH = 500;
const MAX_EXPIRY_MINUTES = 24 * 60;
const MAX_ACTIVE_BROADCASTS = 50;

/**
 * Loads non-expired broadcasts for a business, optionally narrowed to one
 * queue. Business-wide announcements (no `queueId`) always match.
 */
async function activeForBusiness(
  ctx: QueryCtx,
  businessId: Id<"businesses">,
  queueId: Id<"queues"> | undefined,
  now: number,
) {
  const broadcasts = await ctx.db
    .query("broadcasts")
    .withIndex("by_business_and_expiry", (q) =>
      q.eq("businessId", businessId).gt("expiresAt", now),
    )
    .take(MAX_ACTIVE_BROADCASTS);

  return broadcasts
    .filter(
      (broadcast) =>
        broadcast.queueId === undefined || broadcast.queueId === queueId,
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Publish an announcement to every customer currently in a queue.
 */
export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    queueId: v.optional(v.id("queues")),
    message: v.string(),
    expiresInMinutes: v.number(),
  },

  handler: async (ctx, args) => {
    const { user, business } = await requireBusinessOwner(
      ctx,
      args.businessId,
    );

    const message = args.message.trim();

    if (message.length === 0) {
      throw new Error("Announcement message is required.");
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new Error(
        `Announcements must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
      );
    }

    const minutes = Math.round(args.expiresInMinutes);

    if (
      !Number.isFinite(minutes) ||
      minutes < 1 ||
      minutes > MAX_EXPIRY_MINUTES
    ) {
      throw new Error(
        `Expiry must be between 1 and ${MAX_EXPIRY_MINUTES} minutes.`,
      );
    }

    if (args.queueId !== undefined) {
      const queue = await ctx.db.get(args.queueId);

      if (!queue || queue.businessId !== business._id) {
        throw new Error("Queue not found for this business.");
      }
    }

    const now = Date.now();

    return await ctx.db.insert("broadcasts", {
      businessId: business._id,
      queueId: args.queueId,
      message,
      createdBy: user._id,
      createdAt: now,
      expiresAt: now + minutes * 60_000,
    });
  },
});

/**
 * Stop an announcement early.
 */
export const remove = mutation({
  args: {
    broadcastId: v.id("broadcasts"),
  },

  handler: async (ctx, args) => {
    const broadcast = await ctx.db.get(args.broadcastId);

    if (!broadcast) {
      throw new Error("Announcement not found.");
    }

    await requireBusinessOwner(ctx, broadcast.businessId);

    await ctx.db.delete(broadcast._id);
  },
});

/**
 * Active announcements for a queue managed by the authenticated owner.
 */
export const getActiveByQueue = query({
  args: {
    queueId: v.id("queues"),
    now: v.number(),
  },

  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);

    if (!queue) {
      throw new Error("Queue not found.");
    }

    await requireBusinessOwner(ctx, queue.businessId);

    return await activeForBusiness(
      ctx,
      queue.businessId,
      queue._id,
      args.now,
    );
  },
});

/**
 * Active announcements visible to the customer who owns the token.
 */
export const getActiveForToken = query({
  args: {
    tokenId: v.id("queueTokens"),
    now: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await ctx.db.get(args.tokenId);

    if (!token || token.customerId !== user._id) {
      return [];
    }

    return await activeForBusiness(
      ctx,
      token.businessId,
      token.queueId,
      args.now,
    );
  },
});
