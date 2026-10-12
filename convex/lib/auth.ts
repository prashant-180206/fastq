
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export async function requireUser(
  ctx: QueryCtx | MutationCtx
) {
  const userId = await getAuthUserId(ctx);

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const user = await ctx.db.get(userId);

  if (!user) {
    throw new Error(
      "User account not found. Complete account provisioning first."
    );
  }

  if (user.isActive === false) {
    throw new Error("Your account is inactive.");
  }

  return user;
}
