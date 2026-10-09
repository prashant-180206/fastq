import { mutation, query } from "./_generated/server";

import { v } from "convex/values";

import { requireUser } from "./lib/auth";

import {
  requireBusinessMember,
  requireBusinessRole,
} from "./lib/authorization";

// ============================================================
// BUSINESS ROLES
// ============================================================

const BUSINESS_ROLES = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
} as const;

// ============================================================
// CREATE BUSINESS
// ============================================================

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),

    city: v.string(),
    address: v.string(),

    latitude: v.number(),
    longitude: v.number(),

    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const now = Date.now();

    const businessId = await ctx.db.insert("businesses", {
      name: args.name,
      description: args.description,

      type: args.type,

      city: args.city,
      address: args.address,

      latitude: args.latitude,
      longitude: args.longitude,

      phone: args.phone,
      website: args.website,
      logoUrl: args.logoUrl,

      isActive: true,

      createdAt: now,
      updatedAt: now,
    });

    // --------------------------------------------------------
    // Business settings
    // --------------------------------------------------------

    await ctx.db.insert("businessSettings", {
      businessId,

      queueEnabled: true,
      appointmentsEnabled: false,

      appointmentMode: "DISABLED",

      queueSettings: {},
      notificationSettings: {},

      createdAt: now,
      updatedAt: now,
    });

    // --------------------------------------------------------
    // Owner membership
    // --------------------------------------------------------

    await ctx.db.insert("businessMembers", {
      userId: user._id,
      businessId,

      role: BUSINESS_ROLES.OWNER,

      joinedAt: now,
      isActive: true,
    });

    return businessId;
  },
});

// ============================================================
// GET BUSINESS
// ============================================================

/**
 * Public business lookup.
 *
 * Only active businesses are exposed.
 */
export const get = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);

    if (!business || !business.isActive) {
      return null;
    }

    return business;
  },
});
// ============================================================
// PUBLIC DISCOVERY
// ============================================================

export const listPublic = query({
  args: {
    search: v.optional(v.string()),
    type: v.optional(v.string()),
    city: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const businesses = await ctx.db.query("businesses").collect();

    const search = args.search?.trim().toLowerCase();
    const type = args.type?.trim().toLowerCase();
    const city = args.city?.trim().toLowerCase();

    return businesses
      .filter((business) => business.isActive)
      .filter((business) => {
        if (!type) return true;

        return business.type.toLowerCase() === type;
      })
      .filter((business) => {
        if (!city) return true;

        return business.city.toLowerCase().includes(city);
      })
      .filter((business) => {
        if (!search) return true;

        const haystack = [
          business.name,
          business.description ?? "",
          business.type,
          business.city,
          business.address,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

// ============================================================
// GET BUSINESS FOR MEMBER
// ============================================================

export const getForMember = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    return await ctx.db.get(args.businessId);
  },
});

// ============================================================
// GET MY BUSINESSES
// ============================================================

export const getMyBusinesses = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const memberships = await ctx.db
      .query("businessMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const businesses = await Promise.all(
      memberships
        .filter((membership) => membership.isActive)
        .map(async (membership) => {
          const business = await ctx.db.get(membership.businessId);

          if (!business || !business.isActive) {
            return null;
          }

          return {
            ...business,
            membershipRole: membership.role,
            membershipId: membership._id,
          };
        }),
    );

    return businesses.filter(
      (business): business is NonNullable<typeof business> => business !== null,
    );
  },
});

// ============================================================
// UPDATE BUSINESS
// ============================================================

export const update = mutation({
  args: {
    businessId: v.id("businesses"),

    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),

    city: v.optional(v.string()),
    address: v.optional(v.string()),

    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),

    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, [
      BUSINESS_ROLES.OWNER,
      BUSINESS_ROLES.MANAGER,
    ]);

    const { businessId, ...updates } = args;

    await ctx.db.patch(businessId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(businessId);
  },
});

// ============================================================
// DEACTIVATE BUSINESS
// ============================================================

export const deactivate = mutation({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessRole(ctx, args.businessId, [BUSINESS_ROLES.OWNER]);

    const business = await ctx.db.get(args.businessId);

    if (!business) {
      throw new Error("Business not found");
    }

    if (!business.isActive) {
      return true;
    }

    await ctx.db.patch(args.businessId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// ============================================================
// GET BUSINESS MEMBERS
// ============================================================

export const getMembers = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessMember(ctx, args.businessId);

    const members = await ctx.db
      .query("businessMembers")
      .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
      .collect();

    return await Promise.all(
      members.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);

        return {
          membership,
          user,
        };
      }),
    );
  },
});

