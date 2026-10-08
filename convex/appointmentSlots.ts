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

async function validateService(
  ctx: QueryCtx | MutationCtx,
  businessId: Id<"businesses">,
  serviceId: Id<"services">,
) {
  const service = await ctx.db.get(serviceId);

  if (!service) {
    throw new Error("Service not found");
  }

  if (service.businessId !== businessId) {
    throw new Error("Service does not belong to this business");
  }

  if (!service.isActive) {
    throw new Error("Service is inactive");
  }

  if (!service.appointmentsEnabled) {
    throw new Error("Appointments are disabled for this service");
  }

  return service;
}

/* -------------------------------------------------------------------------- */
/* Slot management                                                            */
/* -------------------------------------------------------------------------- */

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    serviceId: v.id("services"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    capacity: v.number(),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    if (args.capacity <= 0) {
      throw new Error("Slot capacity must be greater than zero");
    }

    if (args.startTime >= args.endTime) {
      throw new Error("Slot end time must be after start time");
    }

    await validateService(ctx, args.businessId, args.serviceId);

    const existing = await ctx.db
      .query("appointmentSlots")
      .withIndex("by_businessId_serviceId_date", (q) =>
        q
          .eq("businessId", args.businessId)
          .eq("serviceId", args.serviceId)
          .eq("date", args.date),
      )
      .collect();

    const overlaps = existing.some(
      (slot) => slot.startTime < args.endTime && args.startTime < slot.endTime,
    );

    if (overlaps) {
      throw new Error("This slot overlaps an existing slot");
    }

    return await ctx.db.insert("appointmentSlots", {
      businessId: args.businessId,
      serviceId: args.serviceId,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      capacity: args.capacity,
      bookedCount: 0,
      isAvailable: true,
    });
  },
});

export const get = query({
  args: {
    slotId: v.id("appointmentSlots"),
  },

  handler: async (ctx, args) => {
    const slot = await getSlotOrThrow(ctx, args.slotId);

    await requireBusinessMember(ctx, slot.businessId);

    return slot;
  },
});

export const list = query({
  args: {
    businessId: v.id("businesses"),
    serviceId: v.optional(v.id("services")),
    date: v.optional(v.string()),
    includeUnavailable: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    let slots;

    if (args.serviceId && args.date) {
      slots = await ctx.db
        .query("appointmentSlots")
        .withIndex("by_businessId_serviceId_date", (q) =>
          q
            .eq("businessId", args.businessId)
            .eq("serviceId", args.serviceId!)
            .eq("date", args.date!),
        )
        .collect();
    } else if (args.date) {
      slots = await ctx.db
        .query("appointmentSlots")
        .withIndex("by_businessId_date", (q) =>
          q.eq("businessId", args.businessId).eq("date", args.date!),
        )
        .collect();
    } else if (args.serviceId) {
      slots = await ctx.db
        .query("appointmentSlots")
        .withIndex("by_serviceId", (q) => q.eq("serviceId", args.serviceId!))
        .collect();

      slots = slots.filter((slot) => slot.businessId === args.businessId);
    } else {
      slots = await ctx.db
        .query("appointmentSlots")
        .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
        .collect();
    }

    if (args.includeUnavailable) {
      return slots;
    }

    return slots.filter(
      (slot) => slot.isAvailable && slot.bookedCount < slot.capacity,
    );
  },
});

export const listPublic = query({
  args: {
    businessId: v.id("businesses"),
    serviceId: v.id("services"),
    date: v.string(),
  },

  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);

    if (
      !service ||
      service.businessId !== args.businessId ||
      !service.isActive ||
      !service.appointmentsEnabled
    ) {
      return [];
    }

    const slots = await ctx.db
      .query("appointmentSlots")
      .withIndex("by_businessId_serviceId_date", (q) =>
        q
          .eq("businessId", args.businessId)
          .eq("serviceId", args.serviceId)
          .eq("date", args.date),
      )
      .collect();

    return slots.filter(
      (slot) => slot.isAvailable && slot.bookedCount < slot.capacity,
    );
  },
});

export const update = mutation({
  args: {
    slotId: v.id("appointmentSlots"),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    capacity: v.optional(v.number()),
    isAvailable: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    const slot = await getSlotOrThrow(ctx, args.slotId);

    await requireBusinessRole(ctx, slot.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    const newStart = args.startTime ?? slot.startTime;

    const newEnd = args.endTime ?? slot.endTime;

    const newCapacity = args.capacity ?? slot.capacity;

    if (newStart >= newEnd) {
      throw new Error("Slot end time must be after start time");
    }

    if (newCapacity <= 0) {
      throw new Error("Slot capacity must be greater than zero");
    }

    if (newCapacity < slot.bookedCount) {
      throw new Error("Capacity cannot be lower than current bookings");
    }

    const existing = await ctx.db
      .query("appointmentSlots")
      .withIndex("by_businessId_serviceId_date", (q) =>
        q
          .eq("businessId", slot.businessId)
          .eq("serviceId", slot.serviceId)
          .eq("date", slot.date),
      )
      .collect();

    const overlaps = existing.some(
      (other) =>
        other._id !== slot._id &&
        other.startTime < newEnd &&
        newStart < other.endTime,
    );

    if (overlaps) {
      throw new Error("Updated slot overlaps an existing slot");
    }

    await ctx.db.patch(args.slotId, {
      startTime: newStart,
      endTime: newEnd,
      capacity: newCapacity,
      isAvailable: args.isAvailable ?? slot.isAvailable,
    });

    return await ctx.db.get(args.slotId);
  },
});

export const close = mutation({
  args: {
    slotId: v.id("appointmentSlots"),
  },

  handler: async (ctx, args) => {
    const slot = await getSlotOrThrow(ctx, args.slotId);

    await requireBusinessRole(ctx, slot.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    await ctx.db.patch(args.slotId, {
      isAvailable: false,
    });

    return await ctx.db.get(args.slotId);
  },
});

export const reopen = mutation({
  args: {
    slotId: v.id("appointmentSlots"),
  },

  handler: async (ctx, args) => {
    const slot = await getSlotOrThrow(ctx, args.slotId);

    await requireBusinessRole(ctx, slot.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    if (slot.bookedCount >= slot.capacity) {
      throw new Error("Cannot reopen a fully booked slot");
    }

    await ctx.db.patch(args.slotId, {
      isAvailable: true,
    });

    return await ctx.db.get(args.slotId);
  },
});

export const deleteSlot = mutation({
  args: {
    slotId: v.id("appointmentSlots"),
  },

  handler: async (ctx, args) => {
    const slot = await getSlotOrThrow(ctx, args.slotId);

    await requireBusinessRole(ctx, slot.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    if (slot.bookedCount > 0) {
      throw new Error("Cannot delete a slot with existing bookings");
    }

    await ctx.db.delete(args.slotId);

    return true;
  },
});
