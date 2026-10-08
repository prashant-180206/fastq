import {
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";

import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";

import {
  requireBusinessMember,
  requireBusinessRole,
} from "./lib/authorization";

import { requireUser } from "./lib/auth";
import { COUNTER_STATUSES } from "./counters";

// ============================================================
// QUEUE STATUS
// ============================================================

export const QUEUE_STATUS = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  CLOSED: "CLOSED",
} as const;

export const TOKEN_STATUS = {
  WAITING: "WAITING",
  CALLED: "CALLED",
  SERVING: "SERVING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  SKIPPED: "SKIPPED",
  NO_SHOW: "NO_SHOW",
} as const;

const APPOINTMENT_STATUS = {
  BOOKED: "BOOKED",
  CHECKED_IN: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;

// ============================================================
// HELPERS
// ============================================================

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

async function getTokenOrThrow(
  ctx: QueryCtx | MutationCtx,
  tokenId: Id<"queueTokens">,
) {
  const token = await ctx.db.get(tokenId);

  if (!token) {
    throw new Error("Queue token not found");
  }

  return token;
}
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

async function validateCounterForQueue(
  ctx: MutationCtx,
  counterId: Id<"counters">,
  queue: Doc<"queues">,
) {
  const counter = await getCounterOrThrow(ctx, counterId);

  if (counter.businessId !== queue.businessId) {
    throw new Error("Counter does not belong to this business");
  }

  if (!counter.isActive) {
    throw new Error("Counter is inactive");
  }

  if (counter.status !== COUNTER_STATUSES.AVAILABLE) {
    throw new Error("Counter is not available");
  }

  const assignments = await ctx.db
    .query("counterAssignments")
    .withIndex("by_counterId_isActive", (q) =>
      q.eq("counterId", counterId).eq("isActive", true),
    )
    .collect();

  const isAssigned = assignments.some(
    (assignment) =>
      assignment.queueId === queue._id ||
      assignment.serviceId === queue.serviceId,
  );

  if (!isAssigned) {
    throw new Error("Counter is not assigned to this queue or service");
  }

  return counter;
}

async function releaseCounter(
  ctx: MutationCtx,
  counterId: Id<"counters"> | undefined,
) {
  if (!counterId) {
    return;
  }

  const counter = await ctx.db.get(counterId);

  if (!counter) {
    return;
  }

  // Do not bring an inactive counter back online.
  if (!counter.isActive) {
    return;
  }

  if (counter.status !== COUNTER_STATUSES.BUSY) {
    return;
  }

  await ctx.db.patch(counter._id, {
    status: COUNTER_STATUSES.AVAILABLE,
    updatedAt: Date.now(),
  });
}

async function getActiveTokenForAppointment(
  ctx: QueryCtx | MutationCtx,
  appointmentId: Id<"appointments">,
) {
  const token = await ctx.db
    .query("queueTokens")
    .withIndex("by_appointmentId", (q) => q.eq("appointmentId", appointmentId))
    .filter((q) =>
      q.or(
        q.eq(q.field("status"), TOKEN_STATUS.WAITING),
        q.eq(q.field("status"), TOKEN_STATUS.CALLED),
        q.eq(q.field("status"), TOKEN_STATUS.SERVING),
      ),
    )
    .first();

  return token;
}

export async function createQueueEvent(
  ctx: MutationCtx,
  {
    queueId,
    tokenId,
    eventType,
    actorId,
    metadata,
  }: {
    queueId: Id<"queues">;
    tokenId: Id<"queueTokens">;
    eventType: string;
    actorId?: Id<"users">;
    metadata?: unknown;
  },
) {
  await ctx.db.insert("queueEvents", {
    queueId,
    tokenId,
    eventType,
    actorId,
    metadata,
    createdAt: Date.now(),
  });
}

async function createQueueToken(
  ctx: MutationCtx,
  {
    queue,
    userId,
    appointmentId,
  }: {
    queue: Doc<"queues">;
    userId: Id<"users">;
    appointmentId?: Id<"appointments">;
  },
) {
  const nextNumber = queue.currentNumber + 1;
  const tokenNumber = String(nextNumber);

  const waitingTokens = await ctx.db
    .query("queueTokens")
    .withIndex("by_queueId_status", (q) =>
      q.eq("queueId", queue._id).eq("status", TOKEN_STATUS.WAITING),
    )
    .collect();

  const position = waitingTokens.length + 1;
  const estimatedWaitTime = position * 5;
  const now = Date.now();

  const tokenId = await ctx.db.insert("queueTokens", {
    queueId: queue._id,
    userId,
    appointmentId,
    tokenNumber,
    status: TOKEN_STATUS.WAITING,
    position,
    estimatedWaitTime,
    joinedAt: now,
  });

  await ctx.db.patch(queue._id, {
    currentNumber: nextNumber,
    updatedAt: now,
  });

  return {
    tokenId,
    tokenNumber,
    position,
    estimatedWaitTime,
  };
}

// ============================================================
// CREATE QUEUE
// ============================================================

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    serviceId: v.id("services"),

    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, ["OWNER", "MANAGER"]);

    const business = await ctx.db.get(args.businessId);

    if (!business || !business.isActive) {
      throw new Error("Business is not active");
    }

    const service = await ctx.db.get(args.serviceId);

    if (!service) {
      throw new Error("Service not found");
    }

    if (service.businessId !== args.businessId) {
      throw new Error("Service does not belong to this business");
    }

    if (!service.isActive) {
      throw new Error("Service is not active");
    }

    if (!service.queueEnabled) {
      throw new Error("Queue is disabled for this service");
    }

    const settings = await ctx.db
      .query("businessSettings")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .unique();

    if (!settings?.queueEnabled) {
      throw new Error("Queues are disabled for this business");
    }

    const now = Date.now();

    return await ctx.db.insert("queues", {
      businessId: args.businessId,
      serviceId: args.serviceId,

      name: args.name,
      description: args.description,

      type: args.type,

      currentNumber: 0,

      status: QUEUE_STATUS.ACTIVE,

      createdAt: now,
      updatedAt: now,
    });
  },
});

