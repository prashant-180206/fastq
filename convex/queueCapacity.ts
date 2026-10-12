import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { v, type Infer } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireUser } from "./lib/auth";
import { requireBusinessOwner } from "./lib/authorization";

const activeTokenStatuses = [
  "waiting",
  "called",
  "checked_in",
  "serving",
] as const;

const activeAppointmentStatuses = ["booked", "checked_in"] as const;

const weekdayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function minutesOfDay(value: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

  if (!match) {
    throw new Error(`Invalid business-hours time: ${value}`);
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

async function countActiveTokensForBusiness(
  ctx: MutationCtx,
  businessId: Id<"businesses">,
): Promise<number> {
  const queues = await ctx.db
    .query("queues")
    .withIndex("by_business", (q) => q.eq("businessId", businessId))
    .collect();

  const counts = await Promise.all(
    queues.map(async (queue) => {
      const tokens = await Promise.all(
        activeTokenStatuses.map((status) =>
          ctx.db
            .query("queueTokens")
            .withIndex("by_queue_and_status", (q) =>
              q.eq("queueId", queue._id).eq("status", status),
            )
            .collect(),
        ),
      );

      return tokens.reduce((sum, group) => sum + group.length, 0);
    }),
  );

  return counts.reduce((sum, count) => sum + count, 0);
}

// Customer-facing availability preview.
// dayStartAt/dayEndAt must represent midnight boundaries
// for the selected business-local date.
export const getDailyAvailability = query({
  args: {
    businessId: v.id("businesses"),
    serviceId: v.id("services"),
    date: v.string(), // YYYY-MM-DD in the business's local calendar
    dayStartAt: v.number(),
    dayEndAt: v.number(),
  },

  handler: async (ctx, args) => {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(args.date) ||
      !Number.isFinite(args.dayStartAt) ||
      !Number.isFinite(args.dayEndAt) ||
      args.dayEndAt <= args.dayStartAt
    ) {
      throw new Error("Invalid date or day boundaries.");
    }

    const business = await ctx.db.get(args.businessId);
    const service = await ctx.db.get(args.serviceId);

    if (!business || business.status !== "active") {
      return {
        date: args.date,
        slots: [],
        dailyCapacity: 0,
        bookedAppointments: 0,
        activeQueueTokens: 0,
        remainingCapacity: 0,
      };
    }

    if (
      !service ||
      service.businessId !== args.businessId ||
      !service.isActive ||
      !service.appointmentsEnabled
    ) {
      throw new Error("This service is not available for appointments.");
    }

    const dayIndex = new Date(`${args.date}T00:00:00Z`).getUTCDay();
    const dayName = weekdayNames[dayIndex];

    const businessDay = business.businessHours?.find(
      (day) => day.day === dayName,
    );

    if (!businessDay || !businessDay.isOpen) {
      return {
        date: args.date,
        slots: [],
        dailyCapacity: 0,
        bookedAppointments: 0,
        activeQueueTokens: 0,
        remainingCapacity: 0,
      };
    }

    // Build appointment candidates from the business's operating slots.
    const candidates: Array<{
      startAt: number;
      endAt: number;
    }> = [];

    const durationMs = service.durationMinutes * 60_000;

    for (const hours of businessDay.slots) {
      const openMinute = minutesOfDay(hours.open);
      const closeMinute = minutesOfDay(hours.close);

      if (closeMinute <= openMinute) {
        continue;
      }

      let startAt = args.dayStartAt + openMinute * 60_000;
      const closeAt = args.dayStartAt + closeMinute * 60_000;

      while (startAt + durationMs <= closeAt) {
        candidates.push({
          startAt,
          endAt: startAt + durationMs,
        });

        startAt += durationMs;
      }
    }

    // Only appointments that overlap this business-local day are relevant.
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_business_and_start", (q) =>
        q
          .eq("businessId", args.businessId)
          .gte("scheduledStart", args.dayStartAt)
          .lt("scheduledStart", args.dayEndAt),
      )
      .collect();

    const bookedAppointments = appointments.filter((appointment) =>
      activeAppointmentStatuses.includes(
        appointment.status as (typeof activeAppointmentStatuses)[number],
      ),
    );

    const activeQueueTokens = await countActiveTokensForBusiness(
      // Queries support the same database reads used by mutations.
      ctx as unknown as MutationCtx,
      args.businessId,
    );

    const dailyCapacity = candidates.length;
    const remainingCapacity = Math.max(
      0,
      dailyCapacity - bookedAppointments.length - activeQueueTokens,
    );

    const slots = candidates
      .filter(
        (candidate) =>
          !bookedAppointments.some(
            (appointment) =>
              candidate.startAt < appointment.scheduledEnd &&
              candidate.endAt > appointment.scheduledStart,
          ),
      )
      .map((candidate) => ({
        ...candidate,
        available: remainingCapacity > 0,
      }));

    return {
      date: args.date,
      slots,
      dailyCapacity,
      bookedAppointments: bookedAppointments.length,
      activeQueueTokens,
      remainingCapacity,
    };
  },
});

