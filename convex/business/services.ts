import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireBusinessOwner } from "../lib/authorization";

const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 480;

const validateService = (durationMinutes: number) => {
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < MIN_DURATION_MINUTES ||
    durationMinutes > MAX_DURATION_MINUTES
  ) {
    throw new Error(
      `Service duration must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} whole minutes.`,
    );
  }
};

// CREATE SERVICE
export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.optional(v.string()),
    durationMinutes: v.number(),
    queueEnabled: v.boolean(),
    appointmentsEnabled: v.boolean(),
  },

  handler: async (ctx, args) => {
    await requireBusinessOwner(ctx, args.businessId);

    const name = args.name.trim();
    const description = args.description?.trim();

    if (!name) {
      throw new Error("Service name is required.");
    }

    validateService(args.durationMinutes);

    if (!args.queueEnabled && !args.appointmentsEnabled) {
      throw new Error("Enable queues, appointments, or both for this service.");
    }

    const now = Date.now();

    return await ctx.db.insert("services", {
      businessId: args.businessId,
      name,
      description: description || undefined,
      durationMinutes: args.durationMinutes,
      queueEnabled: args.queueEnabled,
      appointmentsEnabled: args.appointmentsEnabled,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// GET ONE SERVICE
export const getById = query({
  args: {
    serviceId: v.id("services"),
  },

  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);

    if (!service) {
      throw new Error("Service not found.");
    }

    await requireBusinessOwner(ctx, service.businessId);

    return service;
  },
});

// LIST SERVICES FOR A BUSINESS
export const getByBusiness = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessOwner(ctx, args.businessId);

    return await ctx.db
      .query("services")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

// LIST ACTIVE SERVICES
export const getActiveByBusiness = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessOwner(ctx, args.businessId);

    return await ctx.db
      .query("services")
      .withIndex("by_business_and_active", (q) =>
        q.eq("businessId", args.businessId).eq("isActive", true),
      )
      .collect();
  },
});

// UPDATE SERVICE
export const update = mutation({
  args: {
    serviceId: v.id("services"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    queueEnabled: v.optional(v.boolean()),
    appointmentsEnabled: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);

    if (!service) {
      throw new Error("Service not found.");
    }

    await requireBusinessOwner(ctx, service.businessId);

    const nextQueueEnabled = args.queueEnabled ?? service.queueEnabled;

    const nextAppointmentsEnabled =
      args.appointmentsEnabled ?? service.appointmentsEnabled;

    const nextIsActive = args.isActive ?? service.isActive;

    if (nextIsActive && !nextQueueEnabled && !nextAppointmentsEnabled) {
      throw new Error(
        "An active service must support queues, appointments, or both.",
      );
    }

    const patch: {
      name?: string;
      description?: string;
      durationMinutes?: number;
      queueEnabled?: boolean;
      appointmentsEnabled?: boolean;
      isActive?: boolean;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      const name = args.name.trim();

      if (!name) {
        throw new Error("Service name cannot be empty.");
      }

      patch.name = name;
    }

    if (args.description !== undefined) {
      patch.description = args.description.trim() || undefined;
    }

    if (args.durationMinutes !== undefined) {
      validateService(args.durationMinutes);
      patch.durationMinutes = args.durationMinutes;
    }

    if (args.queueEnabled !== undefined) {
      patch.queueEnabled = args.queueEnabled;
    }

    if (args.appointmentsEnabled !== undefined) {
      patch.appointmentsEnabled = args.appointmentsEnabled;
    }

    if (args.isActive !== undefined) {
      patch.isActive = args.isActive;
    }

    await ctx.db.patch(args.serviceId, patch);

    return await ctx.db.get(args.serviceId);
  },
});

// DELETE SERVICE
export const remove = mutation({
  args: {
    serviceId: v.id("services"),
  },

  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);

    if (!service) {
      throw new Error("Service not found.");
    }

    await requireBusinessOwner(ctx, service.businessId);

    // Prevent deleting a service referenced by a queue.
    const queues = await ctx.db
      .query("queues")
      .withIndex("by_business", (q) => q.eq("businessId", service.businessId))
      .collect();

    if (queues.some((queue) => queue.serviceId === service._id)) {
      throw new Error(
        "This service is assigned to a queue. Remove or reassign the queue first.",
      );
    }

    // Prevent deleting a service referenced by appointments.
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_service_and_start", (q) => q.eq("serviceId", service._id))
      .collect();

    if (appointments.length > 0) {
      throw new Error(
        "This service has appointment records. Deactivate it instead to preserve booking history.",
      );
    }

    await ctx.db.delete(service._id);

    return { success: true };
  },
});

export const getPublicByBusiness = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);

    if (!business || business.status !== "active") {
      return [];
    }

    const services = await ctx.db
      .query("services")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();

    return services
      .filter(
        (service) =>
          service.isActive &&
          (service.queueEnabled || service.appointmentsEnabled),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((service) => ({
        _id: service._id,
        businessId: service.businessId,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        queueEnabled: service.queueEnabled,
        appointmentsEnabled: service.appointmentsEnabled,
      }));
  },
});