// ============================================================
// GET QUEUE
// ============================================================

export const get = query({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const queue = await ctx.db.get(args.queueId);

    if (!queue) {
      return null;
    }

    const service = await ctx.db.get(queue.serviceId);

    return {
      ...queue,
      service,
    };
  },
});

// ============================================================
// GET QUEUE FOR BUSINESS MEMBER
// ============================================================

export const getForMember = query({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const queue = await getQueueOrThrow(ctx, args.queueId);

    await requireBusinessMember(ctx, queue.businessId);

    const service = await ctx.db.get(queue.serviceId);

    return {
      ...queue,
      service,
    };
  },
});

// ============================================================
// LIST QUEUES
// ============================================================

export const list = query({
  args: {
    businessId: v.id("businesses"),
    activeOnly: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    const queues = await ctx.db
      .query("queues")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();

    if (args.activeOnly) {
      return queues.filter((queue) => queue.status === QUEUE_STATUS.ACTIVE);
    }

    return queues;
  },
});

// ============================================================
// PUBLIC QUEUES
// ============================================================

export const listPublic = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);

    if (!business || !business.isActive) {
      return [];
    }

    const settings = await ctx.db
      .query("businessSettings")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .unique();

    if (!settings?.queueEnabled) {
      return [];
    }

    const queues = await ctx.db
      .query("queues")
      .withIndex("by_businessId_status", (q) =>
        q.eq("businessId", args.businessId).eq("status", QUEUE_STATUS.ACTIVE),
      )
      .collect();

    return Promise.all(
      queues.map(async (queue) => {
        const service = await ctx.db.get(queue.serviceId);

        const waitingTokens = await ctx.db
          .query("queueTokens")
          .withIndex("by_queueId_status", (q) =>
            q.eq("queueId", queue._id).eq("status", TOKEN_STATUS.WAITING),
          )
          .collect();

        const calledTokens = await ctx.db
          .query("queueTokens")
          .withIndex("by_queueId_status", (q) =>
            q.eq("queueId", queue._id).eq("status", TOKEN_STATUS.CALLED),
          )
          .collect();

        const servingTokens = await ctx.db
          .query("queueTokens")
          .withIndex("by_queueId_status", (q) =>
            q.eq("queueId", queue._id).eq("status", TOKEN_STATUS.SERVING),
          )
          .collect();

        return {
          ...queue,
          service,

          waitingCount: waitingTokens.length,

          calledCount: calledTokens.length,

          servingCount: servingTokens.length,
        };
      }),
    );
  },
});

