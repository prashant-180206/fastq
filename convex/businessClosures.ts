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

type AuthenticatedCtx = QueryCtx | MutationCtx;

function validateDate(date: string) {
  // YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Date must be in YYYY-MM-DD format");
  }

  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date");
  }

  // Prevent values such as 2026-02-31 from being normalized.
  const normalized = parsed.toISOString().slice(0, 10);

  if (normalized !== date) {
    throw new Error("Invalid date");
  }
}

function validateTime(time: string) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error("Time must be in HH:mm format");
  }
}

function validatePartialClosure(
  isClosed: boolean,
  openTime?: string,
  closeTime?: string,
) {
  if (isClosed) {
    return;
  }

  if (!openTime || !closeTime) {
    throw new Error(
      "Open and close times are required for a partial closure",
    );
  }

  validateTime(openTime);
  validateTime(closeTime);

  if (openTime >= closeTime) {
    throw new Error("Close time must be after open time");
  }
}

async function getClosureOrThrow(
  ctx: AuthenticatedCtx,
  closureId: Id<"businessClosures">,
) {
  const closure = await ctx.db.get(closureId);

  if (!closure) {
    throw new Error("Business closure not found");
  }

  return closure;
}

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    date: v.string(),
    isClosed: v.boolean(),
    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),
    reason: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    validateDate(args.date);

    validatePartialClosure(
      args.isClosed,
      args.openTime,
      args.closeTime,
    );

    const existing = await ctx.db
      .query("businessClosures")
      .withIndex("by_businessId_date", (q) =>
        q
          .eq("businessId", args.businessId)
          .eq("date", args.date),
      )
      .unique();

    if (existing) {
      throw new Error("A closure already exists for this date");
    }

    return await ctx.db.insert("businessClosures", {
      businessId: args.businessId,
      date: args.date,
      isClosed: args.isClosed,

      // Full-day closures should not carry partial hours.
      openTime: args.isClosed ? undefined : args.openTime,
      closeTime: args.isClosed ? undefined : args.closeTime,

      reason: args.reason,
    });
  },
});

export const get = query({
  args: {
    closureId: v.id("businessClosures"),
  },

  handler: async (ctx, args) => {
    const closure = await getClosureOrThrow(ctx, args.closureId);

    await requireBusinessMember(ctx, closure.businessId);

    return closure;
  },
});

export const list = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    return await ctx.db
      .query("businessClosures")
      .withIndex("by_businessId", (q) =>
        q.eq("businessId", args.businessId),
      )
      .collect();
  },
});

export const getForDate = query({
  args: {
    businessId: v.id("businesses"),
    date: v.string(),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    validateDate(args.date);

    return await ctx.db
      .query("businessClosures")
      .withIndex("by_businessId_date", (q) =>
        q
          .eq("businessId", args.businessId)
          .eq("date", args.date),
      )
      .unique();
  },
});

export const update = mutation({
  args: {
    closureId: v.id("businessClosures"),

    isClosed: v.optional(v.boolean()),

    // Pass explicit values when changing the times.
    // Because Convex optional args cannot distinguish
    // "omitted" from "undefined", this mutation preserves
    // the existing values unless isClosed changes to true.
    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),

    reason: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const closure = await getClosureOrThrow(ctx, args.closureId);

    await requireBusinessRole(ctx, closure.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    const isClosed = args.isClosed ?? closure.isClosed;

    const openTime = args.openTime ?? closure.openTime;
    const closeTime = args.closeTime ?? closure.closeTime;

    validatePartialClosure(
      isClosed,
      openTime,
      closeTime,
    );

    await ctx.db.patch(args.closureId, {
      isClosed,

      // Remove partial hours when converting
      // to a full-day closure.
      openTime: isClosed ? undefined : openTime,
      closeTime: isClosed ? undefined : closeTime,

      reason: args.reason ?? closure.reason,
    });

    return await ctx.db.get(args.closureId);
  },
});

export const remove = mutation({
  args: {
    closureId: v.id("businessClosures"),
  },

  handler: async (ctx, args) => {
    const closure = await getClosureOrThrow(ctx, args.closureId);

    await requireBusinessRole(ctx, closure.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    await ctx.db.delete(args.closureId);

    return true;
  },
});