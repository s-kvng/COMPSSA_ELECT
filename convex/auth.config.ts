import { convexAuth } from "@convex-dev/auth/server";
// @ts-ignore: module has no types
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
});