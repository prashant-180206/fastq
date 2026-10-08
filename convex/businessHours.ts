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

// ============================================================
// HELPERS
// ============================================================

async function getHoursOrThrow(
  ctx: QueryCtx | MutationCtx,
  businessId: Id<"businesses">,
  dayOfWeek: number,
) {
  const hours = await ctx.db
    .query("businessHours")
    .withIndex("by_businessId_dayOfWeek", (q) =>
      q.eq("businessId", businessId).eq("dayOfWeek", dayOfWeek),
    )
    .unique();

  if (!hours) {
    throw new Error("Business hours not found");
  }

  return hours;
}

function validateDay(dayOfWeek: number) {
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error("dayOfWeek must be between 0 and 6");
  }
}

function validateTime(time: string) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error("Time must be in HH:mm format");
  }
}

function validateTimeRange(
  isOpen: boolean,
  openTime?: string,
  closeTime?: string,
) {
  if (!isOpen) {
    return;
  }

  if (!openTime || !closeTime) {
    throw new Error(
      "Open and close times are required when the business is open",
    );
  }

  validateTime(openTime);
  validateTime(closeTime);

  if (openTime >= closeTime) {
    throw new Error("Close time must be after open time");
  }
}

// ============================================================
// GET
// ============================================================

export const get = query({
  args: {
    businessId: v.id("businesses"),
    dayOfWeek: v.number(),
  },

  handler: async (ctx, args) => {
    validateDay(args.dayOfWeek);

    await requireBusinessMember(ctx, args.businessId);

    return await getHoursOrThrow(ctx, args.businessId, args.dayOfWeek);
  },
});

// ============================================================
// LIST
// ============================================================

export const list = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    return await ctx.db
      .query("businessHours")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

// ============================================================
// SET SINGLE DAY
// ============================================================

export const set = mutation({
  args: {
    businessId: v.id("businesses"),

    dayOfWeek: v.number(),

    isOpen: v.boolean(),

    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    validateDay(args.dayOfWeek);

    await requireBusinessRole(ctx, args.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    validateTimeRange(args.isOpen, args.openTime, args.closeTime);

    const existing = await ctx.db
      .query("businessHours")
      .withIndex("by_businessId_dayOfWeek", (q) =>
        q.eq("businessId", args.businessId).eq("dayOfWeek", args.dayOfWeek),
      )
      .unique();

    const data = {
      businessId: args.businessId,
      dayOfWeek: args.dayOfWeek,
      isOpen: args.isOpen,

      // Closed days don't need times.
      openTime: args.isOpen ? args.openTime : undefined,

      closeTime: args.isOpen ? args.closeTime : undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);

      return await ctx.db.get(existing._id);
    }

    return await ctx.db.insert("businessHours", data);
  },
});

// ============================================================
// SET WEEK
// ============================================================

export const setWeek = mutation({
  args: {
    businessId: v.id("businesses"),

    hours: v.array(
      v.object({
        dayOfWeek: v.number(),

        isOpen: v.boolean(),

        openTime: v.optional(v.string()),
        closeTime: v.optional(v.string()),
      }),
    ),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    // --------------------------------------------------------
    // Validate number of days
    // --------------------------------------------------------

    if (args.hours.length !== 7) {
      throw new Error("A weekly schedule must contain exactly 7 days");
    }

    // --------------------------------------------------------
    // Validate uniqueness
    // --------------------------------------------------------

    const seenDays = new Set<number>();

    for (const day of args.hours) {
      validateDay(day.dayOfWeek);

      if (seenDays.has(day.dayOfWeek)) {
        throw new Error(`Duplicate dayOfWeek: ${day.dayOfWeek}`);
      }

      seenDays.add(day.dayOfWeek);

      validateTimeRange(day.isOpen, day.openTime, day.closeTime);
    }

    // --------------------------------------------------------
    // Persist schedule
    // --------------------------------------------------------

    for (const day of args.hours) {
      const existing = await ctx.db
        .query("businessHours")
        .withIndex("by_businessId_dayOfWeek", (q) =>
          q.eq("businessId", args.businessId).eq("dayOfWeek", day.dayOfWeek),
        )
        .unique();

      const data = {
        businessId: args.businessId,
        dayOfWeek: day.dayOfWeek,
        isOpen: day.isOpen,

        openTime: day.isOpen ? day.openTime : undefined,

        closeTime: day.isOpen ? day.closeTime : undefined,
      };

      if (existing) {
        await ctx.db.patch(existing._id, data);
      } else {
        await ctx.db.insert("businessHours", data);
      }
    }

    return true;
  },
});
