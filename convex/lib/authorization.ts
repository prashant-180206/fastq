import { QueryCtx, MutationCtx } from "../_generated/server";

import { Id } from "../_generated/dataModel";

import { requireUser } from "./auth";

type AuthenticatedCtx = QueryCtx | MutationCtx;

export async function requireBusinessMember(
  ctx: AuthenticatedCtx,
  businessId: Id<"businesses">,
) {
  const user = await requireUser(ctx);

  const business = await ctx.db.get(businessId);

  if (!business) {
    throw new Error("Business not found");
  }

  if (!business.isActive) {
    throw new Error("This business is inactive");
  }

  const membership = await ctx.db
    .query("businessMembers")
    .withIndex("by_userId_businessId", (q) =>
      q.eq("userId", user._id).eq("businessId", businessId),
    )
    .unique();

  if (!membership || !membership.isActive) {
    throw new Error("You are not a member of this business");
  }

  return {
    user,
    business,
    membership,
  };
}

export async function requireBusinessRole(
  ctx: AuthenticatedCtx,
  businessId: Id<"businesses">,
  allowedRoles: string[],
) {
  const { user, business, membership } = await requireBusinessMember(
    ctx,
    businessId,
  );

  if (!allowedRoles.includes(membership.role)) {
    throw new Error("Insufficient business permissions");
  }

  return {
    user,
    business,
    membership,
  };
}
