import { action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const probe = action({
  args: {},
  returns: v.object({ userId: v.union(v.string(), v.null()) }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return { userId };
  },
});
