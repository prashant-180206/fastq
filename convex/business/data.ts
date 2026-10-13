import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../lib/auth";
import { requireBusinessOwner } from "../lib/authorization";

// Shared validator for weekly business hours.
const timeSlot = v.object({
  open: v.string(), // "09:00" — 24-hour HH:mm
  close: v.string(), // "17:00" — 24-hour HH:mm
});

const businessDay = v.object({
  day: v.union(
    v.literal("monday"),
    v.literal("tuesday"),
    v.literal("wednesday"),
    v.literal("thursday"),
    v.literal("friday"),
    v.literal("saturday"),
    v.literal("sunday"),
  ),
  isOpen: v.boolean(),
  slots: v.array(timeSlot),
});

export const businessType = v.union(
  v.literal("business"),
  v.literal("government_office"),
  v.literal("restaurant"),
  v.literal("salon"),
  v.literal("other"),
);

const locationFields = v.object({
  latitude: v.number(),
  longitude: v.number(),
});

type LocationFields = {
  latitude: number;
  longitude: number;
};

function validateLocation(
  location: LocationFields | undefined,
): LocationFields | undefined {
  if (location === undefined) {
    return undefined;
  }

  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    throw new Error("Location must be valid coordinates.");
  }

  if (location.latitude < -90 || location.latitude > 90) {
    throw new Error("Latitude must be between -90 and 90.");
  }

  if (location.longitude < -180 || location.longitude > 180) {
    throw new Error("Longitude must be between -180 and 180.");
  }

  return location;
}

// CREATE BUSINESS
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    type: v.optional(businessType),
    location: v.optional(locationFields),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const name = args.name.trim();

    if (!name) {
      throw new Error("Business name is required.");
    }

    const now = Date.now();

    return await ctx.db.insert("businesses", {
      name,
      ownerId: user._id,
      description: args.description?.trim(),
      contactEmail: args.contactEmail?.trim(),
      phone: args.phone?.trim(),
      type: args.type ?? "business",
      location: validateLocation(args.location),
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

// UPDATE BUSINESS DETAILS
export const update = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    type: v.optional(businessType),
    location: v.optional(locationFields),
  },

  handler: async (ctx, args) => {
    await requireBusinessOwner(ctx, args.businessId);

    const patch: {
      name?: string;
      description?: string;
      contactEmail?: string;
      phone?: string;
      type?: typeof businessType.type;
      location?: LocationFields | undefined;
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

    if (args.description !== undefined) {
      patch.description = args.description.trim();
    }

    if (args.contactEmail !== undefined) {
      patch.contactEmail = args.contactEmail.trim();
    }

    if (args.phone !== undefined) {
      patch.phone = args.phone.trim();
    }

    if (args.type !== undefined) {
      patch.type = args.type;
    }

    if (args.location !== undefined) {
      patch.location = validateLocation(args.location);
    }

    await ctx.db.patch(args.businessId, patch);

    return await ctx.db.get(args.businessId);
  },
});

// UPDATE BUSINESS HOURS
export const updateBusinessHours = mutation({
  args: {
    businessId: v.id("businesses"),
    businessHours: v.array(businessDay),
  },

  handler: async (ctx, args) => {
    await requireBusinessOwner(ctx, args.businessId);

    // Validate the weekly schedule has no duplicate days.
    const days = args.businessHours.map((item) => item.day);

    if (new Set(days).size !== days.length) {
      throw new Error("Business hours cannot contain duplicate days.");
    }

    // Validate the time format and ensure each slot has
    // a positive duration within the same calendar day.
    for (const day of args.businessHours) {
      if (!day.isOpen && day.slots.length > 0) {
        throw new Error(`Closed day "${day.day}" cannot contain time slots.`);
      }

      if (day.isOpen && day.slots.length === 0) {
        throw new Error(
          `Open day "${day.day}" must contain at least one time slot.`,
        );
      }

      const slots = day.slots.map((slot) => {
        const parseTime = (time: string) => {
          if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
            throw new Error(`Invalid time "${time}". Use HH:mm format.`);
          }

          const [hours, minutes] = time.split(":").map(Number);
          return hours * 60 + minutes;
        };

        const open = parseTime(slot.open);
        const close = parseTime(slot.close);

        if (open >= close) {
          throw new Error(
            `Closing time must be later than opening time on ${day.day}.`,
          );
        }

        return { open, close };
      });

      // Sort a copy by opening time to detect overlapping slots.
      slots.sort((a, b) => a.open - b.open);

      for (let i = 1; i < slots.length; i++) {
        if (slots[i].open < slots[i - 1].close) {
          throw new Error(`Time slots cannot overlap on ${day.day}.`);
        }
      }
    }

    await ctx.db.patch(args.businessId, {
      businessHours: args.businessHours,
      updatedAt: Date.now(),
    });

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

// GET ALL BUSINESSES FOR CUSTOMERS TO SEE

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const businesses = await ctx.db.query("businesses").collect();

    const activeBusinesses = businesses
      .filter((business) => business.status === "active")
      .sort((a, b) => b.createdAt - a.createdAt);

    return Promise.all(
      activeBusinesses.map(async (business) => ({
        _id: business._id,
        name: business.name,
        description: business.description,
        logoUrl: business.logoStorageId
          ? await ctx.storage.getUrl(business.logoStorageId)
          : null,
        contactEmail: business.contactEmail,
        phone: business.phone,
        type: business.type ?? "business",
        location: business.location,
        businessHours: business.businessHours,
        createdAt: business.createdAt,
      })),
    );
  },
});

export const getPublicById = query({
  args: {
    businessId: v.id("businesses"),
  },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId);

    if (!business || business.status !== "active") {
      return null;
    }

    const logoUrl = business.logoStorageId
      ? await ctx.storage.getUrl(business.logoStorageId)
      : null;

    return {
      _id: business._id,
      name: business.name,
      description: business.description,
      logoUrl,
      contactEmail: business.contactEmail,
      phone: business.phone,
      type: business.type ?? "business",
      location: business.location,
      businessHours: business.businessHours,
      createdAt: business.createdAt,
    };
  },
});

