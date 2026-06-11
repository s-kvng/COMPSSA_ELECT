// Central student data type and aggregator.
// Real student data lives in the per-level files (gitignored — never commit PII).
// To seed: add data to level100.ts … level400.ts, then run:
//   bunx convex run seed:seedStudents

export type StudentData = {
  name: string;
  email: string;
  studentId: string;
  phone: string;       // e.g. "+233201234567"
  level: 100 | 200 | 300 | 400;
  sex: "M" | "F";
  regular: "regular" | "weekend";
  programme: string;   // e.g. "BSc Computer Science"
};

// Populated locally by importing level files. Empty in CI/production builds.
let _allStudents: StudentData[] = [];

try {
  // These imports only exist locally (gitignored). Dynamic require keeps the
  // build from crashing when the files are absent.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { level100Students } = require("./level100");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { level200Students } = require("./level200");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { level300Students } = require("./level300");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { level400Students } = require("./level400");
  _allStudents = [
    ...(level100Students ?? []),
    ...(level200Students ?? []),
    ...(level300Students ?? []),
    ...(level400Students ?? []),
  ];
} catch {
  // Level files not present (CI / production) — seed will be a no-op.
}

export const allStudents: StudentData[] = _allStudents;
