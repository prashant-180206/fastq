import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { requireUser } from "../lib/auth";
import { requireBusinessOwner } from "../lib/authorization";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const activeAppointmentStatuses = ["booked", "checked_in"] as const;

const activeTokenStatuses = [
  "waiting",
  "called",
  "checked_in",
  "serving",
] as const;

const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type DbCtx = QueryCtx | MutationCtx;

type Slot = {
  scheduledStart: number;
  scheduledEnd: number;
};

function parseDate(date: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Date must use YYYY-MM-DD format.");
  }

  const timestamp = new Date(`${date}T00:00:00+05:30`).getTime();

  if (!Number.isFinite(timestamp)) {
    throw new Error("Invalid date.");
  }

  // Reject normalized invalid dates such as February 31.
  if (new Date(timestamp + IST_OFFSET_MS).toISOString().slice(0, 10) !== date) {
    throw new Error("Invalid calendar date.");
  }

  return timestamp;
}

function getDayBounds(date: string) {
  const start = parseDate(date);

  return {
    start,
    end: start + 24 * 60 * 60 * 1000,
  };
}

function getWeekday(date: string) {
  return weekdays[new Date(`${date}T12:00:00Z`).getUTCDay()];
}

function timeToMinutes(time: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

  if (!match) {
    throw new Error(`Invalid business-hours time: ${time}`);
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function getSlots(
  business: {
    businessHours?: Array<{
      day: string;
      isOpen: boolean;
      slots: Array<{ open: string; close: string }>;
    }>;
  },
  date: string,
  durationMinutes: number,
): Slot[] {
  const day = business.businessHours?.find(
    (item) => item.day === getWeekday(date),
  );

  if (!day || !day.isOpen) return [];

  const { start: dayStart } = getDayBounds(date);
  const durationMs = durationMinutes * 60_000;
  const slots: Slot[] = [];

  for (const hours of day.slots) {
    const open = timeToMinutes(hours.open);
    const close = timeToMinutes(hours.close);

    if (close <= open) continue;

    const openAt = dayStart + open * 60_000;
    const closeAt = dayStart + close * 60_000;

    for (
      let scheduledStart = openAt;
      scheduledStart + durationMs <= closeAt;
      scheduledStart += durationMs
    ) {
      slots.push({
        scheduledStart,
        scheduledEnd: scheduledStart + durationMs,
      });
    }
  }

  return slots;
}

async function getDayAppointments(
  ctx: DbCtx,
  businessId: Id<"businesses">,
  dayStart: number,
  dayEnd: number,
) {
  return ctx.db
    .query("appointments")
    .withIndex("by_business_and_start", (q) =>
      q
        .eq("businessId", businessId)
        .gte("scheduledStart", dayStart)
        .lt("scheduledStart", dayEnd),
    )
    .collect();
}

async function countActiveQueueTokens(
  ctx: DbCtx,
  businessId: Id<"businesses">,
  dayStart: number,
  dayEnd: number,
) {
  const queues = await ctx.db
    .query("queues")
    .withIndex("by_business", (q) => q.eq("businessId", businessId))
    .collect();

  const counts = await Promise.all(
    queues.map(async (queue) => {
      const groups = await Promise.all(
        activeTokenStatuses.map((status) =>
          ctx.db
            .query("queueTokens")
            .withIndex("by_queue_and_status", (q) =>
              q.eq("queueId", queue._id).eq("status", status),
            )
            .collect(),
        ),
      );

      return groups
        .flat()
        .filter(
          (token) => token.joinedAt >= dayStart && token.joinedAt < dayEnd,
        ).length;
    }),
  );

  return counts.reduce((sum, count) => sum + count, 0);
}

function overlaps(a: Slot, b: Slot) {
  return a.scheduledStart < b.scheduledEnd && a.scheduledEnd > b.scheduledStart;
}

function isActiveAppointment(status: string) {
  return activeAppointmentStatuses.includes(
    status as (typeof activeAppointmentStatuses)[number],
  );
}

/**
 * Customer-facing slot preview.
 * Date is interpreted in Asia/Kolkata (IST).
 */
export const getAvailableSlots = query({
  args: {
    businessId: v.id("businesses"),
    serviceId: v.id("services"),
    date: v.string(),
  },

  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);
    const service = await ctx.db.get(args.serviceId);

    if (!business || business.status !== "active") {
      return {
        date: args.date,
        timezone: "Asia/Kolkata",
        slots: [],
        remainingCapacity: 0,
      };
    }

    if (
      !service ||
      service.businessId !== args.businessId ||
      !service.isActive ||
      !service.appointmentsEnabled
    ) {
      throw new Error("This service is unavailable for appointments.");
    }

    const { start, end } = getDayBounds(args.date);
    const now = Date.now();

    const candidates = getSlots(
      business,
      args.date,
      service.durationMinutes,
    ).filter((slot) => slot.scheduledStart > now);

    const appointments = await getDayAppointments(
      ctx,
      args.businessId,
      start,
      end,
    );

    const activeAppointments = appointments.filter((appointment) =>
      isActiveAppointment(appointment.status),
    );

    const activeQueueTokens = await countActiveQueueTokens(
      ctx,
      args.businessId,
      start,
      end,
    );

    const dailyCapacity = candidates.length;
    const remainingCapacity = Math.max(
      0,
      dailyCapacity - activeAppointments.length - activeQueueTokens,
    );

    const slots = candidates.map((candidate) => ({
      ...candidate,
      available:
        remainingCapacity > 0 &&
        !activeAppointments.some((appointment) =>
          overlaps(candidate, {
            scheduledStart: appointment.scheduledStart,
            scheduledEnd: appointment.scheduledEnd,
          }),
        ),
    }));

    return {
      date: args.date,
      timezone: "Asia/Kolkata",
      serviceDurationMinutes: service.durationMinutes,
      dailyCapacity,
      bookedAppointments: activeAppointments.length,
      activeQueueTokens,
      remainingCapacity,
      slots,
    };
  },
});

