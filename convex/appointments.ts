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
import { requireUser } from "./lib/auth";
import { createQueueEvent, TOKEN_STATUS } from "./queues";

const APPOINTMENT_STATUS = {
  BOOKED: "BOOKED",
  CHECKED_IN: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;

async function getAppointmentOrThrow(
  ctx: QueryCtx | MutationCtx,
  appointmentId: Id<"appointments">,
) {
  const appointment = await ctx.db.get(appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return appointment;
}

async function getSlotOrThrow(
  ctx: QueryCtx | MutationCtx,
  slotId: Id<"appointmentSlots">,
) {
  const slot = await ctx.db.get(slotId);

  if (!slot) {
    throw new Error("Appointment slot not found");
  }

  return slot;
}

async function getServiceOrThrow(
  ctx: QueryCtx | MutationCtx,
  serviceId: Id<"services">,
) {
  const service = await ctx.db.get(serviceId);

  if (!service) {
    throw new Error("Service not found");
  }

  return service;
}

async function createAppointmentEvent(
  ctx: MutationCtx,
  {
    appointmentId,
    type,
    actorId,
    metadata,
  }: {
    appointmentId: Id<"appointments">;
    type: string;
    actorId?: Id<"users">;
    metadata?: unknown;
  },
) {
  await ctx.db.insert("appointmentEvents", {
    appointmentId,
    type,
    actorId,
    metadata,
    createdAt: Date.now(),
  });
}

function getScheduledTimes(date: string, startTime: string, endTime: string) {
  const scheduledStart = new Date(`${date}T${startTime}:00`).getTime();

  const scheduledEnd = new Date(`${date}T${endTime}:00`).getTime();

  if (Number.isNaN(scheduledStart) || Number.isNaN(scheduledEnd)) {
    throw new Error("Invalid appointment date or time");
  }

  if (scheduledStart >= scheduledEnd) {
    throw new Error("Appointment end time must be after start time");
  }

  return {
    scheduledStart,
    scheduledEnd,
  };
}

/* -------------------------------------------------------------------------- */
/* Booking                                                                    */
/* -------------------------------------------------------------------------- */

export const book = mutation({
  args: {
    slotId: v.id("appointmentSlots"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const slot = await getSlotOrThrow(ctx, args.slotId);

    if (!slot.isAvailable) {
      throw new Error("This appointment slot is unavailable");
    }

    if (slot.bookedCount >= slot.capacity) {
      throw new Error("This appointment slot is fully booked");
    }

    const service = await getServiceOrThrow(ctx, slot.serviceId);

    if (!service.isActive) {
      throw new Error("Service is inactive");
    }

    if (!service.appointmentsEnabled) {
      throw new Error("Appointments are disabled for this service");
    }

    const business = await ctx.db.get(slot.businessId);

    if (!business || !business.isActive) {
      throw new Error("Business is inactive");
    }

    const settings = await ctx.db
      .query("businessSettings")
      .withIndex("by_businessId", (q) => q.eq("businessId", slot.businessId))
      .unique();

    if (!settings?.appointmentsEnabled) {
      throw new Error("Appointments are disabled for this business");
    }

    /*
     * Prevent the same user from booking the same slot
     * multiple times.
     */
    const existingAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_appointmentSlotId", (q) =>
        q.eq("appointmentSlotId", args.slotId),
      )
      .collect();

    const alreadyBooked = existingAppointments.some(
      (appointment) =>
        appointment.userId === user._id &&
        appointment.status !== APPOINTMENT_STATUS.CANCELLED &&
        appointment.status !== APPOINTMENT_STATUS.NO_SHOW,
    );

    if (alreadyBooked) {
      throw new Error("You already have an appointment for this slot");
    }

    const { scheduledStart, scheduledEnd } = getScheduledTimes(
      slot.date,
      slot.startTime,
      slot.endTime,
    );

    const now = Date.now();

    const appointmentId = await ctx.db.insert("appointments", {
      businessId: slot.businessId,
      serviceId: slot.serviceId,
      userId: user._id,
      appointmentSlotId: slot._id,
      status: APPOINTMENT_STATUS.BOOKED,
      scheduledStart,
      scheduledEnd,
      createdAt: now,
    });

    await ctx.db.patch(slot._id, {
      bookedCount: slot.bookedCount + 1,
      isAvailable: slot.bookedCount + 1 < slot.capacity,
    });

    await createAppointmentEvent(ctx, {
      appointmentId,
      type: "BOOKED",
      actorId: user._id,
      metadata: {
        slotId: slot._id,
      },
    });

    return await ctx.db.get(appointmentId);
  },
});

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

export const get = query({
  args: {
    appointmentId: v.id("appointments"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const appointment = await getAppointmentOrThrow(ctx, args.appointmentId);

    const isOwner = appointment.userId === user._id;

    if (isOwner) {
      return appointment;
    }

    await requireBusinessMember(ctx, appointment.businessId);

    return appointment;
  },
});

export const getMyAppointment = query({
  args: {
    appointmentId: v.id("appointments"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const appointment = await getAppointmentOrThrow(ctx, args.appointmentId);

    if (appointment.userId !== user._id) {
      throw new Error("You do not have access to this appointment");
    }

    return appointment;
  },
});

export const listMyAppointments = query({
  args: {
    status: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    let appointments;

    if (args.status) {
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_userId_status", (q) =>
          q.eq("userId", user._id).eq("status", args.status!),
        )
        .collect();
    } else {
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
    }

    return appointments.sort((a, b) => a.scheduledStart - b.scheduledStart);
  },
});

export const listForBusiness = query({
  args: {
    businessId: v.id("businesses"),
    status: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    let appointments;

    if (args.status) {
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_businessId_status", (q) =>
          q.eq("businessId", args.businessId).eq("status", args.status!),
        )
        .collect();
    } else {
      appointments = await ctx.db
        .query("appointments")
        .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
        .collect();
    }

    return appointments.sort((a, b) => a.scheduledStart - b.scheduledStart);
  },
});

/* -------------------------------------------------------------------------- */
/* Cancellation                                                               */
/* -------------------------------------------------------------------------- */

export const cancel = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const appointment = await getAppointmentOrThrow(ctx, args.appointmentId);

    const isOwner = appointment.userId === user._id;

    if (!isOwner) {
      await requireBusinessRole(ctx, appointment.businessId, [
        "OWNER",
        "ADMIN",
        "MANAGER",
      ]);
    }

    // --------------------------------------------------------
    // Validate appointment state
    // --------------------------------------------------------

    if (
      appointment.status === APPOINTMENT_STATUS.CANCELLED ||
      appointment.status === APPOINTMENT_STATUS.COMPLETED ||
      appointment.status === APPOINTMENT_STATUS.NO_SHOW
    ) {
      throw new Error("Appointment cannot be cancelled in its current state");
    }

    // --------------------------------------------------------
    // Check whether this appointment has an active queue token
    // --------------------------------------------------------

    const activeQueueToken = await ctx.db
      .query("queueTokens")
      .withIndex("by_appointmentId", (q) =>
        q.eq("appointmentId", appointment._id),
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "WAITING"),
          q.eq(q.field("status"), "CALLED"),
          q.eq(q.field("status"), "SERVING"),
        ),
      )
      .first();

    // A customer cannot cancel once actual service has started.
    if (activeQueueToken?.status === "SERVING") {
      throw new Error(
        "An appointment cannot be cancelled while service is in progress",
      );
    }

    // --------------------------------------------------------
    // Get appointment slot
    // --------------------------------------------------------

    const slot = await getSlotOrThrow(ctx, appointment.appointmentSlotId);

    const now = Date.now();

    // --------------------------------------------------------
    // Cancel appointment
    // --------------------------------------------------------

    await ctx.db.patch(args.appointmentId, {
      status: APPOINTMENT_STATUS.CANCELLED,
      cancelledAt: now,
    });

    // --------------------------------------------------------
    // Cancel linked queue token
    // --------------------------------------------------------

    if (activeQueueToken) {
      await ctx.db.patch(activeQueueToken._id, {
        status: "CANCELLED",
        cancelledAt: now,
      });

      await ctx.db.insert("queueEvents", {
        queueId: activeQueueToken.queueId,
        tokenId: activeQueueToken._id,
        eventType: "CANCELLED",
        actorId: user._id,
        metadata: {
          source: "APPOINTMENT",
          appointmentId: appointment._id,
        },
        createdAt: now,
      });
    }

    // --------------------------------------------------------
    // Release appointment slot capacity
    // --------------------------------------------------------

    const bookedCount = Math.max(0, slot.bookedCount - 1);

    await ctx.db.patch(appointment.appointmentSlotId, {
      bookedCount,
      isAvailable: bookedCount < slot.capacity,
    });

    // --------------------------------------------------------
    // Record appointment event
    // --------------------------------------------------------

    await createAppointmentEvent(ctx, {
      appointmentId: args.appointmentId,
      type: "CANCELLED",
      actorId: user._id,
      metadata: {
        queueTokenId: activeQueueToken?._id,
      },
    });

    return await ctx.db.get(args.appointmentId);
  },
});

