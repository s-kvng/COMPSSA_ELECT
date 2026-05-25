import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) return args.existingUserId;

      // Only allow pre-approved emails (bulk-imported by EC)
      // Cast needed: createOrUpdateUser ctx is typed against auth-internal tables only
      const preCreated = await (ctx.db as any)
        .query("users")
        .withIndex("by_email", (q: any) => q.eq("email", args.profile.email ?? ""))
        .unique();

      if (!preCreated) throw new ConvexError("Not registered. Contact your EC.");
      return preCreated._id;
    },
  },
});