/**
 * Atomically validates and creates an appointment.
 * The requested start must match a generated slot exactly.
 */
export const book = mutation({
  args: {
    businessId: v.id("businesses"),
    serviceId: v.id("services"),
    scheduledStart: v.number(),
    notes: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const customer = await requireUser(ctx);
    const now = Date.now();

    if (args.scheduledStart <= now) {
      throw new Error("Choose a future appointment time.");
    }

    const business = await ctx.db.get(args.businessId);
    const service = await ctx.db.get(args.serviceId);

    if (!business || business.status !== "active") {
      throw new Error("This business is unavailable.");
    }

    if (
      !service ||
      service.businessId !== args.businessId ||
      !service.isActive ||
      !service.appointmentsEnabled
    ) {
      throw new Error("This service is unavailable for appointments.");
    }

    const date = new Date(args.scheduledStart + IST_OFFSET_MS)
      .toISOString()
      .slice(0, 10);

    const { start: dayStart, end: dayEnd } = getDayBounds(date);

    const candidates = getSlots(business, date, service.durationMinutes);

    const requestedSlot = candidates.find(
      (slot) => slot.scheduledStart === args.scheduledStart,
    );

    if (!requestedSlot) {
      throw new Error(
        "That time is not a valid appointment slot for this service.",
      );
    }

    const appointments = await getDayAppointments(
      ctx,
      args.businessId,
      dayStart,
      dayEnd,
    );

    const activeAppointments = appointments.filter((appointment) =>
      isActiveAppointment(appointment.status),
    );

    if (
      activeAppointments.some((appointment) =>
        overlaps(requestedSlot, {
          scheduledStart: appointment.scheduledStart,
          scheduledEnd: appointment.scheduledEnd,
        }),
      )
    ) {
      throw new Error("That appointment time has already been taken.");
    }

    const activeQueueTokens = await countActiveQueueTokens(
      ctx,
      args.businessId,
      dayStart,
      dayEnd,
    );

    const dailyCapacity = candidates.length;
    const remainingCapacity =
      dailyCapacity - activeAppointments.length - activeQueueTokens;

    if (remainingCapacity <= 0) {
      throw new Error("There is no remaining capacity for this date.");
    }

    const appointmentId = await ctx.db.insert("appointments", {
      businessId: args.businessId,
      serviceId: args.serviceId,
      userId: customer._id,
      scheduledStart: requestedSlot.scheduledStart,
      scheduledEnd: requestedSlot.scheduledEnd,
      status: "booked",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return {
      appointmentId,
      scheduledStart: requestedSlot.scheduledStart,
      scheduledEnd: requestedSlot.scheduledEnd,
      status: "booked" as const,
    };
  },
});

/** Customer: list their appointments, newest first. */
export const getMyAppointments = query({
  args: {},

  handler: async (ctx) => {
    const customer = await requireUser(ctx);

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_customer", (q) => q.eq("userId", customer._id))
      .collect();

    return appointments.sort((a, b) => b.scheduledStart - a.scheduledStart);
  },
});

/** Business owner: list appointments for a business. */
export const getByBusiness = query({
  args: {
    businessId: v.id("businesses"),
    date: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("booked"),
        v.literal("checked_in"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("no_show"),
      ),
    ),
  },

  handler: async (ctx, args) => {
    await requireBusinessOwner(ctx, args.businessId);

    let appointments;

    if (args.date) {
      const { start, end } = getDayBounds(args.date);
      appointments = await getDayAppointments(ctx, args.businessId, start, end);
    } else {
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_business_and_start", (q) =>
          q.eq("businessId", args.businessId),
        )
        .collect();
    }

    return appointments
      .filter((appointment) =>
        args.status ? appointment.status === args.status : true,
      )
      .sort((a, b) => a.scheduledStart - b.scheduledStart);
  },
});