/* -------------------------------------------------------------------------- */
/* Check-in                                                                   */
/* -------------------------------------------------------------------------- */

export const checkIn = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const appointment = await getAppointmentOrThrow(ctx, args.appointmentId);

    const isCustomer = appointment.userId === user._id;

    if (!isCustomer) {
      await requireBusinessRole(ctx, appointment.businessId, [
        "OWNER",
        "ADMIN",
        "MANAGER",
        "STAFF",
      ]);
    }

    if (appointment.status !== APPOINTMENT_STATUS.BOOKED) {
      throw new Error("Only booked appointments can be checked in");
    }

    const now = Date.now();

    await ctx.db.patch(args.appointmentId, {
      status: APPOINTMENT_STATUS.CHECKED_IN,
      checkedInAt: now,
    });

    await createAppointmentEvent(ctx, {
      appointmentId: args.appointmentId,
      type: "CHECKED_IN",
      actorId: user._id,
    });

    return await ctx.db.get(args.appointmentId);
  },
});

/* -------------------------------------------------------------------------- */
/* Completion                                                                 */
/* -------------------------------------------------------------------------- */

export const complete = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },

  handler: async (ctx, args) => {
    const appointment = await getAppointmentOrThrow(ctx, args.appointmentId);

    const { user } = await requireBusinessRole(ctx, appointment.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
      "STAFF",
    ]);

    if (appointment.status !== APPOINTMENT_STATUS.CHECKED_IN) {
      throw new Error("Only checked-in appointments can be completed");
    }

    // --------------------------------------------------------
    // Find the active queue token associated with this appointment
    // --------------------------------------------------------

    const token = await ctx.db
      .query("queueTokens")
      .withIndex("by_appointmentId", (q) =>
        q.eq("appointmentId", appointment._id),
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "WAITING"),
          q.eq(q.field("status"), "CALLED"),
          q.eq(q.field("status"), "SERVING"),
        ),
      )
      .first();

    const now = Date.now();

    // --------------------------------------------------------
    // Complete queue token if one exists
    // --------------------------------------------------------

    if (token) {
      await ctx.db.patch(token._id, {
        status: "COMPLETED",
        completedAt: now,
      });

      await createQueueEvent(ctx, {
        queueId: token.queueId,
        tokenId: token._id,
        eventType: "COMPLETED",
        actorId: user._id,
        metadata: {
          source: "APPOINTMENT",
          appointmentId: appointment._id,
        },
      });
    }

    // --------------------------------------------------------
    // Complete appointment
    // --------------------------------------------------------

    await ctx.db.patch(appointment._id, {
      status: APPOINTMENT_STATUS.COMPLETED,
      completedAt: now,
    });

    await createAppointmentEvent(ctx, {
      appointmentId: appointment._id,
      type: "COMPLETED",
      actorId: user._id,
      metadata: {
        source: token ? "QUEUE" : "APPOINTMENT",
        queueTokenId: token?._id,
      },
    });

    return await ctx.db.get(appointment._id);
  },
});