// ============================================================
// UPDATE QUEUE
// ============================================================

export const update = mutation({
  args: {
    queueId: v.id("queues"),

    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const queue = await getQueueOrThrow(ctx, args.queueId);

    await requireBusinessRole(ctx, queue.businessId, ["OWNER", "MANAGER"]);

    const { queueId, ...updates } = args;

    await ctx.db.patch(queueId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(queueId);
  },
});

// ============================================================
// PAUSE QUEUE
// ============================================================

export const pause = mutation({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const queue = await getQueueOrThrow(ctx, args.queueId);

    await requireBusinessRole(ctx, queue.businessId, [
      "OWNER",
      "MANAGER",
      "STAFF",
    ]);

    if (queue.status === QUEUE_STATUS.CLOSED) {
      throw new Error("Closed queue cannot be paused");
    }

    await ctx.db.patch(queue._id, {
      status: QUEUE_STATUS.PAUSED,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// ============================================================
// RESUME QUEUE
// ============================================================

export const resume = mutation({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const queue = await getQueueOrThrow(ctx, args.queueId);

    await requireBusinessRole(ctx, queue.businessId, [
      "OWNER",
      "MANAGER",
      "STAFF",
    ]);

    if (queue.status === QUEUE_STATUS.CLOSED) {
      throw new Error("Closed queue cannot be resumed");
    }

    await ctx.db.patch(queue._id, {
      status: QUEUE_STATUS.ACTIVE,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// ============================================================
// CLOSE QUEUE
// ============================================================

export const close = mutation({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const queue = await getQueueOrThrow(ctx, args.queueId);

    await requireBusinessRole(ctx, queue.businessId, ["OWNER", "MANAGER"]);

    await ctx.db.patch(queue._id, {
      status: QUEUE_STATUS.CLOSED,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// ============================================================
// JOIN QUEUE
// ============================================================

export const join = mutation({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const queue = await getQueueOrThrow(ctx, args.queueId);

    if (queue.status !== QUEUE_STATUS.ACTIVE) {
      throw new Error("Queue is not accepting customers");
    }

    const business = await ctx.db.get(queue.businessId);

    if (!business || !business.isActive) {
      throw new Error("Business is not active");
    }

    const service = await ctx.db.get(queue.serviceId);

    if (!service || !service.isActive) {
      throw new Error("Service is not active");
    }

    if (!service.queueEnabled) {
      throw new Error("Queue is disabled for this service");
    }

    // --------------------------------------------------------
    // Prevent duplicate active queue entries.
    // --------------------------------------------------------

    const existingTokens = await ctx.db
      .query("queueTokens")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", user._id).eq("status", TOKEN_STATUS.WAITING),
      )
      .collect();

    const alreadyInQueue = existingTokens.some(
      (token) => token.queueId === queue._id,
    );

    if (alreadyInQueue) {
      throw new Error("You are already in this queue");
    }

    // --------------------------------------------------------
    // Create token.
    // --------------------------------------------------------

    const token = await createQueueToken(ctx, {
      queue,
      userId: user._id,
    });

    // --------------------------------------------------------
    // Record event.
    // --------------------------------------------------------

    await createQueueEvent(ctx, {
      queueId: queue._id,
      tokenId: token.tokenId,
      eventType: "JOINED",
      actorId: user._id,
    });

    return token;
  },
});

// ============================================================
// CANCEL OWN TOKEN
// ============================================================

export const leave = mutation({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await getTokenOrThrow(ctx, args.tokenId);

    if (token.userId !== user._id) {
      throw new Error("You cannot cancel another customer's token");
    }

    if (token.status !== TOKEN_STATUS.WAITING) {
      throw new Error("Only waiting tokens can be cancelled");
    }

    const queue = await getQueueOrThrow(ctx, token.queueId);

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: TOKEN_STATUS.CANCELLED,

      cancelledAt: now,
    });

    await createQueueEvent(ctx, {
      queueId: queue._id,

      tokenId: token._id,

      eventType: "CANCELLED",

      actorId: user._id,
    });

    return true;
  },
});

// ============================================================
// CALL NEXT CUSTOMER
// ============================================================

export const callNext = mutation({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const queue = await getQueueOrThrow(ctx, args.queueId);

    await requireBusinessRole(ctx, queue.businessId, [
      "OWNER",
      "MANAGER",
      "STAFF",
    ]);

    if (queue.status !== QUEUE_STATUS.ACTIVE) {
      throw new Error("Queue is not active");
    }

    // --------------------------------------------------------
    // Find oldest waiting token.
    // --------------------------------------------------------

    const waitingTokens = await ctx.db
      .query("queueTokens")
      .withIndex("by_queueId_status", (q) =>
        q.eq("queueId", queue._id).eq("status", TOKEN_STATUS.WAITING),
      )
      .collect();

    if (waitingTokens.length === 0) {
      throw new Error("No customers are waiting");
    }

    waitingTokens.sort((a, b) => a.joinedAt - b.joinedAt);

    const token = waitingTokens[0];

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: TOKEN_STATUS.CALLED,

      calledAt: now,
    });

    await createQueueEvent(ctx, {
      queueId: queue._id,

      tokenId: token._id,

      eventType: "CALLED",

      actorId: user._id,
    });

    return token;
  },
});

// ============================================================
// CALL SPECIFIC TOKEN
// ============================================================

export const call = mutation({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await getTokenOrThrow(ctx, args.tokenId);

    const queue = await getQueueOrThrow(ctx, token.queueId);

    await requireBusinessRole(ctx, queue.businessId, [
      "OWNER",
      "MANAGER",
      "STAFF",
    ]);

    if (token.status !== TOKEN_STATUS.WAITING) {
      throw new Error("Only waiting tokens can be called");
    }

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: TOKEN_STATUS.CALLED,

      calledAt: now,
    });

    await createQueueEvent(ctx, {
      queueId: queue._id,

      tokenId: token._id,

      eventType: "CALLED",

      actorId: user._id,
    });

    return true;
  },
});

// ============================================================
// RECALL
// ============================================================

export const recall = mutation({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await getTokenOrThrow(ctx, args.tokenId);

    const queue = await getQueueOrThrow(ctx, token.queueId);

    await requireBusinessRole(ctx, queue.businessId, [
      "OWNER",
      "MANAGER",
      "STAFF",
    ]);

    if (token.status !== TOKEN_STATUS.CALLED) {
      throw new Error("Only called tokens can be recalled");
    }

    await createQueueEvent(ctx, {
      queueId: queue._id,

      tokenId: token._id,

      eventType: "RECALLED",

      actorId: user._id,
    });

    return true;
  },
});

// ============================================================
// ASSIGN TO COUNTER
// ============================================================

export const assignToCounter = mutation({
  args: {
    tokenId: v.id("queueTokens"),
    counterId: v.id("counters"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await getTokenOrThrow(ctx, args.tokenId);
    const queue = await getQueueOrThrow(ctx, token.queueId);

    await requireBusinessRole(ctx, queue.businessId, [
      "OWNER",
      "MANAGER",
      "STAFF",
    ]);

    if (token.status !== TOKEN_STATUS.CALLED) {
      throw new Error("Only called tokens can be assigned to a counter");
    }

    if (token.counterId) {
      throw new Error("Token is already assigned to a counter");
    }

    const counter = await validateCounterForQueue(ctx, args.counterId, queue);

    // Defensive check: a counter must not already have
    // another active token assigned to it.
    const activeTokens = await ctx.db
      .query("queueTokens")
      .withIndex("by_counterId_status", (q) =>
        q.eq("counterId", args.counterId),
      )
      .collect();

    const counterInUse = activeTokens.some(
      (activeToken) =>
        activeToken.status === TOKEN_STATUS.CALLED ||
        activeToken.status === TOKEN_STATUS.SERVING,
    );

    if (counterInUse) {
      throw new Error("Counter is already serving another customer");
    }

    const now = Date.now();

    await ctx.db.patch(token._id, {
      counterId: counter._id,
    });

    // A counter with a called customer assigned to it is considered
    // occupied/reserved.
    await ctx.db.patch(counter._id, {
      status: COUNTER_STATUSES.BUSY,
      updatedAt: now,
    });

    await createQueueEvent(ctx, {
      queueId: queue._id,
      tokenId: token._id,
      eventType: "COUNTER_ASSIGNED",
      actorId: user._id,
      metadata: {
        counterId: counter._id,
      },
    });

    return true;
  },
});

// ============================================================
// START SERVING
// ============================================================

// ============================================================
// START SERVING
// ============================================================

export const startServing = mutation({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await getTokenOrThrow(ctx, args.tokenId);
    const queue = await getQueueOrThrow(ctx, token.queueId);

    await requireBusinessRole(ctx, queue.businessId, [
      "OWNER",
      "MANAGER",
      "STAFF",
    ]);

    if (token.status !== TOKEN_STATUS.CALLED) {
      throw new Error("Only called tokens can start serving");
    }

    if (!token.counterId) {
      throw new Error("Token must be assigned to a counter before serving");
    }

    const counter = await getCounterOrThrow(ctx, token.counterId);

    if (counter.businessId !== queue.businessId) {
      throw new Error("Counter does not belong to this business");
    }

    if (!counter.isActive) {
      throw new Error("Counter is inactive");
    }

    if (counter.status !== COUNTER_STATUSES.BUSY) {
      throw new Error("Counter is not reserved for this token");
    }

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: TOKEN_STATUS.SERVING,
      servingAt: now,
    });

    await createQueueEvent(ctx, {
      queueId: queue._id,
      tokenId: token._id,
      eventType: "SERVING_STARTED",
      actorId: user._id,
      metadata: {
        counterId: counter._id,
      },
    });

    return true;
  },
});

