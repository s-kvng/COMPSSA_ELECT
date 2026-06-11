'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/shared/auth';
import { api } from '../../../../convex/_generated/api';
import { HugeiconsIcon } from '@hugeicons/react';
import { TrendingUpDownIcon, CheckmarkSquare01Icon, Shield01Icon } from '@hugeicons/core-free-icons';

export default function CandidateTallyPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();

  const voteCount = useQuery(api.results.myVoteCount);
  const currentElection = useQuery(api.elections.getCurrentElection);

  if (!currentUser) return null;

  if (currentUser.role !== 'candidate') {
    return (
      <div className="py-12 text-center max-w-sm mx-auto space-y-4">
        <p className="text-xs text-muted-foreground">You are not registered as a candidate.</p>
        <button
          onClick={() => router.push('/vote')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold"
        >
          Enter Voters Corridor
        </button>
      </div>
    );
  }

  const matchedCategory = currentElection?.categories.find((c) =>
    c.candidates.some((cand) => cand.userId === currentUser._id),
  );

  if (voteCount === null && currentElection !== undefined && currentElection !== null) {
    return (
      <div className="py-12 text-center max-w-sm mx-auto space-y-4">
        <p className="text-xs text-muted-foreground">You are not registered as a candidate in any active election.</p>
        <button
          onClick={() => router.push('/vote')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold"
        >
          Enter Voters Corridor
        </button>
      </div>
    );
  }

  const liveCount = voteCount ?? 0;
  const isLoading = voteCount === undefined || currentElection === undefined;
  const isActive = currentElection?.status === 'active';

  return (
    <div className="space-y-6 font-sans py-4 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full animate-fade-in">

      {/* Visual Board */}
      <div className="bg-linear-to-b from-blue-900 to-slate-950 text-white rounded-2xl p-8 border border-slate-800 text-center relative overflow-hidden shadow-md select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-blue-600/10 rounded-full blur-2xl" />

        <div className="relative space-y-5">
          <div className="inline-flex bg-blue-500/25 p-3 rounded-full border border-blue-400/20 text-blue-400">
            <HugeiconsIcon icon={TrendingUpDownIcon} className="h-6 w-6" strokeWidth={1.5} />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 bg-blue-950/50 px-2.5 py-0.5 rounded border border-blue-900/40">
              Live Candidate Tracker
            </span>
            <h2 className="font-sans font-bold text-base text-slate-100 mt-2">
              Position: {matchedCategory?.name ?? '—'}
            </h2>
            <p className="text-xs text-slate-400">
              Candidate ID: <span className="font-mono text-slate-300">{currentUser.studentId}</span>
            </p>
          </div>

          <div className="py-2">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="h-8 w-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              </div>
            ) : (
              <span className="block text-7xl font-mono font-extrabold tracking-tight text-white select-all">
                {liveCount}
              </span>
            )}
            <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase mt-2 block">
              Official Sealed Ballots
            </span>
          </div>

          <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            Your live vote count updates automatically as voters submit their ballots in the KTU COMPSSA system.
          </p>

          <div className="border-t border-slate-800 pt-4 flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
            <HugeiconsIcon icon={Shield01Icon} className="h-3.5 w-3.5 text-blue-500" />
            <span>Encrypted Privacy Partition Active • Tally audit confirmed</span>
          </div>
        </div>
      </div>

      {isActive && (
        <div className="border border-slate-200/60 p-5 rounded-xl bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shadow-3xs">
          <div className="space-y-0.5 text-center sm:text-left">
            <h4 className="font-sans font-semibold text-xs text-slate-900 flex items-center gap-2 justify-center sm:justify-start">
              <HugeiconsIcon icon={CheckmarkSquare01Icon} className="h-4.5 w-4.5 text-blue-600" />
              <span>Have you cast your own ballot?</span>
            </h4>
            <p className="text-xs text-slate-500">You are eligible to vote for other positions in KTU COMPSSA categories.</p>
          </div>
          <button
            onClick={() => router.push('/vote')}
            className="whitespace-nowrap bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all"
          >
            Enter Voters Corridor
          </button>
        </div>
      )}
    </div>
  );
}
