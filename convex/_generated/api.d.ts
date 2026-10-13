/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as business_appointments from "../business/appointments.js";
import type * as business_data from "../business/data.js";
import type * as business_queue from "../business/queue.js";
import type * as business_queueCapacity from "../business/queueCapacity.js";
import type * as business_services from "../business/services.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_authorization from "../lib/authorization.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "business/appointments": typeof business_appointments;
  "business/data": typeof business_data;
  "business/queue": typeof business_queue;
  "business/queueCapacity": typeof business_queueCapacity;
  "business/services": typeof business_services;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/authorization": typeof lib_authorization;
  users: typeof users;
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
