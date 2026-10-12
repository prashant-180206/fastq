import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireBusinessOwner } from "./lib/authorization";
import { Id } from "./_generated/dataModel";

// Shared validators
const prerequisiteValidator = v.object({
  id: v.string(),
  label: v.string(),
  description: v.optional(v.string()),
  isRequired: v.boolean(),
});

const queueStatusValidator = v.union(
  v.literal("active"),
  v.literal("paused"),
  v.literal("closed"),
);

const validatePrerequisites = (
  prerequisites: Array<{
    id: string;
    label: string;
    description?: string;
    isRequired: boolean;
  }>,
) => {
  const ids = new Set<string>();

  for (const prerequisite of prerequisites) {
    const id = prerequisite.id.trim();
    const label = prerequisite.label.trim();

    if (!id) {
      throw new Error("Prerequisite ID cannot be empty.");
    }

    if (!label) {
      throw new Error("Prerequisite label cannot be empty.");
    }

    if (ids.has(id)) {
      throw new Error(`Duplicate prerequisite ID: ${id}`);
    }

    ids.add(id);
  }
};

// CREATE QUEUE
export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    description: v.string(),
    prerequisites: v.array(prerequisiteValidator),
    serviceId: v.id("services"),
  },

  handler: async (ctx, args) => {
    await requireBusinessOwner(ctx, args.businessId);

    const name = args.name.trim();
    const description = args.description.trim();

    if (!name) {
      throw new Error("Queue name is required.");
    }

    if (!description) {
      throw new Error("Queue description is required.");
    }

    validatePrerequisites(args.prerequisites);

    const service = await ctx.db.get(args.serviceId);

    if (!service || service.businessId !== args.businessId) {
      throw new Error("The selected service does not belong to this business.");
    }

    if (!service.isActive || !service.queueEnabled) {
      throw new Error("The selected service is not available for queues.");
    }

    const now = Date.now();

    return await ctx.db.insert("queues", {
      businessId: args.businessId,
      name,
      description,
      serviceId: service._id,
      prerequisites: args.prerequisites.map((item) => ({
        ...item,
        id: item.id.trim(),
        label: item.label.trim(),
        description: item.description?.trim() || undefined,
      })),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// GET ONE QUEUE
export const getById = query({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);

    if (!queue) {
      throw new Error("Queue not found.");
    }

    await requireBusinessOwner(ctx, queue.businessId);

    return queue;
  },
});

// LIST QUEUES FOR A BUSINESS
export const getByBusiness = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessOwner(ctx, args.businessId);

    return await ctx.db
      .query("queues")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect();
  },
});

// LIST ACTIVE QUEUES FOR A BUSINESS
export const getActiveByBusiness = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessOwner(ctx, args.businessId);

    return await ctx.db
      .query("queues")
      .withIndex("by_business_and_status", (q) =>
        q.eq("businessId", args.businessId).eq("status", "active"),
      )
      .collect();
  },
});

// UPDATE QUEUE
export const update = mutation({
  args: {
    queueId: v.id("queues"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    prerequisites: v.optional(v.array(prerequisiteValidator)),
    status: v.optional(queueStatusValidator),
    serviceId: v.optional(v.id("services")),
  },

  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);

    if (!queue) {
      throw new Error("Queue not found.");
    }

    await requireBusinessOwner(ctx, queue.businessId);

    if (args.serviceId) {
      const service = await ctx.db.get(args.serviceId);

      if (!service || service.businessId !== queue.businessId) {
        throw new Error(
          "The selected service does not belong to this business.",
        );
      }

      if (!service.isActive || !service.queueEnabled) {
        throw new Error("The selected service is not available for queues.");
      }
    }

    const patch: {
      name?: string;
      description?: string;
      serviceId?: Id<"services">;
      prerequisites?: Array<{
        id: string;
        label: string;
        description?: string;
        isRequired: boolean;
      }>;
      status?: "active" | "paused" | "closed";
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      const name = args.name.trim();

      if (!name) {
        throw new Error("Queue name cannot be empty.");
      }

      patch.name = name;
    }

    if (args.description !== undefined) {
      const description = args.description.trim();

      if (!description) {
        throw new Error("Queue description cannot be empty.");
      }

      patch.description = description;
    }

    if (args.prerequisites !== undefined) {
      validatePrerequisites(args.prerequisites);

      patch.prerequisites = args.prerequisites.map((item) => ({
        ...item,
        id: item.id.trim(),
        label: item.label.trim(),
        description: item.description?.trim() || undefined,
      }));
    }

    if (args.status !== undefined) {
      patch.status = args.status;
    }

    await ctx.db.patch(args.queueId, patch);

    return await ctx.db.get(args.queueId);
  },
});

// DELETE QUEUE
export const remove = mutation({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);

    if (!queue) {
      throw new Error("Queue not found.");
    }

    await requireBusinessOwner(ctx, queue.businessId);

    await ctx.db.delete(args.queueId);

    return { success: true };
  },
});
