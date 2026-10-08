import { mutation } from "./_generated/server";

import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";

import { requireUser } from "./lib/auth";

import { requireBusinessRole } from "./lib/authorization";

import { COUNTER_STATUSES } from "./counters";

import { QUEUE_STATUS, TOKEN_STATUS, createQueueEvent } from "./queues";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

async function getCounterOrThrow(ctx: any, counterId: Id<"counters">) {
  const counter = await ctx.db.get(counterId);

  if (!counter) {
    throw new Error("Counter not found");
  }

  if (!counter.isActive) {
    throw new Error("Counter is inactive");
  }

  return counter;
}

async function getTokenOrThrow(ctx: any, tokenId: Id<"queueTokens">) {
  const token = await ctx.db.get(tokenId);

  if (!token) {
    throw new Error("Queue token not found");
  }

  return token;
}

async function requireCounterAccessToQueue(
  ctx: any,
  counterId: Id<"counters">,
  queueId: Id<"queues">,
) {
  const counter = await getCounterOrThrow(ctx, counterId);

  const queue = await ctx.db.get(queueId);

  if (!queue) {
    throw new Error("Queue not found");
  }

  if (queue.businessId !== counter.businessId) {
    throw new Error("Counter and queue belong to different businesses");
  }

  const assignments = await ctx.db
    .query("counterAssignments")
    .withIndex("by_counterId", (q: any) => q.eq("counterId", counterId))
    .collect();

  const hasAccess = assignments.some(
    (assignment: any) =>
      assignment.isActive &&
      (assignment.queueId === queueId ||
        assignment.serviceId === queue.serviceId),
  );

  if (!hasAccess) {
    throw new Error("Counter is not assigned to this queue or service");
  }

  return {
    counter,
    queue,
  };
}

async function requireCounterToken(
  ctx: any,
  counterId: Id<"counters">,
  tokenId: Id<"queueTokens">,
) {
  const token = await getTokenOrThrow(ctx, tokenId);

  if (token.counterId !== counterId) {
    throw new Error("Queue token is not assigned to this counter");
  }

  return token;
}

async function setCounterStatus(
  ctx: any,
  counterId: Id<"counters">,
  status: string,
) {
  await ctx.db.patch(counterId, {
    status,
    updatedAt: Date.now(),
  });
}

// -----------------------------------------------------------------------------
// Call next waiting customer
// -----------------------------------------------------------------------------

export const callNext = mutation({
  args: {
    counterId: v.id("counters"),
    queueId: v.id("queues"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const { counter, queue } = await requireCounterAccessToQueue(
      ctx,
      args.counterId,
      args.queueId,
    );

    await requireBusinessRole(ctx, counter.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
      "STAFF",
    ]);

    if (queue.status !== QUEUE_STATUS.ACTIVE) {
      throw new Error("Queue is not active");
    }

    const token = await ctx.db
      .query("queueTokens")
      .withIndex("by_queueId_status", (q) =>
        q.eq("queueId", queue._id).eq("status", TOKEN_STATUS.WAITING),
      )
      .first();

    if (!token) {
      throw new Error("No waiting customers in this queue");
    }

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: TOKEN_STATUS.CALLED,
      counterId: counter._id,
      calledAt: now,
    });

    await setCounterStatus(ctx, counter._id, COUNTER_STATUSES.BUSY);

    await createQueueEvent(ctx, {
      queueId: queue._id,
      tokenId: token._id,
      eventType: "CALLED",
      actorId: user._id,
      metadata: {
        counterId: counter._id,
      },
    });

    return await ctx.db.get(token._id);
  },
});

// -----------------------------------------------------------------------------
// Call a specific waiting customer
// -----------------------------------------------------------------------------

export const callToken = mutation({
  args: {
    counterId: v.id("counters"),
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await getTokenOrThrow(ctx, args.tokenId);

    const { counter, queue } = await requireCounterAccessToQueue(
      ctx,
      args.counterId,
      token.queueId,
    );

    await requireBusinessRole(ctx, counter.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
      "STAFF",
    ]);

    if (token.status !== TOKEN_STATUS.WAITING) {
      throw new Error("Only waiting tokens can be called");
    }

    const now = Date.now();

    await ctx.db.patch(token._id, {
      status: TOKEN_STATUS.CALLED,
      counterId: counter._id,
      calledAt: now,
    });

    await setCounterStatus(ctx, counter._id, COUNTER_STATUSES.BUSY);

    await createQueueEvent(ctx, {
      queueId: queue._id,
      tokenId: token._id,
      eventType: "CALLED",
      actorId: user._id,
      metadata: {
        counterId: counter._id,
      },
    });

    return await ctx.db.get(token._id);
  },
});