// ============================================================
// COMPLETE
// ============================================================

// ============================================================
// COMPLETE
// ============================================================

export const complete = mutation({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await getTokenOrThrow(ctx, args.tokenId);
    const queue = await getQueueOrThrow(ctx, token.queueId);

    await requireBusinessRole(ctx, queue.businessId, [
      "OWNER",
      "MANAGER",
      "STAFF",
    ]);

    if (token.status !== TOKEN_STATUS.SERVING) {
      throw new Error("Only serving tokens can be completed");
    }

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: TOKEN_STATUS.COMPLETED,
      completedAt: now,
    });

    await releaseCounter(ctx, token.counterId);

    await createQueueEvent(ctx, {
      queueId: queue._id,
      tokenId: token._id,
      eventType: "COMPLETED",
      actorId: user._id,
      metadata: token.counterId
        ? {
            counterId: token.counterId,
          }
        : undefined,
    });

    return true;
  },
});

// ============================================================
// SKIP
// ============================================================

// ============================================================
// SKIP
// ============================================================

export const skip = mutation({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await getTokenOrThrow(ctx, args.tokenId);
    const queue = await getQueueOrThrow(ctx, token.queueId);

    await requireBusinessRole(ctx, queue.businessId, [
      "OWNER",
      "MANAGER",
      "STAFF",
    ]);

    if (
      token.status !== TOKEN_STATUS.WAITING &&
      token.status !== TOKEN_STATUS.CALLED
    ) {
      throw new Error("Token cannot be skipped from its current state");
    }

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: TOKEN_STATUS.SKIPPED,
    });

    // A CALLED token may already have a reserved counter.
    await releaseCounter(ctx, token.counterId);

    await createQueueEvent(ctx, {
      queueId: queue._id,
      tokenId: token._id,
      eventType: "SKIPPED",
      actorId: user._id,
      metadata: token.counterId
        ? {
            counterId: token.counterId,
          }
        : undefined,
    });

    return true;
  },
});

