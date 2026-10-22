import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 200;

/**
 * Delete queue tokens created more than a week ago. Runs in bounded batches
 * and schedules a continuation so a large backlog never times out.
 */
export const deleteOldQueueTokens = internalMutation({
  args: {
    cutoff: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const cutoff = args.cutoff ?? Date.now() - WEEK_MS;

    // A plain table scan walks oldest-first by `_creationTime`.
    const batch = await ctx.db.query("queueTokens").take(BATCH_SIZE);

    let deleted = 0;
    let reachedRecent = false;

    for (const token of batch) {
      if (token._creationTime >= cutoff) {
        reachedRecent = true;
        break;
      }

      await ctx.db.delete(token._id);
      deleted++;
    }

    const more = !reachedRecent && batch.length === BATCH_SIZE && deleted > 0;

    if (more) {
      await ctx.scheduler.runAfter(
        0,
        internal.crons.deleteOldQueueTokens,
        { cutoff },
      );
    }

    return { deleted, done: !more };
  },
});

/**
 * Delete broadcasts that expired more than a day ago. The extra day keeps
 * just-expired announcements visible briefly while avoiding unbounded growth.
 */
export const deleteExpiredBroadcasts = internalMutation({
  args: {},

  handler: async (ctx) => {
    const cutoff = Date.now() - DAY_MS;

    const batch = await ctx.db
      .query("broadcasts")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", cutoff))
      .take(BATCH_SIZE);

    for (const broadcast of batch) {
      await ctx.db.delete(broadcast._id);
    }

    if (batch.length === BATCH_SIZE) {
      await ctx.scheduler.runAfter(
        0,
        internal.crons.deleteExpiredBroadcasts,
        {},
      );
    }

    return { deleted: batch.length };
  },
});

const crons = cronJobs();

crons.interval(
  "delete queue tokens older than one week",
  { hours: 24 },
  internal.crons.deleteOldQueueTokens,
  {},
);

crons.interval(
  "delete expired broadcasts",
  { hours: 24 },
  internal.crons.deleteExpiredBroadcasts,
  {},
);

export default crons;
