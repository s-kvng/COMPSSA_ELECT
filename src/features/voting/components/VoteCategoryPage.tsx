'use client';

import React, { useState } from 'react';
import { useIsMounted } from '@/hooks/useIsMounted';
import { createPortal } from 'react-dom';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  ShieldQuestionMarkIcon,
  LoaderPinwheelIcon,
  Tick01Icon,
} from '@hugeicons/core-free-icons';

// Deterministic color palette for candidate avatars (hue cycles by name)
const PALETTE = [
  { bg: '#e0e7ff', text: '#4338ca' },
  { bg: '#d1fae5', text: '#065f46' },
  { bg: '#fce7f3', text: '#9d174d' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#dbeafe', text: '#1e40af' },
  { bg: '#ede9fe', text: '#5b21b6' },
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % PALETTE.length;
  return PALETTE[idx];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function VoteCategoryPage() {
  const { currentUser, elections, voteRecords, registerVote, users } = useAuthContext();
  const { navigateTo, params } = useNavigation();

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMounted = useIsMounted();

  if (!currentUser) return null;

  const activeElection = elections.find((e) => e.status === 'Active');
  const catId = params.categoryId;

  if (!activeElection || !catId) {
    return (
      <div className="py-12 text-center max-w-md mx-auto px-4">
        <p className="text-sm text-muted-foreground mb-4">Category could not be located.</p>
        <button
          onClick={() => navigateTo('/vote')}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium"
        >
          Return to List
        </button>
      </div>
    );
  }

  const category = activeElection.categories.find((c) => c.id === catId);
  if (!category) {
    return (
      <div className="py-12 text-center max-w-sm mx-auto px-4">
        <p className="text-sm text-muted-foreground mb-4">Category not found.</p>
        <button
          onClick={() => navigateTo('/vote')}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium"
        >
          Return to List
        </button>
      </div>
    );
  }

  const userVote = voteRecords.find(
    (r) => r.voterId === currentUser.id && r.categoryId === catId
  );
  const hasVoted = !!userVote;

  const handleSelectCandidate = (candidateId: string) => {
    if (hasVoted) return;
    setSelectedCandidateId(candidateId);
  };

  const handleConfirmVote = () => {
    if (!selectedCandidateId) return;
    setIsSubmitting(true);
    setTimeout(() => {
      registerVote(catId, selectedCandidateId);
      setIsSubmitting(false);
      setShowConfirmModal(false);
      navigateTo('/vote');
    }, 1000);
  };

  const selectedCandidate = category.candidates.find((c) => c.id === selectedCandidateId);

  return (
    <div className="py-4 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full animate-fade-in space-y-6">
      {/* Back nav */}
      <button
        onClick={() => navigateTo('/vote')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform"
        />
        Back to Voting Booth
      </button>

      {/* Header */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono font-bold text-primary uppercase bg-primary/8 border border-primary/20 px-2 py-0.5 rounded-md">
          BOOTH ACTIVE
        </span>
        <h2 className="font-sans font-bold text-2xl text-foreground mt-2">{category.name}</h2>
        <p className="text-sm text-muted-foreground">{category.description}</p>
      </div>

      {/* Status banner */}
      {hasVoted ? (
        <div className="bg-[#d1fae5] border border-[#6ee7b7] p-4 rounded-xl flex items-center gap-3">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-5 w-5 text-[#065f46] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#065f46]">Ballot Sealed</p>
            <p className="text-xs text-[#047857] mt-0.5">
              Your vote in this category has been securely recorded and cannot be changed.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-primary/5 border border-primary/15 p-3.5 rounded-xl text-sm text-primary/80 flex items-center gap-2.5">
          <HugeiconsIcon icon={ShieldQuestionMarkIcon} className="h-4.5 w-4.5 shrink-0" />
          <span>Select a candidate below, then tap <strong>Confirm Vote</strong> to cast your irrevocable ballot.</span>
        </div>
      )}

      {/* Candidate grid */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {category.candidates.length} Candidate{category.candidates.length !== 1 ? 's' : ''} Running
        </p>

        {category.candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No candidates registered in this category.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {category.candidates.map((cand) => {
              const user = users.find((u) => u.id === cand.id);
              const avatarUrl = user?.avatarUrl;
              const initials = getInitials(cand.name);
              const color = getAvatarColor(cand.name);
              const isSelected = selectedCandidateId === cand.id;
              const isVotedChoice = hasVoted && userVote?.candidateId === cand.id;
              const isActive = isSelected || isVotedChoice;

              return (
                <div
                  key={cand.id}
                  onClick={() => handleSelectCandidate(cand.id)}
                  className={[
                    'relative rounded-2xl border overflow-hidden transition-all duration-200 select-none flex flex-col',
                    isVotedChoice
                      ? 'border-[#34d399] ring-2 ring-[#34d399]/30 shadow-sm'
                      : isSelected
                      ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                      : hasVoted
                      ? 'border-border opacity-50 cursor-not-allowed'
                      : 'border-border bg-card hover:border-primary/40 hover:shadow-sm cursor-pointer',
                  ].join(' ')}
                >
                  {/* Portrait area */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={cand.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: color.bg }}
                      >
                        <span
                          className="font-bold text-3xl sm:text-4xl tracking-tight"
                          style={{ color: color.text }}
                        >
                          {initials}
                        </span>
                      </div>
                    )}

                    {/* Selected check badge */}
                    {isActive && (
                      <div
                        className={[
                          'absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center shadow-md',
                          isVotedChoice ? 'bg-[#10b981]' : 'bg-primary',
                        ].join(' ')}
                      >
                        <HugeiconsIcon icon={Tick01Icon} className="h-4 w-4 text-white" strokeWidth={2.5} />
                      </div>
                    )}

                    {/* "My vote" ribbon */}
                    {isVotedChoice && (
                      <div className="absolute bottom-0 inset-x-0 bg-[#10b981] py-1 text-center">
                        <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                          My Vote
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info area */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col gap-1">
                    <h4 className="font-sans font-bold text-sm text-foreground leading-tight">
                      {cand.name}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                      {cand.bio}
                    </p>

                    {/* Selection indicator */}
                    {!hasVoted && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                        <div
                          className={[
                            'h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-border bg-background',
                          ].join(' ')}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 bg-white rounded-full" />}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit bar */}
      {!hasVoted && category.candidates.length > 0 && (
        <div className="sticky bottom-4 pt-4">
          <div className="bg-card border border-border rounded-2xl p-3 flex items-center justify-between gap-3 shadow-md">
            <p className="text-xs text-muted-foreground">
              {selectedCandidateId
                ? <>Voting for <span className="font-semibold text-foreground">{selectedCandidate?.name}</span></>
                : 'No candidate selected yet'}
            </p>
            <button
              onClick={() => selectedCandidateId && setShowConfirmModal(true)}
              disabled={!selectedCandidateId}
              className="shrink-0 px-5 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
            >
              Confirm Vote
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal — rendered via portal so it escapes the sidebar stacking context */}
      {showConfirmModal && selectedCandidate && isMounted && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="font-sans font-bold text-base text-foreground">Confirm your vote</h3>
              <p className="text-xs text-muted-foreground mt-1">
                This action is permanent and cannot be undone.
              </p>
            </div>

            {/* Candidate preview */}
            <div className="flex items-center gap-4 bg-muted/40 border border-border p-4 rounded-xl">
              {(() => {
                const user = users.find((u) => u.id === selectedCandidate.id);
                const avatarUrl = user?.avatarUrl;
                const color = getAvatarColor(selectedCandidate.name);
                return avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={selectedCandidate.name}
                    className="h-12 w-12 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color.bg }}
                  >
                    <span className="font-bold text-sm" style={{ color: color.text }}>
                      {getInitials(selectedCandidate.name)}
                    </span>
                  </div>
                );
              })()}
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">{selectedCandidate.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{category.name}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground border border-border rounded-xl hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmVote}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <HugeiconsIcon icon={LoaderPinwheelIcon} className="h-4 w-4 animate-spin" />
                    Sealing…
                  </>
                ) : (
                  'Cast Vote'
                )}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