// ============================================================
// NO SHOW
// ============================================================

// ============================================================
// NO SHOW
// ============================================================

export const noShow = mutation({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await getTokenOrThrow(ctx, args.tokenId);
    const queue = await getQueueOrThrow(ctx, token.queueId);

    await requireBusinessRole(ctx, queue.businessId, [
      "OWNER",
      "MANAGER",
      "STAFF",
    ]);

    if (token.status !== TOKEN_STATUS.CALLED) {
      throw new Error("Only called tokens can be marked as no-show");
    }

    await ctx.db.patch(token._id, {
      status: TOKEN_STATUS.NO_SHOW,
    });

    // Release a counter if this called token had already
    // been assigned to one.
    await releaseCounter(ctx, token.counterId);

    await createQueueEvent(ctx, {
      queueId: queue._id,
      tokenId: token._id,
      eventType: "NO_SHOW",
      actorId: user._id,
      metadata: token.counterId
        ? {
            counterId: token.counterId,
          }
        : undefined,
    });

    return true;
  },
});

// ============================================================
// GET TOKEN
// ============================================================

export const getToken = query({
  args: {
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const token = await ctx.db.get(args.tokenId);

    if (!token) {
      return null;
    }

    const queue = await ctx.db.get(token.queueId);

    return {
      ...token,
      queue,
    };
  },
});

