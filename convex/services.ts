import { mutation, query } from "./_generated/server";

import { v } from "convex/values";

import {
  requireBusinessMember,
  requireBusinessRole,
} from "./lib/authorization";

// ============================================================
// CREATE SERVICE
// ============================================================

export const create = mutation({
  args: {
    businessId: v.id("businesses"),

    name: v.string(),
    description: v.optional(v.string()),

    type: v.string(),

    queueEnabled: v.boolean(),
    appointmentsEnabled: v.boolean(),

    appointmentDuration: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, ["OWNER", "MANAGER"]);

    // --------------------------------------------------------
    // Validate appointment configuration
    // --------------------------------------------------------

    if (
      args.appointmentsEnabled &&
      (!args.appointmentDuration || args.appointmentDuration <= 0)
    ) {
      throw new Error(
        "Appointment duration is required when appointments are enabled",
      );
    }

    // --------------------------------------------------------
    // Validate business settings
    // --------------------------------------------------------

    const settings = await ctx.db
      .query("businessSettings")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .unique();

    if (!settings) {
      throw new Error("Business settings not found");
    }

    if (args.queueEnabled && !settings.queueEnabled) {
      throw new Error("Queues are disabled for this business");
    }

    if (args.appointmentsEnabled && !settings.appointmentsEnabled) {
      throw new Error("Appointments are disabled for this business");
    }

    const now = Date.now();

    return await ctx.db.insert("services", {
      businessId: args.businessId,

      name: args.name,
      description: args.description,

      type: args.type,

      queueEnabled: args.queueEnabled,
      appointmentsEnabled: args.appointmentsEnabled,

      appointmentDuration: args.appointmentDuration,

      isActive: true,

      createdAt: now,
      updatedAt: now,
    });
  },
});

// ============================================================
// GET SERVICE
// ============================================================

export const get = query({
  args: {
    serviceId: v.id("services"),
  },

  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);

    if (!service || !service.isActive) {
      return null;
    }

    const business = await ctx.db.get(service.businessId);

    if (!business || !business.isActive) {
      return null;
    }

    return service;
  },
});

// ============================================================
// GET SERVICE FOR BUSINESS MEMBER
// ============================================================

export const getForMember = query({
  args: {
    serviceId: v.id("services"),
  },

  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);

    if (!service) {
      return null;
    }

    await requireBusinessMember(ctx, service.businessId);

    return service;
  },
});

// ============================================================
// LIST SERVICES
// ============================================================

export const list = query({
  args: {
    businessId: v.id("businesses"),
    activeOnly: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    const services = await ctx.db
      .query("services")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();

    if (args.activeOnly) {
      return services.filter((service) => service.isActive);
    }

    return services;
  },
});

// ============================================================
// LIST PUBLIC SERVICES
// ============================================================
//
// Used by customers discovering a business.
//
// Only active services are returned.
//

export const listPublic = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);

    if (!business || !business.isActive) {
      return [];
    }

    return await ctx.db
      .query("services")
      .withIndex("by_businessId_isActive", (q) =>
        q.eq("businessId", args.businessId).eq("isActive", true),
      )
      .collect();
  },
});

// ============================================================
// UPDATE SERVICE
// ============================================================

export const update = mutation({
  args: {
    serviceId: v.id("services"),

    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),

    queueEnabled: v.optional(v.boolean()),
    appointmentsEnabled: v.optional(v.boolean()),

    appointmentDuration: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);

    if (!service) {
      throw new Error("Service not found");
    }

    await requireBusinessRole(ctx, service.businessId, ["OWNER", "MANAGER"]);

    // --------------------------------------------------------
    // Resolve final values
    // --------------------------------------------------------

    const queueEnabled = args.queueEnabled ?? service.queueEnabled;

    const appointmentsEnabled =
      args.appointmentsEnabled ?? service.appointmentsEnabled;

    const appointmentDuration =
      args.appointmentDuration ?? service.appointmentDuration;

    // --------------------------------------------------------
    // Validate business settings
    // --------------------------------------------------------

    const settings = await ctx.db
      .query("businessSettings")
      .withIndex("by_businessId", (q) => q.eq("businessId", service.businessId))
      .unique();

    if (!settings) {
      throw new Error("Business settings not found");
    }

    if (queueEnabled && !settings.queueEnabled) {
      throw new Error("Queues are disabled for this business");
    }

    if (appointmentsEnabled && !settings.appointmentsEnabled) {
      throw new Error("Appointments are disabled for this business");
    }

    if (
      appointmentsEnabled &&
      (!appointmentDuration || appointmentDuration <= 0)
    ) {
      throw new Error(
        "Appointment duration is required when appointments are enabled",
      );
    }

    await ctx.db.patch(args.serviceId, {
      name: args.name,
      description: args.description,
      type: args.type,

      queueEnabled,
      appointmentsEnabled,

      appointmentDuration,

      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.serviceId);
  },
});