// ============================================================
// ADD BUSINESS MEMBER
// ============================================================

export const addMember = mutation({
  args: {
    businessId: v.id("businesses"),

    userId: v.id("users"),

    role: v.union(
      v.literal(BUSINESS_ROLES.MANAGER),
      v.literal(BUSINESS_ROLES.STAFF),
    ),
  },

  handler: async (ctx, args) => {
    /*
     * Managers may add staff.
     * Owners may add managers or staff.
     *
     * OWNER can never be granted through this mutation.
     * Ownership changes should use a dedicated transfer operation.
     */

    const user = await requireUser(ctx);

    const membership = await ctx.db
      .query("businessMembers")
      .withIndex("by_userId_businessId", (q) =>
        q.eq("userId", user._id).eq("businessId", args.businessId),
      )
      .unique();

    if (!membership || !membership.isActive) {
      throw new Error("You are not an active member of this business");
    }

    // --------------------------------------------------------
    // Authorization hierarchy
    // --------------------------------------------------------

    if (
      membership.role !== BUSINESS_ROLES.OWNER &&
      membership.role !== BUSINESS_ROLES.MANAGER
    ) {
      throw new Error("Insufficient permissions to add members");
    }

    if (
      membership.role === BUSINESS_ROLES.MANAGER &&
      args.role !== BUSINESS_ROLES.STAFF
    ) {
      throw new Error("Managers can only add staff members");
    }

    // --------------------------------------------------------
    // Target user
    // --------------------------------------------------------

    const targetUser = await ctx.db.get(args.userId);

    if (!targetUser) {
      throw new Error("User not found");
    }

    // --------------------------------------------------------
    // Existing membership
    // --------------------------------------------------------

    const existing = await ctx.db
      .query("businessMembers")
      .withIndex("by_userId_businessId", (q) =>
        q.eq("userId", args.userId).eq("businessId", args.businessId),
      )
      .unique();

    const now = Date.now();

    if (existing) {
      if (existing.isActive) {
        throw new Error("User is already an active member of this business");
      }

      await ctx.db.patch(existing._id, {
        role: args.role,
        isActive: true,
        joinedAt: now,
      });

      return existing._id;
    }

    return await ctx.db.insert("businessMembers", {
      userId: args.userId,
      businessId: args.businessId,

      role: args.role,

      joinedAt: now,
      isActive: true,
    });
  },
});

// ============================================================
// REMOVE BUSINESS MEMBER
// ============================================================

export const removeMember = mutation({
  args: {
    businessId: v.id("businesses"),

    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const actorMembership = await ctx.db
      .query("businessMembers")
      .withIndex("by_userId_businessId", (q) =>
        q.eq("userId", user._id).eq("businessId", args.businessId),
      )
      .unique();

    if (!actorMembership || !actorMembership.isActive) {
      throw new Error("You are not an active member of this business");
    }

    // Only owners can remove members.
    if (actorMembership.role !== BUSINESS_ROLES.OWNER) {
      throw new Error("Only the owner can remove business members");
    }

    const membership = await ctx.db
      .query("businessMembers")
      .withIndex("by_userId_businessId", (q) =>
        q.eq("userId", args.userId).eq("businessId", args.businessId),
      )
      .unique();

    if (!membership || !membership.isActive) {
      throw new Error("Active business membership not found");
    }

    // --------------------------------------------------------
    // Prevent removing the last owner
    // --------------------------------------------------------

    if (membership.role === BUSINESS_ROLES.OWNER) {
      const activeOwners = await ctx.db
        .query("businessMembers")
        .withIndex("by_businessId", (q) => q.eq("businessId", args.businessId))
        .collect();

      const ownerCount = activeOwners.filter(
        (member) => member.isActive && member.role === BUSINESS_ROLES.OWNER,
      ).length;

      if (ownerCount <= 1) {
        throw new Error("Cannot remove the last owner of a business");
      }
    }

    await ctx.db.patch(membership._id, {
      isActive: false,
    });

    return true;
  },
});
