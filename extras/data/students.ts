// Central student data type and aggregator.
// Fill in the per-level files: level100.ts, level200.ts, level300.ts, level400.ts.
// Run the seed: bunx convex run seed:seedStudents

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

export { level100Students } from "./level100";
export { level200Students } from "./level200";
export { level300Students } from "./level300";
export { level400Students } from "./level400";

import { level100Students } from "./level100";
import { level200Students } from "./level200";
import { level300Students } from "./level300";
import { level400Students } from "./level400";

export const allStudents: StudentData[] = [
  ...level100Students,
  ...level200Students,
  ...level300Students,
  ...level400Students,
];
