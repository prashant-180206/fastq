import type { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthenticated");
  }

  const email = identity.email?.trim().toLowerCase();

  // if (!email) {
  //   throw new Error("Authenticated identity has no email");
  // }

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();

  if (!user) {
    throw new Error(`User account not found for email: ${email}`);
  }

  if (!user.isActive) {
    throw new Error("User account is inactive");
  }

  return user;
}
