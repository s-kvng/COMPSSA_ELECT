/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import { ArrowLeft, CheckCircle2, ShieldQuestion, Loader2 } from 'lucide-react';

export default function VoteCategoryPage() {
  const { currentUser, elections, voteRecords, registerVote } = useAuthContext();
  const { navigateTo, params } = useNavigation();

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  // Active election lookup
  const activeElection = elections.find(e => e.status === 'Active');
  const catId = params.categoryId;

  if (!activeElection || !catId) {
    return (
      <div id="vote-no-cat-error" className="py-8 text-center max-w-md mx-auto">
        <p className="text-xs text-slate-500 mb-4">Balloting record could not be located in this viewport.</p>
        <button onClick={() => navigateTo('/vote')} className="px-4 py-2 bg-slate-900 text-white rounded-lg">Return to List</button>
      </div>
    );
  }

  const category = activeElection.categories.find(c => c.id === catId);
  if (!category) {
    return (
      <div id="vote-no-cat-found" className="py-8 text-center max-w-sm mx-auto">
        <p className="text-xs text-slate-500 mb-4">Category not found.</p>
        <button onClick={() => navigateTo('/vote')} className="px-4 py-2 bg-slate-900 text-white rounded-lg">Return to List</button>
      </div>
    );
  }

  // Already voted check
  const userVote = voteRecords.find(r => r.voterId === currentUser.id && r.categoryId === catId);
  const hasVoted = !!userVote;

  const handleSelectCandidate = (candidateId: string) => {
    if (hasVoted) return; // block edit
    setSelectedCandidateId(candidateId);
  };

  const handleTriggerVote = () => {
    if (!selectedCandidateId) return;
    setShowConfirmModal(true);
  };

  const handleConfirmVote = () => {
    if (!selectedCandidateId) return;
    setIsSubmitting(true);

    // Simulate cryptographic vote registration overhead
    setTimeout(() => {
      registerVote(catId, selectedCandidateId);
      setIsSubmitting(false);
      setShowConfirmModal(false);
      navigateTo('/vote');
    }, 1000);
  };

  const selectedCandidate = category.candidates.find(c => c.id === selectedCandidateId);

  return (
    <div id="vote-category-page" className="space-y-6 font-sans py-4 animate-fade-in relative">
      {/* Back navigation Row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigateTo('/vote')}
          className="p-1.5 hover:bg-slate-100 rounded-lg group text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <span className="text-xs font-semibold text-slate-500">Back to Category Grid</span>
      </div>

      {/* Header and status banner */}
      <div>
        <span className="text-[10px] font-mono font-bold text-blue-600 uppercase bg-blue-50 border px-2 py-0.5 rounded-md">BOOTH ACTIVE</span>
        <h2 className="font-display font-extrabold text-2xl text-slate-900 mt-2">{category.name}</h2>
        <p className="text-xs text-slate-500 mt-1">{category.description}</p>
      </div>

      {hasVoted ? (
        <div id="already-voted-notice" className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex items-center gap-4 text-emerald-800 shadow-3xs">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="font-display font-bold text-sm">Ballot Already Sealed</h4>
            <p className="text-xs text-emerald-600">
              You have previously registered your vote in this category. Re-submitting or altering cast sheets is strictly prohibited in compliance with COMPSSA bylaws.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50/40 border border-blue-100 p-4 rounded-xl text-xs text-blue-800 flex items-center gap-2.5">
          <ShieldQuestion className="h-5 w-5 text-blue-500" />
          <span>Select one candidate block from the list below and tap Confirm to cast your irrevocable ballot.</span>
        </div>
      )}

      {/* Candidates Cards Stack */}
      <div className="space-y-3.5">
        <h3 className="font-display font-bold text-sm text-slate-800">Listed Candidate Board</h3>
        {category.candidates.length === 0 ? (
          <p className="text-xs text-slate-400">There are no candidates registered in this category yet.</p>
        ) : (
          category.candidates.map((cand) => {
            const isSelected = selectedCandidateId === cand.id;
            const isVotedChoice = hasVoted && userVote.candidateId === cand.id;

            return (
              <div
                key={cand.id}
                onClick={() => handleSelectCandidate(cand.id)}
                className={`border rounded-xl p-5 flex items-start gap-4 transition-all duration-150 select-none ${
                  isVotedChoice
                    ? 'border-emerald-500 bg-emerald-50/10'
                    : isSelected
                    ? 'border-blue-500 bg-blue-50/10 shadow-3xs'
                    : hasVoted
                    ? 'border-slate-100 opacity-60 bg-slate-50 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-slate-350 cursor-pointer shadow-3xs'
                }`}
              >
                {/* Visual Check/Indicator ring */}
                <div className="mt-1 shrink-0">
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                      isVotedChoice
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {(isSelected || isVotedChoice) && (
                      <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-sm text-slate-900">{cand.name}</h4>
                    {isVotedChoice && (
                      <span className="text-[9px] font-mono leading-none bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                        My Sealed Choice
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans mt-1.5">
                    {cand.bio}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating or stable CTA action bar */}
      {!hasVoted && category.candidates.length > 0 && (
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleTriggerVote}
            disabled={!selectedCandidateId}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg shadow-sm cursor-pointer transition-all"
          >
            Review and Confirm Vote Choice
          </button>
        </div>
      )}

      {/* Dynamic Confirmation Dialog Overlay Modal - STACK STYLED */}
      {showConfirmModal && selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start gap-4 text-left">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl border border-blue-100 shrink-0">
                <ShieldQuestion className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-slate-900">Irrevocable Ballot Confirmation</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  You are about to cast your single departmental ballot in the <strong>{category.name}</strong> election group.
                </p>
              </div>
            </div>

            <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-xl border-l-4 border-l-blue-600">
              <p className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">Your Selection</p>
              <p className="text-xs font-bold text-slate-800 mt-1">{selectedCandidate.name}</p>
              <p className="text-[11px] text-slate-500 leading-normal mt-1 line-clamp-2">{selectedCandidate.bio}</p>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal text-left">
              By confirming, this selection is written into the audit blockchain ledger. No revisions can be permitted after submission.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-md transition-all outline-none"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmVote}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 outline-none flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sealing Ballot...</span>
                  </>
                ) : (
                  <span>Submit Vote Card</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

