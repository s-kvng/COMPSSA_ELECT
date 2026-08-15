import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { getUser } from "./lib/auth";

export const presence = new Presence(components.presence);

/** Single shared room used for the app-wide "online now" counter. */
export const GLOBAL_ROOM = "compssa-elect-global";

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  returns: v.object({ roomToken: v.string(), sessionToken: v.string() }),
  handler: async (ctx, { sessionId, interval }) => {
    const user = await getUser(ctx);
    return await presence.heartbeat(ctx, GLOBAL_ROOM, user._id, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  returns: v.array(
    v.object({
      userId: v.string(),
      online: v.boolean(),
      lastDisconnected: v.number(),
      data: v.optional(v.any()),
    }),
  ),
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken);
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  returns: v.null(),
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});
