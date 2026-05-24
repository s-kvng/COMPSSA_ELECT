/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role, Election, Category, Candidate, VoteRecord, ActionLogEntry } from '@/lib/types';

interface AuthContextType {
  currentUser: User | null;
  currentRole: Role | null;
  users: User[];
  elections: Election[];
  voteRecords: VoteRecord[];
  actionLog: ActionLogEntry[];
  isLoading: boolean;
  login: (email: string) => Promise<User>;
  logout: () => void;
  setMockRole: (role: Role) => void;
  resetDatabase: () => void;
  completeFirstLogin: (newPassword?: string) => void;
  importStudents: (newStudents: Partial<User>[]) => { successCount: number; errors: string[]; credentialsCsv: string };
  registerVote: (categoryId: string, candidateId: string) => void;
  createElection: (title: string, description: string, startDate: string, endDate: string) => void;
  updateElectionStatus: (electionId: string, status: Election['status']) => void;
  addCategoryToElection: (electionId: string, name: string, description: string) => void;
  addCandidateToCategory: (electionId: string, categoryId: string, studentId: string, bio: string) => void;
  removeCategoryFromElection: (electionId: string, categoryId: string) => void;
  removeCandidateFromCategory: (electionId: string, categoryId: string, candidateId: string) => void;
  addActionLog: (action: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SEED_USERS: User[] = [
  { id: 'EC-001', studentId: 'EC-001', name: 'Electoral Commissioner', email: 'ec@compssa.org', role: 'EC', firstLoginPending: false },
  { id: 'HOD-001', studentId: 'HOD-001', name: 'Dr. Beatrice Mensah', email: 'hod@compssa.org', role: 'HOD', firstLoginPending: false },
  { id: 'COMP-101', studentId: 'COMP-101', name: 'Kwame Mensah', email: 'kwame@compssa.org', role: 'Candidate', firstLoginPending: false, candidateCategory: 'cat-1' },
  { id: 'COMP-102', studentId: 'COMP-102', name: 'Ama Sey', email: 'ama@compssa.org', role: 'Candidate', firstLoginPending: false, candidateCategory: 'cat-1' },
  { id: 'COMP-103', studentId: 'COMP-103', name: 'Abena Boateng', email: 'abena@compssa.org', role: 'Candidate', firstLoginPending: false, candidateCategory: 'cat-2' },
  { id: 'COMP-104', studentId: 'COMP-104', name: 'Kofi Asante', email: 'kofi@compssa.org', role: 'Candidate', firstLoginPending: false, candidateCategory: 'cat-2' },
  { id: 'COMP-201', studentId: 'COMP-201', name: 'Samuel Yaw', email: 'voter@compssa.org', role: 'Student', firstLoginPending: true },
  { id: 'COMP-202', studentId: 'COMP-202', name: 'Jessica Arthur', email: 'jessica@compssa.org', role: 'Student', firstLoginPending: true },
];

const SEED_ELECTION: Election = {
  id: 'elect-2026',
  title: 'COMPSSA General Executive Officers Election 2026',
  description: 'Annual general election for the Computer Science Student Association (COMPSSA) executives. All students are eligible to vote in all departments.',
  status: 'Active',
  startDate: '2026-05-23T08:00:00Z',
  endDate: '2026-05-25T18:00:00Z',
  categories: [
    {
      id: 'cat-1',
      name: 'SRC President',
      description: 'The executive leader and representative of the student body at the university senate.',
      candidates: [
        { id: 'COMP-101', name: 'Kwame Mensah', bio: 'Leadership with Integrity: Expanding laboratory equipment access and organizing national hackathons.', votes: 47 },
        { id: 'COMP-102', name: 'Ama Sey', bio: 'Tech for Unity: Introducing robust online tutorials, health mental-support portals, and networking dinners.', votes: 53 }
      ]
    },
    {
      id: 'cat-2',
      name: 'General Secretary',
      description: 'In charge of administrative tracking, correspondence, and meeting minutes.',
      candidates: [
        { id: 'COMP-103', name: 'Abena Boateng', bio: 'Flawless Records: Introducing centralized meeting notes hubs and open office hours.', votes: 31 },
        { id: 'COMP-104', name: 'Kofi Asante', bio: 'Transparent Operations: Weekly email bulletins and standard documentation packages.', votes: 29 }
      ]
    },
    {
      id: 'cat-3',
      name: 'Financial Secretary',
      description: 'Handles the treasury, sponsorships, and budgeting for annual project weeks.',
      candidates: [
        { id: 'COMP-105', name: 'Yaw Owusu', bio: 'Strategic Budgets and Sponsoring: Securing corporate grants and supporting project circles.', votes: 12 }
      ]
    }
  ]
};

const SEED_ACTION_LOG: ActionLogEntry[] = [
  { id: 'log-1', timestamp: '2026-05-23T08:00:00Z', action: 'COMPSSA General Executive Officers Election 2026 opened successfully.', user: 'EC-001 (Electoral Commissioner)' },
  { id: 'log-2', timestamp: '2026-05-23T09:12:00Z', action: 'Imported 12 students from administrative database.', user: 'EC-001 (Electoral Commissioner)' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [voteRecords, setVoteRecords] = useState<VoteRecord[]>([]);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from LocalStorage or Seeds
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('compssa_users');
      const storedElections = localStorage.getItem('compssa_elections');
      const storedVotes = localStorage.getItem('compssa_votes');
      const storedLogs = localStorage.getItem('compssa_logs');
      const storedCurrentUser = localStorage.getItem('compssa_current_user');

      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        setUsers(SEED_USERS);
        localStorage.setItem('compssa_users', JSON.stringify(SEED_USERS));
      }

      if (storedElections) {
        setElections(JSON.parse(storedElections));
      } else {
        setElections([SEED_ELECTION]);
        localStorage.setItem('compssa_elections', JSON.stringify([SEED_ELECTION]));
      }

      if (storedVotes) {
        setVoteRecords(JSON.parse(storedVotes));
      } else {
        // Pre-cast some mock votes corresponding to seed tallies
        const mockVotes: VoteRecord[] = [
          // COMP-202 has already voted in cat-3 to show progress
          { voterId: 'COMP-202', categoryId: 'cat-3', candidateId: 'COMP-105', timestamp: '2026-05-23T08:15:00Z' }
        ];
        setVoteRecords(mockVotes);
        localStorage.setItem('compssa_votes', JSON.stringify(mockVotes));
      }

      if (storedLogs) {
        setActionLog(JSON.parse(storedLogs));
      } else {
        setActionLog(SEED_ACTION_LOG);
        localStorage.setItem('compssa_logs', JSON.stringify(SEED_ACTION_LOG));
      }

      if (storedCurrentUser) {
        const parsedUser = JSON.parse(storedCurrentUser) as User;
        setCurrentUser(parsedUser);
        setCurrentRole(parsedUser.role);
      }
    } catch (e) {
      console.error('Error parsing localStorage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save changes to LocalStorage helper
  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('compssa_users', JSON.stringify(newUsers));
  };

  const saveElections = (newElections: Election[]) => {
    setElections(newElections);
    localStorage.setItem('compssa_elections', JSON.stringify(newElections));
  };

  const saveVotes = (newVotes: VoteRecord[]) => {
    setVoteRecords(newVotes);
    localStorage.setItem('compssa_votes', JSON.stringify(newVotes));
  };

  const saveLogs = (newLogs: ActionLogEntry[]) => {
    setActionLog(newLogs);
    localStorage.setItem('compssa_logs', JSON.stringify(newLogs));
  };

  const saveCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      setCurrentRole(user.role);
      localStorage.setItem('compssa_current_user', JSON.stringify(user));
    } else {
      setCurrentRole(null);
      localStorage.removeItem('compssa_current_user');
    }
  };

