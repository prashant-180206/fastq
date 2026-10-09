import { ConvexError } from "convex/values";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { z } from "zod";
import type { DataModel } from "./_generated/dataModel";

const EmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

const CustomPassword = Password<DataModel>({
  profile(params) {
    const result = EmailSchema.safeParse(params);

    if (!result.success) {
      throw new ConvexError(result.error.flatten());
    }

    return {
      email: result.data.email,
      createdAt: Date.now(),
      isActive: true,
    };
  },

  validatePasswordRequirements(password: string) {
    if (password.length < 8) {
      throw new ConvexError("Password must be at least 8 characters long.");
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [CustomPassword],
});
