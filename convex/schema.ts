import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // ============================================================
  // USERS
  // ============================================================

  users: defineTable({
    // Convex Auth
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    // Quiskip
    avatarUrl: v.optional(v.string()),
    authProvider: v.optional(v.string()),
    role: v.optional(v.string()),

    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_phone", ["phone"]),

  // ============================================================
  // BUSINESS MEMBERS
  // ============================================================

  businessMembers: defineTable({
    userId: v.id("users"),
    businessId: v.id("businesses"),

    role: v.string(),

    joinedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_businessId", ["businessId"])
    .index("by_userId_businessId", ["userId", "businessId"]),

  // ============================================================
  // BUSINESSES
  // ============================================================

  businesses: defineTable({
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

    isActive: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_city", ["city"])
    .index("by_type", ["type"])
    .index("by_city_type", ["city", "type"])
    .index("by_isActive", ["isActive"]),

  // ============================================================
  // BUSINESS SETTINGS
  // ============================================================

  businessSettings: defineTable({
    businessId: v.id("businesses"),

    queueEnabled: v.boolean(),
    appointmentsEnabled: v.boolean(),

    appointmentMode: v.string(),

    queueSettings: v.optional(v.any()),
    notificationSettings: v.optional(v.any()),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_businessId", ["businessId"]),

  // ============================================================
  // BUSINESS HOURS
  // ============================================================

  businessHours: defineTable({
    businessId: v.id("businesses"),

    dayOfWeek: v.number(),

    isOpen: v.boolean(),

    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),
  })
    .index("by_businessId", ["businessId"])
    .index("by_businessId_dayOfWeek", ["businessId", "dayOfWeek"]),

  // ============================================================
  // BUSINESS CLOSURES
  // ============================================================

  businessClosures: defineTable({
    businessId: v.id("businesses"),

    date: v.string(),

    isClosed: v.boolean(),

    openTime: v.optional(v.string()),
    closeTime: v.optional(v.string()),

    reason: v.optional(v.string()),
  })
    .index("by_businessId", ["businessId"])
    .index("by_businessId_date", ["businessId", "date"]),

  // ============================================================
  // SERVICES
  // ============================================================

  services: defineTable({
    businessId: v.id("businesses"),

    name: v.string(),
    description: v.optional(v.string()),

    type: v.string(),

    queueEnabled: v.boolean(),
    appointmentsEnabled: v.boolean(),

    appointmentDuration: v.optional(v.number()),

    isActive: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_businessId", ["businessId"])
    .index("by_businessId_isActive", ["businessId", "isActive"]),

  // ============================================================
  // QUEUES
  // ============================================================

  queues: defineTable({
    businessId: v.id("businesses"),
    serviceId: v.id("services"),

    name: v.string(),
    description: v.optional(v.string()),

    type: v.string(),

    currentNumber: v.number(),

    status: v.string(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_businessId", ["businessId"])
    .index("by_serviceId", ["serviceId"])
    .index("by_businessId_serviceId", ["businessId", "serviceId"])
    .index("by_businessId_status", ["businessId", "status"]),

  // ============================================================
  // QUEUE TOKENS
  // ============================================================

  queueTokens: defineTable({
    queueId: v.id("queues"),
    userId: v.id("users"),
    appointmentId: v.optional(v.id("appointments")),

    // ADD
    counterId: v.optional(v.id("counters")),

    tokenNumber: v.string(),
    status: v.string(),
    position: v.number(),
    estimatedWaitTime: v.number(),
    joinedAt: v.number(),
    calledAt: v.optional(v.number()),
    servingAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
  })
    .index("by_queueId", ["queueId"])
    .index("by_userId", ["userId"])
    .index("by_appointmentId", ["appointmentId"])

    // ADD
    .index("by_counterId", ["counterId"])
    .index("by_counterId_status", ["counterId", "status"])

    .index("by_queueId_status", ["queueId", "status"])
    .index("by_queueId_position", ["queueId", "position"])
    .index("by_userId_status", ["userId", "status"]),
  // ============================================================
  // QUEUE EVENTS
  // ============================================================

  queueEvents: defineTable({
    queueId: v.id("queues"),

    tokenId: v.id("queueTokens"),

    eventType: v.string(),

    metadata: v.optional(v.any()),

    createdAt: v.number(),

    actorId: v.optional(v.id("users")),
  })
    .index("by_queueId", ["queueId"])
    .index("by_tokenId", ["tokenId"])
    .index("by_actorId", ["actorId"])
    .index("by_queueId_createdAt", ["queueId", "createdAt"]),

  // ============================================================
  // COUNTERS
  // ============================================================

  counters: defineTable({
    businessId: v.id("businesses"),

    name: v.string(),
    number: v.string(),

    status: v.string(),

    isActive: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_businessId", ["businessId"])
    .index("by_businessId_isActive", ["businessId", "isActive"]),

  // ============================================================
  // COUNTER ASSIGNMENTS
  // ============================================================

  counterAssignments: defineTable({
    counterId: v.id("counters"),

    queueId: v.optional(v.id("queues")),
    serviceId: v.optional(v.id("services")),

    isActive: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_counterId", ["counterId"])
    .index("by_queueId", ["queueId"])
    .index("by_serviceId", ["serviceId"])
    .index("by_counterId_isActive", ["counterId", "isActive"]),

  // ============================================================
  // APPOINTMENT SLOTS
  // ============================================================

  appointmentSlots: defineTable({
    businessId: v.id("businesses"),
    serviceId: v.id("services"),

    date: v.string(),

    startTime: v.string(),
    endTime: v.string(),

    capacity: v.number(),

    bookedCount: v.number(),

    isAvailable: v.boolean(),
  })
    .index("by_businessId", ["businessId"])
    .index("by_serviceId", ["serviceId"])
    .index("by_businessId_date", ["businessId", "date"])
    .index("by_serviceId_date", ["serviceId", "date"])
    .index("by_businessId_serviceId_date", ["businessId", "serviceId", "date"]),

  // ============================================================
  // APPOINTMENTS
  // ============================================================

  appointments: defineTable({
    businessId: v.id("businesses"),
    serviceId: v.id("services"),
    userId: v.id("users"),

    appointmentSlotId: v.id("appointmentSlots"),

    status: v.string(),

    scheduledStart: v.number(),
    scheduledEnd: v.number(),

    checkedInAt: v.optional(v.number()),

    createdAt: v.number(),

    cancelledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_businessId", ["businessId"])
    .index("by_serviceId", ["serviceId"])
    .index("by_userId", ["userId"])
    .index("by_appointmentSlotId", ["appointmentSlotId"])
    .index("by_businessId_status", ["businessId", "status"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_businessId_scheduledStart", ["businessId", "scheduledStart"]),

  // ============================================================
  // APPOINTMENT EVENTS
  // ============================================================

  appointmentEvents: defineTable({
    appointmentId: v.id("appointments"),

    type: v.string(),

    createdAt: v.number(),

    actorId: v.optional(v.id("users")),

    metadata: v.optional(v.any()),
  })
    .index("by_appointmentId", ["appointmentId"])
    .index("by_actorId", ["actorId"])
    .index("by_appointmentId_createdAt", ["appointmentId", "createdAt"]),

  // ============================================================
  // DEVICES / KIOSKS
  // ============================================================

  kioskDevices: defineTable({
    businessId: v.id("businesses"),

    name: v.string(),

    type: v.string(),

    deviceId: v.string(),

    // Store only a hash.
    tokenHash: v.string(),

    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),

    status: v.string(),

    lastSeenAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_businessId", ["businessId"])
    .index("by_deviceId", ["deviceId"])
    .index("by_businessId_status", ["businessId", "status"]),

  // ============================================================
  // DEVICE SESSIONS
  // ============================================================

  deviceSessions: defineTable({
    deviceId: v.id("kioskDevices"),

    sessionHash: v.string(),

    createdAt: v.number(),

    expiresAt: v.number(),

    lastSeenAt: v.number(),

    revokedAt: v.optional(v.number()),
  })
    .index("by_deviceId", ["deviceId"])
    .index("by_sessionHash", ["sessionHash"])
    .index("by_deviceId_expiresAt", ["deviceId", "expiresAt"]),

  // ============================================================
  // DEVICE EVENTS
  // ============================================================

  deviceEvents: defineTable({
    deviceId: v.id("kioskDevices"),

    eventType: v.string(),

    metadata: v.optional(v.any()),

    createdAt: v.number(),
  })
    .index("by_deviceId", ["deviceId"])
    .index("by_deviceId_createdAt", ["deviceId", "createdAt"]),

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  notifications: defineTable({
    businessId: v.optional(v.id("businesses")),
    userId: v.optional(v.id("users")),
    deviceId: v.optional(v.id("kioskDevices")),

    type: v.string(),

    title: v.string(),
    message: v.string(),

    isRead: v.boolean(),

    createdAt: v.number(),

    readAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_businessId", ["businessId"])
    .index("by_deviceId", ["deviceId"])
    .index("by_userId_isRead", ["userId", "isRead"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  // ============================================================
  // USER LOCATIONS
  // ============================================================

  userLocations: defineTable({
    userId: v.id("users"),

    latitude: v.number(),
    longitude: v.number(),

    accuracy: v.optional(v.number()),

    source: v.string(),

    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),
});