/** Customer: cancel their own booking before it starts. */
export const cancel = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },

  handler: async (ctx, args) => {
    const customer = await requireUser(ctx);
    const appointment = await ctx.db.get(args.appointmentId);

    if (!appointment || appointment.userId !== customer._id) {
      throw new Error("Appointment not found.");
    }

    if (appointment.status !== "booked") {
      throw new Error("Only booked appointments can be cancelled.");
    }

    if (appointment.scheduledStart <= Date.now()) {
      throw new Error("An appointment cannot be cancelled after it starts.");
    }

    const now = Date.now();

    await ctx.db.patch(appointment._id, {
      status: "cancelled",
      cancelledAt: now,
      updatedAt: now,
    });

    return { success: true, status: "cancelled" as const };
  },
});

/** Business owner: check in a booked customer. */
export const checkIn = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },

  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);

    if (!appointment) {
      throw new Error("Appointment not found.");
    }

    await requireBusinessOwner(ctx, appointment.businessId);

    if (appointment.status !== "booked") {
      throw new Error("Only booked appointments can check in.");
    }

    const now = Date.now();

    await ctx.db.patch(appointment._id, {
      status: "checked_in",
      checkedInAt: now,
      updatedAt: now,
    });

    return { success: true, status: "checked_in" as const };
  },
});

/** Business owner: complete a checked-in appointment. */
export const complete = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },

  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);

    if (!appointment) {
      throw new Error("Appointment not found.");
    }

    await requireBusinessOwner(ctx, appointment.businessId);

    if (appointment.status !== "checked_in") {
      throw new Error("Check in the customer before completing.");
    }

    const now = Date.now();

    await ctx.db.patch(appointment._id, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });

    return { success: true, status: "completed" as const };
  },
});

/** Business owner: record a missed booking. */
export const markNoShow = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },

  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);

    if (!appointment) {
      throw new Error("Appointment not found.");
    }

    await requireBusinessOwner(ctx, appointment.businessId);

    if (appointment.status !== "booked") {
      throw new Error("Only booked appointments can be marked no-show.");
    }

    if (Date.now() < appointment.scheduledEnd) {
      throw new Error(
        "An appointment can only be marked no-show after its scheduled end.",
      );
    }

    const now = Date.now();

    await ctx.db.patch(appointment._id, {
      status: "no_show",
      updatedAt: now,
    });

    return { success: true, status: "no_show" as const };
  },
});

/**
 * Get one appointment, but only if it belongs to the customer.
 */
export const getMyAppointmentById = query({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const appointment = await ctx.db.get(args.appointmentId);

    if (!appointment || appointment.userId !== user._id) {
      return null;
    }

    return appointment;
  },
});