// ============================================================
// GET MY ACTIVE TOKEN
// ============================================================

export const getMyActiveToken = query({
  args: {
    queueId: v.optional(v.id("queues")),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const statuses = [
      TOKEN_STATUS.WAITING,
      TOKEN_STATUS.CALLED,
      TOKEN_STATUS.SERVING,
    ];

    const tokens = [];

    for (const status of statuses) {
      const results = await ctx.db
        .query("queueTokens")
        .withIndex("by_userId_status", (q) =>
          q.eq("userId", user._id).eq("status", status),
        )
        .collect();

      tokens.push(...results);
    }

    const token = args.queueId
      ? tokens.find((token) => token.queueId === args.queueId)
      : tokens[0];

    if (!token) {
      return null;
    }

    const queue = await ctx.db.get(token.queueId);

    return {
      ...token,
      queue,
    };
  },
});

// ============================================================
// GET QUEUE TOKENS
// ============================================================

export const getTokens = query({
  args: {
    queueId: v.id("queues"),

    status: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const queue = await getQueueOrThrow(ctx, args.queueId);

    await requireBusinessMember(ctx, queue.businessId);

    if (args.status) {
      return await ctx.db
        .query("queueTokens")
        .withIndex("by_queueId_status", (q) =>
          q.eq("queueId", args.queueId).eq("status", args.status!),
        )
        .collect();
    }

    return await ctx.db
      .query("queueTokens")
      .withIndex("by_queueId", (q) => q.eq("queueId", args.queueId))
      .collect();
  },
});

// ============================================================
// LIVE QUEUE STATE
// ============================================================

