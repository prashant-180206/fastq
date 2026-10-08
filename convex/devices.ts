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

const DEVICE_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function hashSecret(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);

  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function generateSecret(): string {
  const bytes = new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getDeviceOrThrow(
  ctx: QueryCtx | MutationCtx,
  deviceId: Id<"kioskDevices">,
) {
  const device = await ctx.db.get(deviceId);

  if (!device) {
    throw new Error("Device not found");
  }

  return device;
}

async function getDeviceByDeviceIdOrThrow(
  ctx: QueryCtx | MutationCtx,
  deviceId: string,
) {
  const device = await ctx.db
    .query("kioskDevices")
    .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
    .unique();

  if (!device) {
    throw new Error("Device not found");
  }

  return device;
}

/* -------------------------------------------------------------------------- */
/* Device registration                                                        */
/* -------------------------------------------------------------------------- */

export const register = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    type: v.string(),
    deviceId: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    const existing = await ctx.db
      .query("kioskDevices")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .unique();

    if (existing) {
      throw new Error("A device with this device ID already exists");
    }

    const deviceSecret = generateSecret();
    const tokenHash = await hashSecret(deviceSecret);

    const now = Date.now();

    const deviceDbId = await ctx.db.insert("kioskDevices", {
      businessId: args.businessId,
      name: args.name,
      type: args.type,
      deviceId: args.deviceId,
      tokenHash,
      latitude: args.latitude,
      longitude: args.longitude,
      status: DEVICE_STATUS.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    return {
      deviceId: deviceDbId,
      deviceIdentifier: args.deviceId,
      deviceSecret,
    };
  },
});

/* -------------------------------------------------------------------------- */
/* Device queries                                                             */
/* -------------------------------------------------------------------------- */

