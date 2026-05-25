import { cronJobs } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

export const advanceStates = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();

    // ready → active: elections whose startTime has passed
    const readyElections = await ctx.db
      .query("elections")
      .withIndex("by_status", (q) => q.eq("status", "ready"))
      .take(10);

    for (const election of readyElections) {
      if (election.startTime <= now) {
        await ctx.runMutation(internal.elections.activateElection, {
          electionId: election._id,
        });
      }
    }

    // active → closed: elections whose endTime has passed
    const activeElections = await ctx.db
      .query("elections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(10);

    for (const election of activeElections) {
      if (election.endTime <= now) {
        await ctx.runMutation(internal.elections.closeElection, {
          electionId: election._id,
        });
      }
    }

    return null;
  },
});

const crons = cronJobs();
crons.interval("advance election states", { seconds: 60 }, internal.crons.advanceStates, {});
export default crons;