// ============================================================
// ENABLE QUEUE
// ============================================================

export const enableQueue = mutation({
  args: {
    serviceId: v.id("services"),
  },

  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);

    if (!service) {
      throw new Error("Service not found");
    }

    await requireBusinessRole(ctx, service.businessId, ["OWNER", "MANAGER"]);

    const settings = await ctx.db
      .query("businessSettings")
      .withIndex("by_businessId", (q) => q.eq("businessId", service.businessId))
      .unique();

    if (!settings?.queueEnabled) {
      throw new Error("Queues are disabled for this business");
    }

    await ctx.db.patch(args.serviceId, {
      queueEnabled: true,
      updatedAt: Date.now(),
    });
  },
});

// ============================================================
// DISABLE QUEUE
// ============================================================

// ============================================================
// DISABLE QUEUE
// ============================================================

export const disableQueue = mutation({
  args: {
    serviceId: v.id("services"),
  },

  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);

    if (!service) {
      throw new Error("Service not found");
    }

    await requireBusinessRole(ctx, service.businessId, ["OWNER", "MANAGER"]);

    if (!service.queueEnabled) {
      return service;
    }

    const queues = await ctx.db
      .query("queues")
      .withIndex("by_serviceId", (q) => q.eq("serviceId", service._id))
      .collect();

    const now = Date.now();

    for (const queue of queues) {
      if (queue.status === "ACTIVE") {
        await ctx.db.patch(queue._id, {
          status: "PAUSED",
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(service._id, {
      queueEnabled: false,
      updatedAt: now,
    });

    return await ctx.db.get(service._id);
  },
});

// ============================================================
// ENABLE APPOINTMENTS
// ============================================================

export const enableAppointments = mutation({
  args: {
    serviceId: v.id("services"),

    appointmentDuration: v.number(),
  },

  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);

    if (!service) {
      throw new Error("Service not found");
    }

    await requireBusinessRole(ctx, service.businessId, ["OWNER", "MANAGER"]);

    if (args.appointmentDuration <= 0) {
      throw new Error("Appointment duration must be greater than zero");
    }

    const settings = await ctx.db
      .query("businessSettings")
      .withIndex("by_businessId", (q) => q.eq("businessId", service.businessId))
      .unique();

    if (!settings?.appointmentsEnabled) {
      throw new Error("Appointments are disabled for this business");
    }

    await ctx.db.patch(args.serviceId, {
      appointmentsEnabled: true,

      appointmentDuration: args.appointmentDuration,

      updatedAt: Date.now(),
    });
  },
});

// ============================================================
// DISABLE APPOINTMENTS
// ============================================================

export const disableAppointments = mutation({
  args: {
    serviceId: v.id("services"),
  },

  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);

    if (!service) {
      throw new Error("Service not found");
    }

    await requireBusinessRole(ctx, service.businessId, ["OWNER", "MANAGER"]);

    await ctx.db.patch(args.serviceId, {
      appointmentsEnabled: false,
      updatedAt: Date.now(),
    });
  },
});

// ============================================================
// DEACTIVATE SERVICE
// ============================================================

export const deactivate = mutation({
  args: {
    serviceId: v.id("services"),
  },

  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);

    if (!service) {
      throw new Error("Service not found");
    }

    await requireBusinessRole(ctx, service.businessId, ["OWNER", "MANAGER"]);

    await ctx.db.patch(args.serviceId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return true;
  },
});
