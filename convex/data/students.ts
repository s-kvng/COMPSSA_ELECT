// Central student data type and aggregator.
// Real student data lives in the per-level files (gitignored — never commit PII).
// To seed locally: import and spread the level arrays into allStudents below,
// then run: bunx convex run seed:seedStudents

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

// Empty in CI/production. Populate locally when seeding.
export const allStudents: StudentData[] = [];
