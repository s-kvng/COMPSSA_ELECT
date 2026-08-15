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
import type * as candidates from "../candidates.js";
import type * as categories from "../categories.js";
import type * as crons from "../crons.js";
import type * as data_level100 from "../data/level100.js";
import type * as data_level200 from "../data/level200.js";
import type * as data_level300 from "../data/level300.js";
import type * as data_level400 from "../data/level400.js";
import type * as data_students from "../data/students.js";
import type * as ec_actions from "../ec_actions.js";
import type * as elections from "../elections.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_password from "../lib/password.js";
import type * as lib_sms from "../lib/sms.js";
import type * as presence from "../presence.js";
import type * as results from "../results.js";
import type * as seed from "../seed.js";
import type * as smsDiag from "../smsDiag.js";
import type * as testSms from "../testSms.js";
import type * as users from "../users.js";
import type * as votes from "../votes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  candidates: typeof candidates;
  categories: typeof categories;
  crons: typeof crons;
  "data/level100": typeof data_level100;
  "data/level200": typeof data_level200;
  "data/level300": typeof data_level300;
  "data/level400": typeof data_level400;
  "data/students": typeof data_students;
  ec_actions: typeof ec_actions;
  elections: typeof elections;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/password": typeof lib_password;
  "lib/sms": typeof lib_sms;
  presence: typeof presence;
  results: typeof results;
  seed: typeof seed;
  smsDiag: typeof smsDiag;
  testSms: typeof testSms;
  users: typeof users;
  votes: typeof votes;
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

export declare const components: {
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
};
