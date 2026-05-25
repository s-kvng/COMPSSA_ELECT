/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'Student' | 'Candidate' | 'EC' | 'HOD';

export type ElectionStatus = 'Draft' | 'Ready' | 'Active' | 'Closed' | 'Published';

export interface User {
  id: string; // matches studentId
  studentId: string;
  name: string;
  email: string;
  role: Role;
  firstLoginPending: boolean;
  avatarUrl?: string;
  candidateCategory?: string; // If candidate, which category are they contesting
}

export interface Candidate {
  id: string; // studentId of the candidate
  name: string;
  bio: string;
  votes: number; // mock current vote count
}

export interface Category {
  id: string;
  name: string;
  description: string;
  candidates: Candidate[];
}

export interface Election {
  id: string;
  title: string;
  description: string;
  status: ElectionStatus;
  startDate: string;
  endDate: string;
  categories: Category[];
  publishedAt?: string;
}

export interface ActionLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
}

export interface VoteRecord {
  voterId: string; // studentId
  categoryId: string;
  candidateId: string; // studentId
  timestamp: string;
}
