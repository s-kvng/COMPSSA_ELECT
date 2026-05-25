import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUser } from "./lib/auth";

export const addCategory = mutation({
  args: {
    electionId: v.id("elections"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");

    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "draft") throw new ConvexError("Can only modify elections in draft status");

    return await ctx.db.insert("categories", {
      electionId: args.electionId,
      name: args.name,
      description: args.description,
    });
  },
});

export const removeCategory = mutation({
  args: {
    electionId: v.id("elections"),
    categoryId: v.id("categories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");

    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "draft") throw new ConvexError("Can only modify elections in draft status");

    await ctx.db.delete(args.categoryId);
    return null;
  },
});
