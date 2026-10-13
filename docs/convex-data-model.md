# Data model & Convex API

Schema lives in `convex/schema.ts` (`defineSchema`). Auth tables (`authTables`) are merged in automatically.

## Tables

### users
- Optional identity fields (`name`, `email`, `phone`, `image`), verification timestamps, `isActive`, `createdAt`, `lastLoginAt`.
- Indexes: `by_token_identifier`, `by_email`, `by_phone`.

### businesses
- `ownerId` (user), `name`, `description`, `logoStorageId`, `contactEmail`, `phone`, `businessHours` (weekly schedule: per-day open/close slots, `isOpen`).
- `status`: `active` | `archived`. `createdAt`/`updatedAt`.
- Index: `by_owner`.

### queues
- Belongs to a business + service. `name`, `description`, `prerequisites` (id/label/description/isRequired), `status` (`active` | `paused` | `closed`), `gracePeriodMinutes`.
- Indexes: `by_business`, `by_business_and_status`.

### services
- Belongs to a business. `name`, `description`, `durationMinutes`, `queueEnabled`, `appointmentsEnabled`, `isActive`.
- Indexes: `by_business`, `by_business_and_active`.

### appointments
- `businessId`, `serviceId`, `userId`; denormalized `scheduledStart`/`scheduledEnd`; `status` (`booked`, `checked_in`, `completed`, `cancelled`, `no_show`); `notes`; lifecycle timestamps.
- Indexes: `by_business_and_start`, `by_service_and_start`, `by_customer`, `by_business_and_status`.

### queueTokens
- `businessId`, `queueId`, `serviceId`, `customerId`, `tokenNumber`; status (`waiting`, `called`, `checked_in`, `serving`, `completed`, cancelled/skipped/expired/no-show); timing fields per transition; `gracePeriodMinutes` + `graceDeadlineAt` (snapshot at creation), `expiresAt` (hard validity), `estimatedWaitMinutes`, `customerNote`, `acknowledgedPrerequisites` snapshot.
- Indexes: `by_queue`, `by_queue_and_status`, `by_queue_and_token_number`, `by_customer`, `by_customer_and_status`, `by_business_and_joined_at`, `by_status_and_grace_deadline`, `by_status_and_expiry` (used by expiry sweeps).

## Business functions

Backend functions live in `convex/business/*.ts`. Shared authorization helpers are in `convex/lib/`.

### data.ts (`businesses`)
`create`, `getById`, `getMine`, `update`, `updateBusinessHours`, `remove`, `getAll` (public, used by the discover list), `getPublicById`.

### services.ts
`create`, `getById`, `getByBusiness`, `getActiveByBusiness`, `update`, `remove`, `getPublicByBusiness`.

### queue.ts
`create`, `getById`, `getByBusiness`, `getActiveByBusiness`, `update`, `remove`, `getPublicByBusiness`.

### queueCapacity.ts (tokens)
`getDailyAvailability`, `joinQueue`, `callNext`, `checkInToken`, `startServing`, `completeToken`, `cancelToken`, `skipToken`, `getMyTokens`, `getMyTokenById`, `getActiveTokensByQueue`.

### appointments.ts
`getAvailableSlots`, `book`, `getMyAppointments`, `getByBusiness`, `cancel`, `checkIn`, `complete`, `markNoShow`, `getMyAppointmentById`.

## Reading customer records

Customer queries (`getMyTokens`, `getMyTokens`/`getMyTokenById`, `getMyAppointments`, `getMyAppointmentById`) return **raw documents** — they do not join business/service names. Pages resolve display names client-side with `api.business.data.getAll` map lookups (see the customer route pages).

## Timestamps

All timestamps are epoch milliseconds (IST semantics enforced at the business-hours/availability layer). Use the formatters in `src/lib/format.ts` rather than `Date` methods in render contexts.