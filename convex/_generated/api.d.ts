/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appointmentSlots from "../appointmentSlots.js";
import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as businessClosures from "../businessClosures.js";
import type * as businessHours from "../businessHours.js";
import type * as businessSettings from "../businessSettings.js";
import type * as businesses from "../businesses.js";
import type * as counterOperations from "../counterOperations.js";
import type * as counters from "../counters.js";
import type * as deviceEvents from "../deviceEvents.js";
import type * as devices from "../devices.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as notifications from "../notifications.js";
import type * as queues from "../queues.js";
import type * as services from "../services.js";
import type * as userLocations from "../userLocations.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appointmentSlots: typeof appointmentSlots;
  appointments: typeof appointments;
  auth: typeof auth;
  businessClosures: typeof businessClosures;
  businessHours: typeof businessHours;
  businessSettings: typeof businessSettings;
  businesses: typeof businesses;
  counterOperations: typeof counterOperations;
  counters: typeof counters;
  deviceEvents: typeof deviceEvents;
  devices: typeof devices;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/authorization": typeof lib_authorization;
  notifications: typeof notifications;
  queues: typeof queues;
  services: typeof services;
  userLocations: typeof userLocations;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