export const getLiveState = query({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const queue = await getQueueOrThrow(ctx, args.queueId);

    const service = await ctx.db.get(queue.serviceId);

    const waiting = await ctx.db
      .query("queueTokens")
      .withIndex("by_queueId_status", (q) =>
        q.eq("queueId", queue._id).eq("status", TOKEN_STATUS.WAITING),
      )
      .collect();

    const called = await ctx.db
      .query("queueTokens")
      .withIndex("by_queueId_status", (q) =>
        q.eq("queueId", queue._id).eq("status", TOKEN_STATUS.CALLED),
      )
      .collect();

    const serving = await ctx.db
      .query("queueTokens")
      .withIndex("by_queueId_status", (q) =>
        q.eq("queueId", queue._id).eq("status", TOKEN_STATUS.SERVING),
      )
      .collect();

    return {
      queue,
      service,

      waitingCount: waiting.length,

      waiting,

      called,

      serving,

      nowServing: serving[0] ?? null,
    };
  },
});

// ============================================================
// QUEUE EVENTS
// ============================================================

export const getEvents = query({
  args: {
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const queue = await getQueueOrThrow(ctx, args.queueId);

    await requireBusinessMember(ctx, queue.businessId);

    return await ctx.db
      .query("queueEvents")
      .withIndex("by_queueId_createdAt", (q) => q.eq("queueId", args.queueId))
      .order("desc")
      .take(100);
  },
});

// HYBRID INTERGRATION LOGIC
export const joinFromAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // --------------------------------------------------------
    // Get appointment
    // --------------------------------------------------------

    const appointment = await ctx.db.get(args.appointmentId);

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // --------------------------------------------------------
    // Verify ownership
    // --------------------------------------------------------

    if (appointment.userId !== user._id) {
      throw new Error("You do not own this appointment");
    }

    // --------------------------------------------------------
    // Appointment must be checked in
    // --------------------------------------------------------

    if (appointment.status !== APPOINTMENT_STATUS.CHECKED_IN) {
      throw new Error(
        "Appointment must be checked in before joining the queue",
      );
    }

    // --------------------------------------------------------
    // Verify business
    // --------------------------------------------------------

    const business = await ctx.db.get(appointment.businessId);

    if (!business || !business.isActive) {
      throw new Error("Business is not active");
    }

    // --------------------------------------------------------
    // Verify service
    // --------------------------------------------------------

    const service = await ctx.db.get(appointment.serviceId);

    if (!service) {
      throw new Error("Service not found");
    }

    if (!service.isActive) {
      throw new Error("Service is not active");
    }

    if (!service.queueEnabled) {
      throw new Error("Queueing is disabled for this service");
    }

    // --------------------------------------------------------
    // Prevent duplicate queue token for this appointment
    // --------------------------------------------------------

    const existingToken = await ctx.db
      .query("queueTokens")
      .withIndex("by_appointmentId", (q) =>
        q.eq("appointmentId", appointment._id),
      )
      .filter((q) => q.neq(q.field("status"), TOKEN_STATUS.CANCELLED))
      .first();

    if (existingToken) {
      throw new Error(
        "This appointment is already associated with a queue token",
      );
    }

    // --------------------------------------------------------
    // Find active queue for this service
    // --------------------------------------------------------

    const queues = await ctx.db
      .query("queues")
      .withIndex("by_serviceId", (q) =>
        q.eq("serviceId", appointment.serviceId),
      )
      .collect();

    const queue = queues.find(
      (candidate) =>
        candidate.businessId === appointment.businessId &&
        candidate.status === QUEUE_STATUS.ACTIVE,
    );

    if (!queue) {
      throw new Error("No active queue is available for this service");
    }

    // --------------------------------------------------------
    // Create queue token
    // --------------------------------------------------------

    const token = await createQueueToken(ctx, {
      queue,
      userId: user._id,
      appointmentId: appointment._id,
    });

    // --------------------------------------------------------
    // Record event
    // --------------------------------------------------------

    await createQueueEvent(ctx, {
      queueId: queue._id,
      tokenId: token.tokenId,
      eventType: "JOINED_FROM_APPOINTMENT",
      actorId: user._id,
      metadata: {
        appointmentId: appointment._id,
      },
    });

    // --------------------------------------------------------
    // Return created token
    // --------------------------------------------------------

    return await ctx.db.get(token.tokenId);
  },
});
