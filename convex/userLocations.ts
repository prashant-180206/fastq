import {
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireUser } from "./lib/auth";

// import { requireUser } from "./lib/authorization";

async function getLocationOrThrow(
  ctx: QueryCtx | MutationCtx,
  locationId: Id<"userLocations">,
) {
  const location = await ctx.db.get(locationId);

  if (!location) {
    throw new Error("User location not found");
  }

  return location;
}

export const save = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.number()),
    source: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    return await ctx.db.insert("userLocations", {
      userId: user._id,
      latitude: args.latitude,
      longitude: args.longitude,
      accuracy: args.accuracy,
      source: args.source,
      createdAt: Date.now(),
    });
  },
});

export const getLatest = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("userLocations")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
  },
});

export const listMine = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const locations = await ctx.db
      .query("userLocations")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    if (args.limit !== undefined) {
      return locations.slice(0, Math.max(1, args.limit));
    }

    return locations;
  },
});

export const remove = mutation({
  args: {
    locationId: v.id("userLocations"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const location = await getLocationOrThrow(ctx, args.locationId);

    if (location.userId !== user._id) {
      throw new Error("You do not own this location record");
    }

    await ctx.db.delete(args.locationId);

    return true;
  },
});
