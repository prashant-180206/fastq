import { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) =>
      q.eq("email", identity.email ?? ""),
    )
    .unique();

  if (!user) {
    throw new Error("User account not found");
  }

  if (!user.isActive) {
    throw new Error("User account is inactive");
  }

  return user;
}