/* -------------------------------------------------------------------------- */
/* No-show                                                                    */
/* -------------------------------------------------------------------------- */

export const markNoShow = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },

  handler: async (ctx, args) => {
    const appointment = await getAppointmentOrThrow(ctx, args.appointmentId);

    const { user } = await requireBusinessRole(ctx, appointment.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
      "STAFF",
    ]);

    if (appointment.status !== APPOINTMENT_STATUS.BOOKED) {
      throw new Error("Only booked appointments can be marked as no-show");
    }

    await ctx.db.patch(args.appointmentId, {
      status: APPOINTMENT_STATUS.NO_SHOW,
    });

    await createAppointmentEvent(ctx, {
      appointmentId: args.appointmentId,
      type: "NO_SHOW",
      actorId: user._id,
    });

    return await ctx.db.get(args.appointmentId);
  },
});

/* -------------------------------------------------------------------------- */
/* Appointment events                                                        */
/* -------------------------------------------------------------------------- */

export const getEvents = query({
  args: {
    appointmentId: v.id("appointments"),
  },

  handler: async (ctx, args) => {
    const appointment = await getAppointmentOrThrow(ctx, args.appointmentId);

    const user = await requireUser(ctx);

    const isCustomer = appointment.userId === user._id;

    if (!isCustomer) {
      await requireBusinessMember(ctx, appointment.businessId);
    }

    return await ctx.db
      .query("appointmentEvents")
      .withIndex("by_appointmentId_createdAt", (q) =>
        q.eq("appointmentId", args.appointmentId),
      )
      .collect();
  },
});