  // Helper to add log entries
  const addActionLog = (action: string) => {
    const newEntry: ActionLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      user: currentUser ? `${currentUser.id} (${currentUser.name})` : 'System'
    };
    saveLogs([newEntry, ...actionLog]);
  };

  // Login handler
  const login = async (email: string): Promise<User> => {
    // Find user by email (case insensitive)
    const normalizedEmail = email.trim().toLowerCase();
    const foundUser = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!foundUser) {
      // Create user on-the-fly for quick demo convenience if it is a general domain,
      // but let's encourage using the seeded credentials first or throw if unrecognizable.
      throw new Error('Please enter a seeded email (e.g. ec@compssa.org, voter@compssa.org, kwame@compssa.org, or any imported student email).');
    }

    saveCurrentUser(foundUser);
    return foundUser;
  };

  // Logout handler
  const logout = () => {
    saveCurrentUser(null);
  };

  // Fast demo role switching tool helper
  const setMockRole = (role: Role) => {
    // Save previous state index
    // Switch to first user in database matching role, or create one
    let targetUser = users.find(u => u.role === role);
    if (!targetUser) {
      // instantiate quick proxy
      const newProxy: User = {
        id: `MOCK-${role.toUpperCase()}-${Date.now().toString().slice(-4)}`,
        studentId: `MOCK-${role.toUpperCase()}-${Date.now().toString().slice(-4)}`,
        name: `Demo User (${role})`,
        email: `${role.toLowerCase()}@compssa.org`,
        role: role,
        firstLoginPending: false
      };
      const updatedList = [...users, newProxy];
      saveUsers(updatedList);
      targetUser = newProxy;
    }
    saveCurrentUser(targetUser);
    addActionLog(`Manually switched active demo session to role: ${role}`);
  };

  // Reset database back to default state
  const resetDatabase = () => {
    localStorage.removeItem('compssa_users');
    localStorage.removeItem('compssa_elections');
    localStorage.removeItem('compssa_votes');
    localStorage.removeItem('compssa_logs');
    localStorage.removeItem('compssa_current_user');

    setUsers(SEED_USERS);
    setElections([SEED_ELECTION]);
    setVoteRecords([
      { voterId: 'COMP-202', categoryId: 'cat-3', candidateId: 'COMP-105', timestamp: '2026-05-23T08:15:00Z' }
    ]);
    setActionLog(SEED_ACTION_LOG);
    setCurrentUser(null);
    setCurrentRole(null);

    // Reload browser to get fresh clean state
    window.location.reload();
  };

  // Complete first login password change
  const completeFirstLogin = (newPassword?: string) => {
    if (!currentUser) return;
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, firstLoginPending: false };
      }
      return u;
    });
    saveUsers(updatedUsers);

    const updatedCurrentUser = { ...currentUser, firstLoginPending: false };
    saveCurrentUser(updatedCurrentUser);
    addActionLog('Completed mandatory first password modification successfully.');
  };

  // Bulk import student utility
  const importStudents = (newStudents: Partial<User>[]) => {
    const errors: string[] = [];
    let successCount = 0;
    const addedList: User[] = [];

    // Header validation happens inside component, here we insert
    const tempUsers = [...users];

    newStudents.forEach((student, index) => {
      const idx = index + 1;
      if (!student.name) {
        errors.push(`Row ${idx}: Student Name is missing`);
        return;
      }
      if (!student.studentId) {
        errors.push(`Row ${idx}: Student ID is missing`);
        return;
      }
      if (!student.email) {
        errors.push(`Row ${idx}: Student email is missing`);
        return;
      }

      // Check for duplicate ID/Email
      const idExists = tempUsers.some(u => u.studentId.toUpperCase() === student.studentId?.toUpperCase());
      const emailExists = tempUsers.some(u => u.email.toLowerCase() === student.email?.toLowerCase());

      if (idExists) {
        errors.push(`Row ${idx}: Student ID ${student.studentId} is already registered`);
        return;
      }
      if (emailExists) {
        errors.push(`Row ${idx}: Email ${student.email} is already taken`);
        return;
      }

      const generatedUser: User = {
        id: student.studentId,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        role: student.role as Role || 'Student',
        firstLoginPending: true,
      };

      tempUsers.push(generatedUser);
      addedList.push(generatedUser);
      successCount++;
    });

    if (errors.length === 0 && successCount > 0) {
      saveUsers(tempUsers);
      addActionLog(`Bulk imported ${successCount} new student records from Excel/CSV file.`);
    }

    // Generate simulated credential list CSV text
    let credentialsCsv = 'Name,StudentID,Email,TempPassword\n';
    addedList.forEach(u => {
      credentialsCsv += `"${u.name}","${u.studentId}","${u.email}","COMPSSA_${u.studentId.replace(/[^a-zA-Z0-9]/g, '')}"\n`;
    });

    return { successCount, errors, credentialsCsv };
  };

  // Register physical vote inside categories
  const registerVote = (categoryId: string, candidateId: string) => {
    if (!currentUser) return;

    // Guard double voting
    const alreadyVoted = voteRecords.some(r => r.voterId === currentUser.id && r.categoryId === categoryId);
    if (alreadyVoted) return;

    const newRecord: VoteRecord = {
      voterId: currentUser.id,
      categoryId,
      candidateId,
      timestamp: new Date().toISOString()
    };

    const newVoteRecords = [...voteRecords, newRecord];
    saveVotes(newVoteRecords);

    // Update election tally arrays as well representationally
    const newElections = elections.map(elect => {
      return {
        ...elect,
        categories: elect.categories.map(cat => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              candidates: cat.candidates.map(cand => {
                if (cand.id === candidateId) {
                  return { ...cand, votes: cand.votes + 1 };
                }
                return cand;
              })
            };
          }
          return cat;
        })
      };
    });

    saveElections(newElections);
    addActionLog(`Cast vote in category sequence: ${categoryId}`);
  };

  // Create an election from scratch (Draft state)
  const createElection = (title: string, description: string, startDate: string, endDate: string) => {
    const newElection: Election = {
      id: `elect-${Date.now()}`,
      title,
      description,
      status: 'Draft',
      startDate,
      endDate,
      categories: []
    };
    saveElections([newElection, ...elections]);
    addActionLog(`Created new draft election: "${title}"`);
  };

  // Fast forward election status states
  const updateElectionStatus = (electionId: string, status: Election['status']) => {
    const updated = elections.map(elect => {
      if (elect.id === electionId) {
        const pubTime = status === 'Published' ? new Date().toISOString() : elect.publishedAt;
        return { ...elect, status, publishedAt: pubTime };
      }
      return elect;
    });
    saveElections(updated);
    addActionLog(`Transitioned election ID ${electionId} status to state: "${status}"`);
  };

  const addCategoryToElection = (electionId: string, name: string, description: string) => {
    const newCatId = `cat-${Date.now()}`;
    const updated = elections.map(elect => {
      if (elect.id === electionId) {
        return {
          ...elect,
          categories: [
            ...elect.categories,
            { id: newCatId, name, description, candidates: [] }
          ]
        };
      }
      return elect;
    });
    saveElections(updated);
    addActionLog(`Added category "${name}" to election.`);
  };

  const addCandidateToCategory = (electionId: string, categoryId: string, studentId: string, bio: string) => {
    const student = users.find(u => u.studentId === studentId);
    if (!student) return;

    const updated = elections.map(elect => {
      if (elect.id === electionId) {
        return {
          ...elect,
          categories: elect.categories.map(cat => {
            if (cat.id === categoryId) {
              // Ensure student isn't duplicate in category
              if (cat.candidates.some(c => c.id === studentId)) return cat;
              return {
                ...cat,
                candidates: [
                  ...cat.candidates,
                  { id: studentId, name: student.name, bio, votes: 0 }
                ]
              };
            }
            return cat;
          })
        };
      }
      return elect;
    });

    // We also tag this user as being a candidate inside general users state
    const adjustedUsers = users.map(u => {
      if (u.studentId === studentId) {
        return { ...u, role: 'Candidate' as Role, candidateCategory: categoryId };
      }
      return u;
    });

    saveUsers(adjustedUsers);
    saveElections(updated);
    addActionLog(`Assigned candidate "${student.name}" to category ID ${categoryId}.`);
  };

  const removeCategoryFromElection = (electionId: string, categoryId: string) => {
    const updated = elections.map(elect => {
      if (elect.id === electionId) {
        return {
          ...elect,
          categories: elect.categories.filter(c => c.id !== categoryId)
        };
      }
      return elect;
    });
    saveElections(updated);
    addActionLog(`Removed category ID ${categoryId} from election.`);
  };

  const removeCandidateFromCategory = (electionId: string, categoryId: string, candidateId: string) => {
    const updated = elections.map(elect => {
      if (elect.id === electionId) {
        return {
          ...elect,
          categories: elect.categories.map(cat => {
            if (cat.id === categoryId) {
              return {
                ...cat,
                candidates: cat.candidates.filter(cand => cand.id !== candidateId)
              };
            }
            return cat;
          })
        };
      }
      return elect;
    });

    // Reset this user to standard Student if they are no longer running anywhere
    const candidateMatches = updated.flatMap(e => e.categories.flatMap(c => c.candidates)).some(cand => cand.id === candidateId);
    if (!candidateMatches) {
      const adjustedUsers = users.map(u => {
        if (u.studentId === candidateId) {
          return { ...u, role: 'Student' as Role, candidateCategory: undefined };
        }
        return u;
      });
      saveUsers(adjustedUsers);
    }

    saveElections(updated);
    addActionLog(`Removed candidate ID ${candidateId} from category.`);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        users,
        elections,
        voteRecords,
        actionLog,
        isLoading,
        login,
        logout,
        setMockRole,
        resetDatabase,
        completeFirstLogin,
        importStudents,
        registerVote,
        createElection,
        updateElectionStatus,
        addCategoryToElection,
        addCandidateToCategory,
        removeCategoryFromElection,
        removeCandidateFromCategory,
        addActionLog,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Ensure the export matches our usage correctly:
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
