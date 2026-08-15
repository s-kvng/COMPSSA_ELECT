// Shared password generator used by both the seeding flow (convex/seed.ts)
// and the reset flows (convex/users.ts) so the alphabet/length stay in sync
// in exactly one place.
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PASSWORD_LENGTH = 8;

export function generatePassword(): string {
  const bytes = new Uint8Array(PASSWORD_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join("");
}
