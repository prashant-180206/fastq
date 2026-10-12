
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

import { requireUser } from "./auth";

type AuthCtx = QueryCtx | MutationCtx;

/**
 * Ensures the authenticated user owns the specified business.
 * Returns both the user and business for subsequent operations.
 */
export async function requireBusinessOwner(
  ctx: AuthCtx,
  businessId: Id<"businesses">
) {
  const user = await requireUser(ctx);

  const business = await ctx.db.get(businessId);

  if (!business) {
    throw new Error("Business not found.");
  }

  if (business.ownerId !== user._id) {
    throw new Error("Forbidden: business owner access required.");
  }

  return { user, business };
}

/**
 * Ensures the authenticated user owns a business identified by its ID,
 * then returns the business record.
 */
export async function requireOwnedBusiness(
  ctx: AuthCtx,
  businessId: Id<"businesses">
) {
  const { business } = await requireBusinessOwner(ctx, businessId);
  return business;
}

/**
 * Ensures the authenticated user owns the business before allowing
 * access to owner-only operations.
 */
export async function requireBusinessOwnerId(
  ctx: AuthCtx,
  businessId: Id<"businesses">
): Promise<Id<"users">> {
  const { user } = await requireBusinessOwner(ctx, businessId);
  return user._id;
}