export const get = query({
  args: {
    deviceId: v.id("kioskDevices"),
  },

  handler: async (ctx, args) => {
    const device = await getDeviceOrThrow(ctx, args.deviceId);

    await requireBusinessMember(ctx, device.businessId);

    /*
     * Never expose tokenHash to the client.
     */
    return {
      _id: device._id,
      _creationTime: device._creationTime,
      businessId: device.businessId,
      name: device.name,
      type: device.type,
      deviceId: device.deviceId,
      latitude: device.latitude,
      longitude: device.longitude,
      status: device.status,
      lastSeenAt: device.lastSeenAt,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  },
});

export const list = query({
  args: {
    businessId: v.id("businesses"),
    includeInactive: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    const devices = await ctx.db
      .query("kioskDevices")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();

    const filtered = args.includeInactive
      ? devices
      : devices.filter((device) => device.status === DEVICE_STATUS.ACTIVE);

    return filtered.map((device) => ({
      _id: device._id,
      _creationTime: device._creationTime,
      businessId: device.businessId,
      name: device.name,
      type: device.type,
      deviceId: device.deviceId,
      latitude: device.latitude,
      longitude: device.longitude,
      status: device.status,
      lastSeenAt: device.lastSeenAt,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    }));
  },
});

/* -------------------------------------------------------------------------- */
/* Device management                                                         */
/* -------------------------------------------------------------------------- */

export const update = mutation({
  args: {
    deviceId: v.id("kioskDevices"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const device = await getDeviceOrThrow(ctx, args.deviceId);

    await requireBusinessRole(ctx, device.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    const patch: {
      name?: string;
      type?: string;
      latitude?: number;
      longitude?: number;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      patch.name = args.name;
    }

    if (args.type !== undefined) {
      patch.type = args.type;
    }

    if (args.latitude !== undefined) {
      patch.latitude = args.latitude;
    }

    if (args.longitude !== undefined) {
      patch.longitude = args.longitude;
    }

    await ctx.db.patch(args.deviceId, patch);

    return await ctx.db.get(args.deviceId);
  },
});

export const activate = mutation({
  args: {
    deviceId: v.id("kioskDevices"),
  },

  handler: async (ctx, args) => {
    const device = await getDeviceOrThrow(ctx, args.deviceId);

    await requireBusinessRole(ctx, device.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    await ctx.db.patch(args.deviceId, {
      status: DEVICE_STATUS.ACTIVE,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.deviceId);
  },
});

export const deactivate = mutation({
  args: {
    deviceId: v.id("kioskDevices"),
  },

  handler: async (ctx, args) => {
    const device = await getDeviceOrThrow(ctx, args.deviceId);

    await requireBusinessRole(ctx, device.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    await ctx.db.patch(args.deviceId, {
      status: DEVICE_STATUS.INACTIVE,
      updatedAt: Date.now(),
    });

    /*
     * Revoke all active sessions when the device
     * itself is deactivated.
     */
    const sessions = await ctx.db
      .query("deviceSessions")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .collect();

    const now = Date.now();

    for (const session of sessions) {
      if (!session.revokedAt) {
        await ctx.db.patch(session._id, {
          revokedAt: now,
        });
      }
    }

    return await ctx.db.get(args.deviceId);
  },
});

/* -------------------------------------------------------------------------- */
/* Device sessions                                                            */
/* -------------------------------------------------------------------------- */

export const createSession = mutation({
  args: {
    deviceIdentifier: v.string(),
    deviceSecret: v.string(),
  },

  handler: async (ctx, args) => {
    const device = await getDeviceByDeviceIdOrThrow(ctx, args.deviceIdentifier);

    if (device.status !== DEVICE_STATUS.ACTIVE) {
      throw new Error("Device is inactive");
    }

    const providedHash = await hashSecret(args.deviceSecret);

    if (providedHash !== device.tokenHash) {
      throw new Error("Invalid device credentials");
    }

    const sessionSecret = generateSecret();

    const sessionHash = await hashSecret(sessionSecret);

    const now = Date.now();
    const expiresAt = now + SESSION_DURATION_MS;

    const sessionId = await ctx.db.insert("deviceSessions", {
      deviceId: device._id,
      sessionHash,
      createdAt: now,
      expiresAt,
      lastSeenAt: now,
    });

    await ctx.db.patch(device._id, {
      lastSeenAt: now,
      updatedAt: now,
    });

    return {
      sessionId,
      sessionSecret,
      expiresAt,
    };
  },
});

/* -------------------------------------------------------------------------- */
/* Session validation                                                         */
/* -------------------------------------------------------------------------- */

export const validateSession = mutation({
  args: {
    sessionSecret: v.string(),
  },

  handler: async (ctx, args) => {
    const sessionHash = await hashSecret(args.sessionSecret);

    const session = await ctx.db
      .query("deviceSessions")
      .withIndex("by_sessionHash", (q) => q.eq("sessionHash", sessionHash))
      .unique();

    if (!session) {
      throw new Error("Invalid device session");
    }

    const now = Date.now();

    if (session.revokedAt) {
      throw new Error("Device session has been revoked");
    }

    if (session.expiresAt <= now) {
      throw new Error("Device session has expired");
    }

    const device = await ctx.db.get(session.deviceId);

    if (!device) {
      throw new Error("Device no longer exists");
    }

    if (device.status !== DEVICE_STATUS.ACTIVE) {
      throw new Error("Device is inactive");
    }

    await ctx.db.patch(session._id, {
      lastSeenAt: now,
    });

    await ctx.db.patch(device._id, {
      lastSeenAt: now,
      updatedAt: now,
    });

    return {
      valid: true,
      deviceId: device._id,
      businessId: device.businessId,
      sessionId: session._id,
      expiresAt: session.expiresAt,
    };
  },
});

/* -------------------------------------------------------------------------- */
/* Session revocation                                                         */
/* -------------------------------------------------------------------------- */

export const revokeSession = mutation({
  args: {
    sessionId: v.id("deviceSessions"),
  },

  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new Error("Device session not found");
    }

    const device = await getDeviceOrThrow(ctx, session.deviceId);

    await requireBusinessRole(ctx, device.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    if (!session.revokedAt) {
      await ctx.db.patch(args.sessionId, {
        revokedAt: Date.now(),
      });
    }

    return true;
  },
});

export const revokeAllSessions = mutation({
  args: {
    deviceId: v.id("kioskDevices"),
  },

  handler: async (ctx, args) => {
    const device = await getDeviceOrThrow(ctx, args.deviceId);

    await requireBusinessRole(ctx, device.businessId, [
      "OWNER",
      "ADMIN",
      "MANAGER",
    ]);

    const sessions = await ctx.db
      .query("deviceSessions")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .collect();

    const now = Date.now();

    for (const session of sessions) {
      if (!session.revokedAt) {
        await ctx.db.patch(session._id, {
          revokedAt: now,
        });
      }
    }

    return true;
  },
});

/* -------------------------------------------------------------------------- */
/* Session queries                                                            */
/* -------------------------------------------------------------------------- */

export const getSessions = query({
  args: {
    deviceId: v.id("kioskDevices"),
    includeExpired: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    const device = await getDeviceOrThrow(ctx, args.deviceId);

    await requireBusinessMember(ctx, device.businessId);

    const sessions = await ctx.db
      .query("deviceSessions")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .collect();

    const now = Date.now();

    const filtered = args.includeExpired
      ? sessions
      : sessions.filter(
          (session) => session.expiresAt > now && !session.revokedAt,
        );

    /*
     * sessionHash is intentionally never returned.
     */
    return filtered.map((session) => ({
      _id: session._id,
      _creationTime: session._creationTime,
      deviceId: session.deviceId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastSeenAt: session.lastSeenAt,
      revokedAt: session.revokedAt,
    }));
  },
});
