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

export const COUNTER_STATUSES = {
  AVAILABLE: "AVAILABLE",
  BUSY: "BUSY",
  OFFLINE: "OFFLINE",
} as const;

async function getCounterOrThrow(
  ctx: QueryCtx | MutationCtx,
  counterId: Id<"counters">,
) {
  const counter = await ctx.db.get(counterId);

  if (!counter) {
    throw new Error("Counter not found");
  }

  return counter;
}

async function getQueueOrThrow(
  ctx: QueryCtx | MutationCtx,
  queueId: Id<"queues">,
) {
  const queue = await ctx.db.get(queueId);

  if (!queue) {
    throw new Error("Queue not found");
  }

  return queue;
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

async function validateAssignmentTarget(
  ctx: QueryCtx | MutationCtx,
  businessId: Id<"businesses">,
  queueId?: Id<"queues">,
  serviceId?: Id<"services">,
) {
  const hasQueue = queueId !== undefined;
  const hasService = serviceId !== undefined;

  // Exactly one target is required.
  if (hasQueue === hasService) {
    throw new Error("Assignment must target exactly one queue or service");
  }

  if (queueId) {
    const queue = await getQueueOrThrow(ctx, queueId);

    if (queue.businessId !== businessId) {
      throw new Error("Queue does not belong to this business");
    }

    return;
  }

  if (serviceId) {
    const service = await getServiceOrThrow(ctx, serviceId);

    if (service.businessId !== businessId) {
      throw new Error("Service does not belong to this business");
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Counter CRUD                                                               */
/* -------------------------------------------------------------------------- */

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    number: v.string(),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    const now = Date.now();

    return await ctx.db.insert("counters", {
      businessId: args.businessId,
      name: args.name,
      number: args.number,
      status: COUNTER_STATUSES.OFFLINE,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const get = query({
  args: {
    counterId: v.id("counters"),
  },

  handler: async (ctx, args) => {
    const counter = await getCounterOrThrow(ctx, args.counterId);

    await requireBusinessMember(ctx, counter.businessId);

    return counter;
  },
});

export const getForMember = query({
  args: {
    counterId: v.id("counters"),
  },

  handler: async (ctx, args) => {
    const counter = await getCounterOrThrow(ctx, args.counterId);

    await requireBusinessMember(ctx, counter.businessId);

    return counter;
  },
});

export const list = query({
  args: {
    businessId: v.id("businesses"),
    includeInactive: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    const counters = await ctx.db
      .query("counters")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();

    if (args.includeInactive) {
      return counters;
    }

    return counters.filter((counter) => counter.isActive);
  },
});

export const update = mutation({
  args: {
    counterId: v.id("counters"),
    name: v.optional(v.string()),
    number: v.optional(v.string()),
    status: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const counter = await getCounterOrThrow(ctx, args.counterId);

    await requireBusinessRole(ctx, counter.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    const patch: {
      name?: string;
      number?: string;
      status?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      patch.name = args.name;
    }

    if (args.number !== undefined) {
      patch.number = args.number;
    }

    if (args.status !== undefined) {
      patch.status = args.status;
    }

    await ctx.db.patch(args.counterId, patch);

    return await ctx.db.get(args.counterId);
  },
});

export const activate = mutation({
  args: {
    counterId: v.id("counters"),
  },

  handler: async (ctx, args) => {
    const counter = await getCounterOrThrow(ctx, args.counterId);

    await requireBusinessRole(ctx, counter.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    await ctx.db.patch(args.counterId, {
      isActive: true,
      status: COUNTER_STATUSES.AVAILABLE,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.counterId);
  },
});

export const deactivate = mutation({
  args: {
    counterId: v.id("counters"),
  },

  handler: async (ctx, args) => {
    const counter = await getCounterOrThrow(ctx, args.counterId);

    await requireBusinessRole(ctx, counter.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    if (counter.status === COUNTER_STATUSES.BUSY) {
      throw new Error(
        "Cannot deactivate a counter while it is serving a customer",
      );
    }

    const now = Date.now();

    await ctx.db.patch(counter._id, {
      isActive: false,
      status: COUNTER_STATUSES.OFFLINE,
      updatedAt: now,
    });

    const assignments = await ctx.db
      .query("counterAssignments")
      .withIndex("by_counterId_isActive", (q) =>
        q.eq("counterId", counter._id).eq("isActive", true),
      )
      .collect();

    for (const assignment of assignments) {
      await ctx.db.patch(assignment._id, {
        isActive: false,
        updatedAt: now,
      });
    }

    return await ctx.db.get(counter._id);
  },
});

/* -------------------------------------------------------------------------- */
/* Counter Assignments                                                        */
/* -------------------------------------------------------------------------- */

export const assign = mutation({
  args: {
    counterId: v.id("counters"),
    queueId: v.optional(v.id("queues")),
    serviceId: v.optional(v.id("services")),
  },

  handler: async (ctx, args) => {
    const counter = await getCounterOrThrow(ctx, args.counterId);

    await requireBusinessRole(ctx, counter.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    if (!counter.isActive) {
      throw new Error("Cannot assign an inactive counter");
    }

    if (counter.status === COUNTER_STATUSES.OFFLINE) {
      throw new Error("Cannot assign an offline counter");
    }

    await validateAssignmentTarget(
      ctx,
      counter.businessId,
      args.queueId,
      args.serviceId,
    );

    const existing = await ctx.db
      .query("counterAssignments")
      .withIndex("by_counterId_isActive", (q) =>
        q.eq("counterId", args.counterId).eq("isActive", true),
      )
      .collect();

    const duplicate = existing.some((assignment) => {
      if (args.queueId !== undefined) {
        return assignment.queueId === args.queueId;
      }

      return assignment.serviceId === args.serviceId;
    });

    if (duplicate) {
      throw new Error("This counter is already assigned to this target");
    }

    const now = Date.now();

    return await ctx.db.insert("counterAssignments", {
      counterId: args.counterId,
      queueId: args.queueId,
      serviceId: args.serviceId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeAssignment = mutation({
  args: {
    assignmentId: v.id("counterAssignments"),
  },

  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const counter = await getCounterOrThrow(ctx, assignment.counterId);

    await requireBusinessRole(ctx, counter.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    await ctx.db.patch(args.assignmentId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.assignmentId);
  },
});

export const getAssignments = query({
  args: {
    counterId: v.id("counters"),
    includeInactive: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    const counter = await getCounterOrThrow(ctx, args.counterId);

    await requireBusinessMember(ctx, counter.businessId);

    const assignments = await ctx.db
      .query("counterAssignments")
      .withIndex("by_counterId", (q) => q.eq("counterId", args.counterId))
      .collect();

    if (args.includeInactive) {
      return assignments;
    }

    return assignments.filter((assignment) => assignment.isActive);
  },
});

export const getForQueue = query({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const queue = await getQueueOrThrow(ctx, args.queueId);

    await requireBusinessMember(ctx, queue.businessId);

    const assignments = await ctx.db
      .query("counterAssignments")
      .withIndex("by_queueId", (q) => q.eq("queueId", args.queueId))
      .collect();

    const activeAssignments = assignments.filter(
      (assignment) => assignment.isActive,
    );

    const counters = [];

    for (const assignment of activeAssignments) {
      const counter = await ctx.db.get(assignment.counterId);

      if (counter?.isActive) {
        counters.push(counter);
      }
    }

    return counters;
  },
});

export const getForService = query({
  args: {
    serviceId: v.id("services"),
  },

  handler: async (ctx, args) => {
    const service = await getServiceOrThrow(ctx, args.serviceId);

    await requireBusinessMember(ctx, service.businessId);

    const assignments = await ctx.db
      .query("counterAssignments")
      .withIndex("by_serviceId", (q) => q.eq("serviceId", args.serviceId))
      .collect();

    const activeAssignments = assignments.filter(
      (assignment) => assignment.isActive,
    );

    const counters = [];

    for (const assignment of activeAssignments) {
      const counter = await ctx.db.get(assignment.counterId);

      if (counter?.isActive) {
        counters.push(counter);
      }
    }

    return counters;
  },
});
