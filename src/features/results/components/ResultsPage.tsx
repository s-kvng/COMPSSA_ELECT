'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/shared/auth';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Award01Icon,
  Clock01Icon,
  SparklesIcon,
  CheckmarkCircle01Icon,
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const currentUser = useCurrentUser();

  const electionId = params.electionId as Id<'elections'>;
  const results = useQuery(api.results.electionResults, { electionId });

  if (results === undefined) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="h-6 w-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (results.status === 'voting_in_progress' || results.status === 'not_published') {
    return (
      <div className="min-h-screen bg-slate-50 py-6 sm:py-12 px-4 font-sans animate-fade-in">
        <div className="max-w-3xl mx-auto space-y-6">
          <button
            onClick={() => router.push(currentUser ? '/dashboard' : '/')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4.5 w-4.5" />
            {currentUser ? 'Return to Dashboard' : 'Back to Home'}
          </button>

          <div className="bg-white border rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto shadow-3xs">
            <HugeiconsIcon icon={Clock01Icon} className="h-10 w-10 text-amber-500 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-base text-slate-900">Voting Tallies Sealed</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {results.status === 'voting_in_progress'
                  ? 'Voting is currently in progress. Results are sealed until the election closes.'
                  : 'Results are awaiting certification and publication by the Electoral Commission.'}
              </p>
              <p className="text-[11px] text-slate-400 leading-normal pt-2">
                Results will be published live on this page by the Electoral Commission after audit and verification.
              </p>
            </div>
          </div>

          <div className="text-center text-[10px] font-mono text-slate-400 py-4">
            <p>© 2026 Department of Computer Science • Ghana</p>
            <p className="mt-1">COMPSSA Online Election System • Audit Ledger V1.0</p>
          </div>
        </div>
      </div>
    );
  }

  const categories = results.categories;

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans select-none animate-fade-in text-left">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(currentUser ? '/dashboard' : '/')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4.5 w-4.5" />
            {currentUser ? 'Return to Dashboard' : 'Back to Home'}
          </button>
          <span className="text-[10px] font-mono text-slate-400 bg-white border px-3 py-1 rounded-lg">
            Audit Ledger Sealed ✓
          </span>
        </div>

        {/* Header card */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-3xs text-center space-y-4">
          <div className="inline-flex bg-purple-50 text-purple-700 p-2.5 rounded-xl border border-purple-100 mb-1">
            <HugeiconsIcon icon={Award01Icon} className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-purple-600 uppercase tracking-widest font-black">
              Official Certified Ballot Results
            </span>
            <h2 className="font-sans font-extrabold text-2xl text-slate-900 mt-2">COMPSSA Elections</h2>
          </div>
        </div>

        {/* Verification banner */}
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-start gap-4 text-emerald-800 shadow-3xs">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-10 w-10 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-sans font-bold text-sm">Electoral Commission Verification Confirmed</h4>
            <p className="text-xs text-emerald-600 leading-normal">
              Results have been verified and officially published by the Electoral Commission.
              Winner blocks indicate the candidate with the simple majority of legal department ballots.
            </p>
          </div>
        </div>

        {/* Position tables */}
        <div className="space-y-5 select-text">
          {categories.map((cat) => {
            const sorted = [...cat.candidates].sort((a, b) => b.count - a.count);
            const totalVotes = cat.candidates.reduce((acc, c) => acc + c.count, 0);

            return (
              <div key={cat._id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-sans font-bold text-sm text-slate-900 leading-none">{cat.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-2">
                    Certified total category ballots: {totalVotes}
                  </p>
                </div>

                <div className="space-y-4">
                  {sorted.map((cand, idx) => {
                    const pct = totalVotes > 0 ? Math.round((cand.count / totalVotes) * 100) : 0;
                    const isWinner = idx === 0 && cand.count > 0;

                    return (
                      <div key={cand._id} className="space-y-1.5">
                        <div className="flex justify-between text-xs items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-400">{idx + 1}.</span>
                            <span className={`font-semibold ${isWinner ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                              {cand.userName}
                            </span>
                            {isWinner && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 rounded-full font-mono uppercase leading-none">
                                <HugeiconsIcon icon={SparklesIcon} className="h-2.5 w-2.5" />
                                Winner
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-500 font-medium">
                            <strong className="text-slate-800 font-bold">{cand.count}</strong> ballots ({pct}%)
                          </span>
                        </div>

                        <div className="h-3.5 w-full bg-slate-100 rounded-md overflow-hidden border border-slate-50">
                          <div
                            className={`h-full rounded-md transition-all duration-300 ${isWinner ? 'bg-amber-500' : 'bg-blue-600'}`}
                            style={{ width: `${pct || 1}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-[10px] font-mono text-slate-400 py-6">
          <p>© 2026 Department of Computer Science • Ghana</p>
          <p className="mt-1">COMPSSA Online Election System • Audit Ledger V1.0</p>
        </div>
      </div>
    </div>
  );
}
