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

    // Business category used for discovery and filtering.
    type: v.optional(
      v.union(
        v.literal("business"),
        v.literal("government_office"),
        v.literal("restaurant"),
        v.literal("salon"),
        v.literal("other"),
      ),
    ),

    // WGS84 geographic coordinates (lat/lng) for directions and nearby discovery.
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      }),
    ),

    // Weekly operating schedule; configurable after creation.
    businessHours: v.optional(v.array(businessDay)),

    // Denormalized searchable text (name + description + contact) for the
    // full-text search index. Kept in sync by create/update mutations and
    // backfilled for pre-existing businesses by `business/migrations`.
    searchText: v.optional(v.string()),

    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("archived"),
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .searchIndex("by_search_text", {
      searchField: "searchText",
    }),

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
    gracePeriodMinutes: v.optional(v.number()),

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

  queueTokens: defineTable({
    // Relationships
    businessId: v.id("businesses"),
    queueId: v.id("queues"),
    serviceId: v.id("services"),
    customerId: v.id("users"),

    // Customer-facing ticket number
    tokenNumber: v.number(),

    // Queue lifecycle
    status: v.union(
      v.literal("waiting"),
      v.literal("called"),
      v.literal("checked_in"),
      v.literal("serving"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show"),
      v.literal("skipped"),
      v.literal("expired"),
    ),

    // Timing
    joinedAt: v.number(),
    calledAt: v.optional(v.number()),
    checkedInAt: v.optional(v.number()),
    serviceStartedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    noShowAt: v.optional(v.number()),
    skippedAt: v.optional(v.number()),
    expiredAt: v.optional(v.number()),

    // Grace period: snapshot the policy at token creation
    gracePeriodMinutes: v.number(),
    graceDeadlineAt: v.optional(v.number()),

    // Hard validity deadline, independent of the grace period
    expiresAt: v.optional(v.number()),

    // Optional operational information
    estimatedWaitMinutes: v.optional(v.number()),
    customerNote: v.optional(v.string()),

    // Snapshot of customer acknowledgements at joining time
    acknowledgedPrerequisites: v.array(
      v.object({
        prerequisiteId: v.string(),
        acknowledgedAt: v.number(),
      }),
    ),

    updatedAt: v.number(),
  })
    .index("by_queue", ["queueId"])
    .index("by_queue_and_status", ["queueId", "status"])
    .index("by_queue_and_token_number", ["queueId", "tokenNumber"])
    .index("by_customer", ["customerId"])
    .index("by_customer_and_status", ["customerId", "status"])
    .index("by_business_and_joined_at", ["businessId", "joinedAt"])
    .index("by_status_and_grace_deadline", ["status", "graceDeadlineAt"])
    .index("by_status_and_expiry", ["status", "expiresAt"]),
});
