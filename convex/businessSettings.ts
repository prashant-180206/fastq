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

// ============================================================
// CONSTANTS
// ============================================================

export const APPOINTMENT_MODES = {
  DISABLED: "DISABLED",
  SCHEDULED: "SCHEDULED",
} as const;

// ============================================================
// HELPERS
// ============================================================

async function getSettingsOrThrow(
  ctx: QueryCtx | MutationCtx,
  businessId: Id<"businesses">,
) {
  const settings = await ctx.db
    .query("businessSettings")
    .withIndex("by_businessId", (q) => q.eq("businessId", businessId))
    .unique();

  if (!settings) {
    throw new Error("Business settings not found");
  }

  return settings;
}

function validateAppointmentMode(mode: string) {
  if (
    mode !== APPOINTMENT_MODES.DISABLED &&
    mode !== APPOINTMENT_MODES.SCHEDULED
  ) {
    throw new Error("Invalid appointment mode");
  }
}

// ============================================================
// GET
// ============================================================

export const get = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    return await getSettingsOrThrow(ctx, args.businessId);
  },
});

// ============================================================
// UPDATE
// ============================================================

export const update = mutation({
  args: {
    businessId: v.id("businesses"),

    queueEnabled: v.optional(v.boolean()),

    appointmentsEnabled: v.optional(v.boolean()),

    appointmentMode: v.optional(v.string()),

    queueSettings: v.optional(v.any()),

    notificationSettings: v.optional(v.any()),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, ["OWNER", "ADMIN"]);

    const settings = await getSettingsOrThrow(ctx, args.businessId);

    // --------------------------------------------------------
    // Resolve final values
    // --------------------------------------------------------

    const appointmentsEnabled =
      args.appointmentsEnabled ?? settings.appointmentsEnabled;

    const appointmentMode = args.appointmentMode ?? settings.appointmentMode;

    // --------------------------------------------------------
    // Validate appointment configuration
    // --------------------------------------------------------

    validateAppointmentMode(appointmentMode);

    if (
      !appointmentsEnabled &&
      appointmentMode !== APPOINTMENT_MODES.DISABLED
    ) {
      throw new Error(
        "Appointment mode must be DISABLED when appointments are disabled",
      );
    }

    if (appointmentsEnabled && appointmentMode === APPOINTMENT_MODES.DISABLED) {
      throw new Error(
        "Appointment mode cannot be DISABLED when appointments are enabled",
      );
    }

    // --------------------------------------------------------
    // Build patch
    // --------------------------------------------------------

    const patch: {
      queueEnabled?: boolean;
      appointmentsEnabled?: boolean;
      appointmentMode?: string;
      queueSettings?: unknown;
      notificationSettings?: unknown;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.queueEnabled !== undefined) {
      patch.queueEnabled = args.queueEnabled;
    }

    patch.appointmentsEnabled = appointmentsEnabled;

    patch.appointmentMode = appointmentMode;

    if (args.queueSettings !== undefined) {
      patch.queueSettings = args.queueSettings;
    }

    if (args.notificationSettings !== undefined) {
      patch.notificationSettings = args.notificationSettings;
    }

    await ctx.db.patch(settings._id, patch);

    return await ctx.db.get(settings._id);
  },
});

// ============================================================
// ENABLE QUEUE
// ============================================================

export const enableQueue = mutation({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, ["OWNER", "ADMIN"]);

    const settings = await getSettingsOrThrow(ctx, args.businessId);

    if (settings.queueEnabled) {
      return settings;
    }

    await ctx.db.patch(settings._id, {
      queueEnabled: true,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(settings._id);
  },
});

// ============================================================
// DISABLE QUEUE
// ============================================================

export const disableQueue = mutation({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, ["OWNER", "ADMIN"]);

    const settings = await getSettingsOrThrow(ctx, args.businessId);

    if (!settings.queueEnabled) {
      return settings;
    }

    await ctx.db.patch(settings._id, {
      queueEnabled: false,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(settings._id);
  },
});

// ============================================================
// ENABLE APPOINTMENTS
// ============================================================

export const enableAppointments = mutation({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, ["OWNER", "ADMIN"]);

    const settings = await getSettingsOrThrow(ctx, args.businessId);

    await ctx.db.patch(settings._id, {
      appointmentsEnabled: true,

      appointmentMode: APPOINTMENT_MODES.SCHEDULED,

      updatedAt: Date.now(),
    });

    return await ctx.db.get(settings._id);
  },
});

// ============================================================
// DISABLE APPOINTMENTS
// ============================================================

export const disableAppointments = mutation({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, ["OWNER", "ADMIN"]);

    const settings = await getSettingsOrThrow(ctx, args.businessId);

    await ctx.db.patch(settings._id, {
      appointmentsEnabled: false,

      appointmentMode: APPOINTMENT_MODES.DISABLED,

      updatedAt: Date.now(),
    });

    return await ctx.db.get(settings._id);
  },
});