// Assign the next monotonically increasing number in a queue.
export const joinQueue = mutation({
  args: {
    queueId: v.id("queues"),
    acknowledgedPrerequisites: v.array(
      v.object({
        prerequisiteId: v.string(),
        acknowledgedAt: v.number(),
      }),
    ),
    customerNote: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const customer = await requireUser(ctx);
    const now = Date.now();

    const queue = await ctx.db.get(args.queueId);

    if (!queue || queue.status !== "active") {
      throw new Error("This queue is not accepting customers.");
    }

    const business = await ctx.db.get(queue.businessId);
    const service = await ctx.db.get(queue.serviceId);

    if (!business || business.status !== "active") {
      throw new Error("This business is unavailable.");
    }

    if (
      !service ||
      service.businessId !== queue.businessId ||
      !service.isActive ||
      !service.queueEnabled
    ) {
      throw new Error("This queue's service is unavailable.");
    }

    const acknowledgedIds = new Set(
      args.acknowledgedPrerequisites.map((item) => item.prerequisiteId),
    );

    for (const prerequisite of queue.prerequisites) {
      if (prerequisite.isRequired && !acknowledgedIds.has(prerequisite.id)) {
        throw new Error(`Please acknowledge: ${prerequisite.label}`);
      }
    }

    // Prevent duplicate active tickets for this customer in this queue.
    const existingByStatus = await Promise.all(
      activeTokenStatuses.map((status) =>
        ctx.db
          .query("queueTokens")
          .withIndex("by_customer_and_status", (q) =>
            q.eq("customerId", customer._id).eq("status", status),
          )
          .collect(),
      ),
    );

    const hasExistingToken = existingByStatus
      .flat()
      .some((token) => token.queueId === queue._id);

    if (hasExistingToken) {
      throw new Error("You already have an active token in this queue.");
    }

    const lastToken = await ctx.db
      .query("queueTokens")
      .withIndex("by_queue_and_token_number", (q) => q.eq("queueId", queue._id))
      .order("desc")
      .first();

    const tokenNumber = (lastToken?.tokenNumber ?? 0) + 1;
    const gracePeriodMinutes = 5;

    const tokenId = await ctx.db.insert("queueTokens", {
      businessId: queue.businessId,
      queueId: queue._id,
      serviceId: queue.serviceId,
      customerId: customer._id,
      tokenNumber,
      status: "waiting",
      joinedAt: now,
      gracePeriodMinutes,
      customerNote: args.customerNote,
      acknowledgedPrerequisites: args.acknowledgedPrerequisites,
      updatedAt: now,
    });

    return {
      tokenId,
      tokenNumber,
      status: "waiting" as const,
      joinedAt: now,
    };
  },
});

// Business staff/owner calls the next waiting token.
// The grace deadline is enforced by a scheduled mutation.
export const callNext = mutation({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);

    if (!queue) {
      throw new Error("Queue not found.");
    }

    await requireBusinessOwner(ctx, queue.businessId);

    if (queue.status !== "active") {
      throw new Error("This queue is not active.");
    }

    const nextToken = await ctx.db
      .query("queueTokens")
      .withIndex("by_queue_and_status", (q) =>
        q.eq("queueId", queue._id).eq("status", "waiting"),
      )
      .collect()
      .then((tokens) => tokens.sort((a, b) => a.joinedAt - b.joinedAt)[0]);

    if (!nextToken) {
      return null;
    }

    const now = Date.now();
    const graceDeadlineAt = now + nextToken.gracePeriodMinutes * 60_000;

    await ctx.db.patch(nextToken._id, {
      status: "called",
      calledAt: now,
      graceDeadlineAt,
      updatedAt: now,
    });

    await ctx.scheduler.runAt(
      graceDeadlineAt,
      internal.queueCapacity.expireCalledToken,
      {
        tokenId: nextToken._id,
        expectedDeadline: graceDeadlineAt,
      },
    );

    return {
      tokenId: nextToken._id,
      tokenNumber: nextToken.tokenNumber,
      status: "called" as const,
      graceDeadlineAt,
    };
  },
});

