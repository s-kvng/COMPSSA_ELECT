/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import { Award, Clock, Sparkles, CheckCircle2, ChevronLeft } from 'lucide-react';

export default function ResultsPage() {
  const { elections, currentUser } = useAuthContext();
  const { params, navigateTo } = useNavigation();

  // Pick election based on url params
  const electId = params.id || params.electionId || 'elect-2026';
  const election = elections.find(e => e.id === electId) || elections[0];

  if (!election) {
    return (
      <div id="results-error" className="py-12 text-center max-w-sm mx-auto space-y-4 font-sans">
        <p className="text-xs text-slate-500">Election records for results could not be found.</p>
        <button onClick={() => navigateTo('/')} className="px-4 py-2 bg-slate-900 text-white rounded-lg">Return to Start</button>
      </div>
    );
  }

  const isPublished = election.status === 'Published';

  return (
    <div id="results-page" className="min-h-screen bg-slate-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans select-none animate-fade-in text-left">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back control */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo(currentUser ? '/dashboard' : '/')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
            <span>{currentUser ? 'Return to Dashboard' : 'Back to Home Information'}</span>
          </button>
          
          <span className="text-[10px] font-mono text-slate-400 bg-white border px-3 py-1 rounded-lg">
            Audit Ledger Sealed ✓
          </span>
        </div>

        {/* Visual Header card */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-3xs text-center space-y-4">
          <div className="inline-flex bg-purple-50 text-purple-700 p-2.5 rounded-xl border border-purple-100 mb-1">
            <Award className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-purple-600 uppercase tracking-widest font-black">Official Certified Ballot Results</span>
            <h2 className="font-display font-extrabold text-2xl text-slate-900 mt-2">{election.title}</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mt-1">{election.description}</p>
          </div>
        </div>

        {isPublished ? (
          <div className="space-y-6">
            {/* Success validation */}
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-start gap-4 text-emerald-800 shadow-3xs">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-display font-bold text-sm">Electoral Commission Verification Confirmed</h4>
                <p className="text-xs text-emerald-600 leading-normal">
                  The Electoral Commissioner (EC) has verified candidate counts and officially published the results on{' '}
                  <strong className="font-semibold text-emerald-900">{election.publishedAt ? new Date(election.publishedAt).toISOString().replace('T', ' ').slice(0, 16) : 'May 23, 2026'} UTC</strong>.
                  Winner blocks indicate the candidate with the simple majority of legal department ballots.
                </p>
              </div>
            </div>

            {/* Position tables */}
            <div className="space-y-5 select-text">
              {election.categories.map((cat) => {
                const candidatesSorted = [...cat.candidates].sort((a, b) => b.votes - a.votes);
                const totalCatVotes = cat.candidates.reduce((acc, curr) => acc + curr.votes, 0);

                return (
                  <div key={cat.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-3xs space-y-4">
                    <div className="pb-3 border-b border-slate-100">
                      <h3 className="font-display font-bold text-sm text-slate-900 leading-none">{cat.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-2">Certified total category ballots: {totalCatVotes}</p>
                    </div>

                    <div className="space-y-4">
                      {candidatesSorted.map((cand, idx) => {
                        const pct = totalCatVotes > 0 ? Math.round((cand.votes / totalCatVotes) * 100) : 0;
                        const isWinner = idx === 0 && cand.votes > 0;

                        return (
                          <div key={cand.id} className="space-y-1.5">
                            <div className="flex justify-between text-xs items-center">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-400">{idx + 1}.</span>
                                <span className={`font-semibold ${isWinner ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                                  {cand.name}
                                </span>
                                {isWinner && (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-250 rounded-full font-mono uppercase leading-none">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    Winner
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-slate-500 font-medium">
                                <strong className="text-slate-800 font-bold">{cand.votes}</strong> ballots ({pct}%)
                              </span>
                            </div>

                            <div className="h-3.5 w-full bg-slate-100 rounded-md overflow-hidden relative border border-slate-50">
                              <div
                                className={`h-full rounded-md transition-all duration-300 ${isWinner ? 'bg-amber-500' : 'bg-blue-600'}`}
                                style={{ width: `${pct || 1}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Locked results state */
          <div className="bg-white border rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto shadow-3xs">
            <Clock className="h-10 w-10 text-amber-500 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base text-slate-850">Voting Tallies Sealed</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The polling process in this election is either active, closed, or awaiting certification.
              </p>
              <p className="text-[11px] text-slate-400 leading-normal pt-2">
                Results will be published live on this URL by the Electoral Commission immediately after audit and verification procedures are completed.
              </p>
            </div>
          </div>
        )}

        {/* Footer info lockups */}
        <div className="text-center text-[10px] font-mono text-slate-400 py-6">
          <p>© 2026 Department of Computer Science • Ghana</p>
          <p className="mt-1">COMPSSA Online Election System • Audit Ledger V1.0</p>
        </div>
      </div>
    </div>
  );
}