// -----------------------------------------------------------------------------
// Recall a customer
// -----------------------------------------------------------------------------

export const recallToken = mutation({
  args: {
    counterId: v.id("counters"),
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await requireCounterToken(ctx, args.counterId, args.tokenId);

    const { counter, queue } = await requireCounterAccessToQueue(
      ctx,
      args.counterId,
      token.queueId,
    );

    await requireBusinessRole(ctx, counter.businessId, [
      "OWNER",
      "ADMIN",
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
      metadata: {
        counterId: counter._id,
      },
    });

    return await ctx.db.get(token._id);
  },
});

// -----------------------------------------------------------------------------
// Start serving
// -----------------------------------------------------------------------------

export const startServing = mutation({
  args: {
    counterId: v.id("counters"),
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await requireCounterToken(ctx, args.counterId, args.tokenId);

    const { counter, queue } = await requireCounterAccessToQueue(
      ctx,
      args.counterId,
      token.queueId,
    );

    await requireBusinessRole(ctx, counter.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
      "STAFF",
    ]);

    if (token.status !== TOKEN_STATUS.CALLED) {
      throw new Error("Only called tokens can start serving");
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

    return await ctx.db.get(token._id);
  },
});

// -----------------------------------------------------------------------------
// Complete
// -----------------------------------------------------------------------------

export const complete = mutation({
  args: {
    counterId: v.id("counters"),
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await requireCounterToken(ctx, args.counterId, args.tokenId);

    const { counter, queue } = await requireCounterAccessToQueue(
      ctx,
      args.counterId,
      token.queueId,
    );

    await requireBusinessRole(ctx, counter.businessId, [
      "OWNER",
      "ADMIN",
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

    await setCounterStatus(ctx, counter._id, COUNTER_STATUSES.AVAILABLE);

    await createQueueEvent(ctx, {
      queueId: queue._id,
      tokenId: token._id,
      eventType: "COMPLETED",
      actorId: user._id,
      metadata: {
        counterId: counter._id,
      },
    });

    return await ctx.db.get(token._id);
  },
});

// -----------------------------------------------------------------------------
// Skip
// -----------------------------------------------------------------------------

export const skip = mutation({
  args: {
    counterId: v.id("counters"),
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await requireCounterToken(ctx, args.counterId, args.tokenId);

    const { counter, queue } = await requireCounterAccessToQueue(
      ctx,
      args.counterId,
      token.queueId,
    );

    await requireBusinessRole(ctx, counter.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
      "STAFF",
    ]);

    if (
      token.status !== TOKEN_STATUS.CALLED &&
      token.status !== TOKEN_STATUS.SERVING
    ) {
      throw new Error("Only called or serving tokens can be skipped");
    }

    await ctx.db.patch(token._id, {
      status: TOKEN_STATUS.SKIPPED,
    });

    await setCounterStatus(ctx, counter._id, COUNTER_STATUSES.AVAILABLE);

    await createQueueEvent(ctx, {
      queueId: queue._id,
      tokenId: token._id,
      eventType: "SKIPPED",
      actorId: user._id,
      metadata: {
        counterId: counter._id,
      },
    });

    return await ctx.db.get(token._id);
  },
});

// -----------------------------------------------------------------------------
// No-show
// -----------------------------------------------------------------------------

export const noShow = mutation({
  args: {
    counterId: v.id("counters"),
    tokenId: v.id("queueTokens"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const token = await requireCounterToken(ctx, args.counterId, args.tokenId);

    const { counter, queue } = await requireCounterAccessToQueue(
      ctx,
      args.counterId,
      token.queueId,
    );

    await requireBusinessRole(ctx, counter.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
      "STAFF",
    ]);

    if (token.status !== TOKEN_STATUS.CALLED) {
      throw new Error("Only called tokens can be marked as no-show");
    }

    await ctx.db.patch(token._id, {
      status: TOKEN_STATUS.NO_SHOW,
    });

    await setCounterStatus(ctx, counter._id, COUNTER_STATUSES.AVAILABLE);

    await createQueueEvent(ctx, {
      queueId: queue._id,
      tokenId: token._id,
      eventType: "NO_SHOW",
      actorId: user._id,
      metadata: {
        counterId: counter._id,
      },
    });

    return await ctx.db.get(token._id);
  },
});
