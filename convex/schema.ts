import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const timeSlot = v.object({
  open: v.string(),
  close: v.string(),
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

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    tokenIdentifier: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_phone", ["phone"]),

  businesses: defineTable({
    name: v.string(),

    ownerId: v.id("users"),

    description: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),

    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Weekly operating schedule; configurable after creation.
    businessHours: v.optional(v.array(businessDay)),

    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("archived"),
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  queues: defineTable({
    businessId: v.id("businesses"),
    serviceId: v.id("services"),

    name: v.string(),
    description: v.string(),

    prerequisites: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        description: v.optional(v.string()),
        isRequired: v.boolean(),
      }),
    ),

    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("closed"),
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_status", ["businessId", "status"]),

  services: defineTable({
    businessId: v.id("businesses"),

    name: v.string(),
    description: v.optional(v.string()),

    // Average time required to serve one customer.
    durationMinutes: v.number(),

    queueEnabled: v.boolean(),
    appointmentsEnabled: v.boolean(),
    isActive: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_business_and_active", ["businessId", "isActive"]),

  appointments: defineTable({
    businessId: v.id("businesses"),
    serviceId: v.id("services"),
    userId: v.id("users"),

    // Denormalized scheduling values for reliable historical records.
    scheduledStart: v.number(),
    scheduledEnd: v.number(),

    status: v.union(
      v.literal("booked"),
      v.literal("checked_in"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show"),
    ),

    notes: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),

    checkedInAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_business_and_start", ["businessId", "scheduledStart"])
    .index("by_service_and_start", ["serviceId", "scheduledStart"])
    .index("by_customer", ["userId"])
    .index("by_business_and_status", ["businessId", "status"]),
});
