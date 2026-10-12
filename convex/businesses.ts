import { mutation, query } from "./_generated/server";

import { v } from "convex/values";
import { requireUser } from "./lib/auth";
import { requireBusinessOwner } from "./lib/authorization";

// CREATE BUSINESS
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const name = args.name.trim();
    const slug = args.slug.trim().toLowerCase();

    if (!name) {
      throw new Error("Business name is required.");
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(
        "Slug must contain lowercase letters, numbers, and single hyphens.",
      );
    }

    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existing) {
      throw new Error("This business slug is already taken.");
    }

    const now = Date.now();

    return await ctx.db.insert("businesses", {
      name,
      slug,
      ownerId: user._id,
      description: args.description?.trim(),
      contactEmail: args.contactEmail?.trim(),
      phone: args.phone?.trim(),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// READ ONE BUSINESS
export const getById = query({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    const { business } = await requireBusinessOwner(ctx, args.businessId);
    return business;
  },
});

// READ MY BUSINESSES
export const getMine = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
  },
});

// UPDATE BUSINESS
export const update = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const { business } = await requireBusinessOwner(ctx, args.businessId);

    const patch: {
      name?: string;
      slug?: string;
      description?: string;
      contactEmail?: string;
      phone?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      const name = args.name.trim();

      if (!name) {
        throw new Error("Business name cannot be empty.");
      }

      patch.name = name;
    }

    if (args.slug !== undefined) {
      const slug = args.slug.trim().toLowerCase();

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new Error("Invalid business slug.");
      }

      const existing = await ctx.db
        .query("businesses")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();

      if (existing && existing._id !== business._id) {
        throw new Error("This business slug is already taken.");
      }

      patch.slug = slug;
    }

    if (args.description !== undefined) {
      patch.description = args.description.trim();
    }

    if (args.contactEmail !== undefined) {
      patch.contactEmail = args.contactEmail.trim();
    }

    if (args.phone !== undefined) {
      patch.phone = args.phone.trim();
    }

    await ctx.db.patch(args.businessId, patch);

    return await ctx.db.get(args.businessId);
  },
});

// DELETE BUSINESS
export const remove = mutation({
  args: {
    businessId: v.id("businesses"),
  },

  handler: async (ctx, args) => {
    await requireBusinessOwner(ctx, args.businessId);

    await ctx.db.delete(args.businessId);

    return { success: true };
  },
});
