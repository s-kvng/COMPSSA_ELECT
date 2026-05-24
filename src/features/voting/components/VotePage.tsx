/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import { CheckCircle2, ChevronRight, Lock, HelpCircle } from 'lucide-react';

export default function VotePage() {
  const { currentUser, elections, voteRecords } = useAuthContext();
  const { navigateTo } = useNavigation();

  if (!currentUser) return null;

  // Active or draft elections list
  const activeElection = elections.find(e => e.status === 'Active');

  if (!activeElection) {
    return (
      <div id="vote-no-active-state" className="space-y-6 font-sans">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-xl">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm">Ballot Booth Closed</h3>
            <p className="text-xs text-amber-600 mt-1">There are no currently active elections for which voting is open. Please consult the Electoral Commission.</p>
          </div>
        </div>
      </div>
    );
  }

  const categories = activeElection.categories;
  const totalCategoriesCount = categories.length;

  // Calculate user votes
  const userCastVotes = voteRecords.filter(r => r.voterId === currentUser.id);
  const userVotedCount = categories.filter(cat => 
    userCastVotes.some(rec => rec.categoryId === cat.id)
  ).length;

  const isCompleted = totalCategoriesCount > 0 && userVotedCount === totalCategoriesCount;

  return (
    <div id="vote-page" className="space-y-6 font-sans animate-fade-in py-4">
      {/* Page header */}
      <div>
        <h2 className="font-display font-extrabold text-2xl text-slate-900">{activeElection.title}</h2>
        <p className="text-xs text-slate-500 mt-1">
          Each student is registered to vote exactly once per category. Votes are cryptographically sealed upon submission and are irrevocable.
        </p>
      </div>

      {/* Progress banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1 w-full max-w-sm">
            <span className="text-[10px] font-mono text-blue-600 uppercase tracking-wider font-bold">Voter Ballot Card</span>
            <h3 className="font-display font-bold text-base text-slate-855">Your Progress</h3>
            <p className="text-xs text-slate-500">
              {isCompleted ? 'All ballots cast. Thank you for voting.' : `You have cast ${userVotedCount} of ${totalCategoriesCount} position ballots.`}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="font-mono text-lg font-extrabold text-slate-900 bg-slate-50 border px-3 py-1 rounded-lg">
              {userVotedCount} / {totalCategoriesCount}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${(userVotedCount / (totalCategoriesCount || 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Success Completion box */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 shadow-3xs">
          <CheckCircle2 className="h-10 w-10 text-green-600 shrink-0" />
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-display font-bold text-sm text-green-900">Your Voting Process is Complete</h4>
            <p className="text-xs text-green-700 font-medium">
              Thank you for participating! Your ballot results have been compiled in the local audit logs. When the EC closes and publishes the results, this workspace will update.
            </p>
          </div>
        </div>
      )}

      {/* Categories stack list */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm text-slate-800">Available Ballot Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const userVote = userCastVotes.find(r => r.categoryId === cat.id);
            const hasVoted = !!userVote;

            // Find name of candidate voted for if v1
            const candidateVotedFor = hasVoted ? cat.candidates.find(cand => cand.id === userVote.candidateId)?.name : null;

            return (
              <div
                key={cat.id}
                onClick={() => navigateTo(`/vote/${cat.id}`)}
                className={`border rounded-xl p-5 flex flex-col justify-between h-44 shadow-3xs transition-all duration-150 relative overflow-hidden group select-none cursor-pointer ${
                  hasVoted
                    ? 'border-emerald-200 bg-emerald-50/10 hover:bg-emerald-50/20'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs hover:bg-slate-50/20'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-slate-400">Position Category</span>
                    {hasVoted ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full font-mono">
                        ✓ Cast Ballot
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-150 border border-slate-200 rounded-full font-mono">
                        Not cast
                      </span>
                    )}
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-900 mt-1.5 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-xs text-slate-500 leading-normal line-clamp-2 mt-1">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100/50 flex items-center justify-between">
                  {hasVoted ? (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Selected Candidate: <span className="font-bold text-emerald-700">{candidateVotedFor || 'Sealed Voter Choice'}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 group-hover:text-blue-600 font-semibold transition-colors">
                      Enter Voting Booth
                    </p>
                  )}
                  <ChevronRight className="h-4.5 w-4.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