// Customer checks in after being called.
export const checkInToken = mutation({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const customer = await requireUser(ctx);
    const token = await ctx.db.get(args.tokenId);

    if (!token || token.customerId !== customer._id) {
      throw new Error("Token not found.");
    }

    if (token.status !== "called") {
      throw new Error("Only a called token can check in.");
    }

    const now = Date.now();

    if (token.graceDeadlineAt !== undefined && now > token.graceDeadlineAt) {
      throw new Error("The check-in grace period has expired.");
    }

    await ctx.db.patch(token._id, {
      status: "checked_in",
      checkedInAt: now,
      updatedAt: now,
    });

    return { success: true, status: "checked_in" as const };
  },
});

// Owner/staff starts serving a checked-in customer.
export const startServing = mutation({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const token = await ctx.db.get(args.tokenId);

    if (!token) {
      throw new Error("Token not found.");
    }

    await requireBusinessOwner(ctx, token.businessId);

    if (token.status !== "checked_in") {
      throw new Error("The customer must check in before service starts.");
    }

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: "serving",
      serviceStartedAt: now,
      updatedAt: now,
    });

    return { success: true, status: "serving" as const };
  },
});

// Owner/staff completes a service.
export const completeToken = mutation({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const token = await ctx.db.get(args.tokenId);

    if (!token) {
      throw new Error("Token not found.");
    }

    await requireBusinessOwner(ctx, token.businessId);

    if (token.status !== "serving") {
      throw new Error("Only a serving token can be completed.");
    }

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });

    return { success: true, status: "completed" as const };
  },
});

// Customer cancels their own token while it is still actionable.
export const cancelToken = mutation({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const customer = await requireUser(ctx);
    const token = await ctx.db.get(args.tokenId);

    if (!token || token.customerId !== customer._id) {
      throw new Error("Token not found.");
    }

    if (!["waiting", "called", "checked_in"].includes(token.status)) {
      throw new Error("This token can no longer be cancelled.");
    }

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: "cancelled",
      cancelledAt: now,
      updatedAt: now,
    });

    return { success: true, status: "cancelled" as const };
  },
});

// Owner/staff explicitly skips a waiting, called, or checked-in token.
export const skipToken = mutation({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const token = await ctx.db.get(args.tokenId);

    if (!token) {
      throw new Error("Token not found.");
    }

    await requireBusinessOwner(ctx, token.businessId);

    if (!["waiting", "called", "checked_in"].includes(token.status)) {
      throw new Error("This token cannot be skipped.");
    }

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: "skipped",
      skippedAt: now,
      updatedAt: now,
    });

    return { success: true, status: "skipped" as const };
  },
});

// Scheduled grace-period handler. It is safe to run more than once.
export const expireCalledToken = internalMutation({
  args: {
    tokenId: v.id("queueTokens"),
    expectedDeadline: v.number(),
  },

  handler: async (ctx, args) => {
    const token = await ctx.db.get(args.tokenId);

    if (
      !token ||
      token.status !== "called" ||
      token.graceDeadlineAt !== args.expectedDeadline ||
      Date.now() < args.expectedDeadline
    ) {
      return;
    }

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: "no_show",
      noShowAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Get all queue tokens belonging to the authenticated customer.
 */
export const getMyTokens = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const tokens = await ctx.db
      .query("queueTokens")
      .withIndex("by_customer", (q) => q.eq("customerId", user._id))
      .collect();

    return tokens.sort((a, b) => b.joinedAt - a.joinedAt);
  },
});

/**
 * Get one queue token, but only if it belongs to the customer.
 */
export const getMyTokenById = query({
  args: {
    tokenId: v.id("queueTokens"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await ctx.db.get(args.tokenId);

    if (!token || token.customerId !== user._id) {
      return null;
    }

    return token;
  },
});

/**
 * Get active tokens for a queue managed by the authenticated business owner.
 */
export const getActiveTokensByQueue = query({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);

    if (!queue) {
      throw new Error("Queue not found.");
    }

    await requireBusinessOwner(ctx, queue.businessId);

    const statuses = ["waiting", "called", "checked_in", "serving"] as const;

    const groups = await Promise.all(
      statuses.map((status) =>
        ctx.db
          .query("queueTokens")
          .withIndex("by_queue_and_status", (q) =>
            q.eq("queueId", queue._id).eq("status", status),
          )
          .collect(),
      ),
    );

    return groups.flat().sort((a, b) => a.joinedAt - b.joinedAt);
  },
});
