/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { TrendingUpDownIcon, CheckmarkSquare01Icon, Shield01Icon } from '@hugeicons/core-free-icons';

export default function CandidateTallyPage() {
  const { currentUser, elections } = useAuthContext();
  const { navigateTo } = useNavigation();

  if (!currentUser) return null;

  // Active election lookup
  const activeElection = elections.find(e => e.status === 'Active') || elections[0];

  const matchedCategory = activeElection?.categories.find(c =>
    c.candidates.some(cand => cand.id === currentUser.id)
  );

  const meAsCandidate = matchedCategory?.candidates.find(cand => cand.id === currentUser.id);

  if (currentUser.role !== 'Candidate' || !meAsCandidate) {
    return (
      <div id="candidate-error-screen" className="py-12 text-center max-w-sm mx-auto space-y-4">
        <p className="text-xs text-slate-500">You are not registered as an active candidate running in any active positions.</p>
        <button onClick={() => navigateTo('/vote')} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold">
          Enter Voters Corridor
        </button>
      </div>
    );
  }

  const liveVotesCount = meAsCandidate.votes;
  const isElectionActive = activeElection?.status === 'Active';

  return (
    <div id="candidate-tally-viewport" className="space-y-6 font-sans py-4 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full animate-fade-in">
      {/* Visual Board */}
      <div className="bg-linear-to-b from-blue-900 to-slate-950 text-white rounded-2xl p-8 border border-slate-800 text-center relative overflow-hidden shadow-md select-none">
        {/* Abstract background graphics */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-blue-600/10 rounded-full blur-2xl"></div>

        <div className="relative space-y-5">
          <div className="inline-flex bg-blue-500/25 p-3 rounded-full border border-blue-400/20 text-blue-400">
            <HugeiconsIcon icon={TrendingUpDownIcon} className="h-6 w-6" strokeWidth={1.5} />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 bg-blue-950/50 px-2.5 py-0.5 rounded border border-blue-900/40">
              Live Candidate Tracker
            </span>
            <h2 className="font-display font-bold text-base text-slate-100 mt-2">
              Position: {matchedCategory?.name}
            </h2>
            <p className="text-xs text-slate-400">
              Assigned Candidate ID: <span className="font-mono text-slate-300">{currentUser.studentId}</span>
            </p>
          </div>

          {/* MASSIVE COUNT DISPLAY */}
          <div className="py-2">
            <span className="block text-7xl font-mono font-extrabold tracking-tight text-white select-all">
              {liveVotesCount}
            </span>
            <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase mt-2 block">
              Official Sealed Ballots
            </span>
          </div>

          <p className="text-[11px] text-slate-450 max-w-sm mx-auto leading-relaxed">
            Your live vote counts update automatically in real time as voters submit cards inside the COMPSSA system database.
          </p>

          <div className="border-t border-slate-800 pt-4 flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
            <HugeiconsIcon icon={Shield01Icon} className="h-3.5 w-3.5 text-blue-500" />
            <span>Encrypted Privacy Partition Active • Tally audit confirmed</span>
          </div>
        </div>
      </div>

      {/* Conditional Voter link */}
      {isElectionActive && (
        <div className="border border-slate-200/60 p-5 rounded-xl bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shadow-3xs">
          <div className="space-y-0.5 text-center sm:text-left">
            <h4 className="font-display font-semibold text-xs text-slate-900 flex items-center gap-2 justify-center sm:justify-start">
              <HugeiconsIcon icon={CheckmarkSquare01Icon} className="h-4.5 w-4.5 text-blue-600" />
              <span>Have you cast your own ballot?</span>
            </h4>
            <p className="text-xs text-slate-500">You are eligible to vote for other positions in COMPSSACategories.</p>
          </div>
          <button
            onClick={() => navigateTo('/vote')}
            className="whitespace-nowrap bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all"
          >
            Enter Voters Corridor
          </button>
        </div>
      )}
    </div>
  );
}

