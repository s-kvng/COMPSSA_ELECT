'use client';

import React, { useState } from 'react';
import { useIsMounted } from '@/hooks/useIsMounted';
import { createPortal } from 'react-dom';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import StatusBadge from '@/components/StatusBadge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  PlusSignIcon,
  Delete01Icon,
  LockIcon,
  UserAdd01Icon,
  Tv01Icon,
  AlertCircleIcon,
  PlayIcon,
} from '@hugeicons/core-free-icons';

export default function ElectionDetailPage() {
  const {
    elections,
    users,
    updateElectionStatus,
    addCategoryToElection,
    removeCategoryFromElection,
    addCandidateToCategory,
    removeCandidateFromCategory,
  } = useAuthContext();
  const { navigateTo, params } = useNavigation();

  const [activeTab, setActiveTab] = useState<'categories' | 'candidates'>('categories');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [selectedCandidateStudentId, setSelectedCandidateStudentId] = useState('');
  const [candidateBio, setCandidateBio] = useState('');
  const [expandedCategoryIdForCandidate, setExpandedCategoryIdForCandidate] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const isMounted = useIsMounted();

  const electId = params.id;
  const election = elections.find((e) => e.id === electId);

  if (!election) {
    return (
      <div className="py-12 text-center max-w-sm mx-auto px-4 space-y-4">
        <p className="text-xs text-muted-foreground">Election record not located.</p>
        <button
          onClick={() => navigateTo('/admin/elections')}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium"
        >
          Return to List
        </button>
      </div>
    );
  }

  const isEditable = election.status === 'Draft';

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    addCategoryToElection(election.id, newCategoryName, newCategoryDesc);
    setNewCategoryName('');
    setNewCategoryDesc('');
    setShowAddCategoryForm(false);
  };

  const handleAddCandidate = (e: React.FormEvent, categoryId: string) => {
    e.preventDefault();
    if (!selectedCandidateStudentId) return;
    addCandidateToCategory(election.id, categoryId, selectedCandidateStudentId, candidateBio);
    setSelectedCandidateStudentId('');
    setCandidateBio('');
    setExpandedCategoryIdForCandidate(null);
  };

  const getValidationErrors = () => {
    const errs: string[] = [];
    if (election.categories.length === 0) {
      errs.push('Must configure at least 1 position category.');
    } else {
      election.categories.forEach((cat) => {
        if (cat.candidates.length === 0)
          errs.push(`"${cat.name}" has no registered candidates.`);
      });
    }
    return errs;
  };

  const validationErrors = getValidationErrors();
  const canLock = isEditable && validationErrors.length === 0;

  const currentCandidateIds = new Set(
    election.categories.flatMap((c) => c.candidates.map((cand) => cand.id))
  );
  const eligibleStudents = users.filter(
    (u) => u.role !== 'EC' && u.role !== 'HOD' && !currentCandidateIds.has(u.studentId)
  );

  return (
    <div className="py-4 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('/admin/elections')}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4.5 w-4.5" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={election.status} />
              <span className="text-[10px] font-mono text-muted-foreground/60">
                ID: {election.id}
              </span>
            </div>
            <h3 className="font-sans font-bold text-lg text-foreground leading-tight">
              {election.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {election.status === 'Draft' && (
            <button
              onClick={() => canLock && updateElectionStatus(election.id, 'Ready')}
              disabled={!canLock}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm ${
                canLock
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                  : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
              }`}
            >
              <HugeiconsIcon icon={LockIcon} className="h-3.5 w-3.5" />
              Lock and Mark Ready
            </button>
          )}

          {election.status === 'Ready' && (
            <button
              onClick={() => updateElectionStatus(election.id, 'Active')}
              className="px-4 py-2 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              style={{ backgroundColor: 'var(--color-success)' }}
            >
              <HugeiconsIcon icon={PlayIcon} className="h-3.5 w-3.5" />
              Activate Early (Demo)
            </button>
          )}

          {election.status === 'Active' && (
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="px-4 py-2 text-xs font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <HugeiconsIcon icon={LockIcon} className="h-3.5 w-3.5" />
              Close Election Early
            </button>
          )}

          {['Active', 'Closed', 'Published'].includes(election.status) && (
            <button
              onClick={() => navigateTo(`/admin/elections/${election.id}/live`)}
              className="px-4 py-2 text-xs font-semibold text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <HugeiconsIcon icon={Tv01Icon} className="h-3.5 w-3.5" />
              Live Monitor
            </button>
          )}
        </div>
      </div>

      {/* Validation banner */}
      {isEditable && validationErrors.length > 0 && (
        <div className="bg-[#fef3c7] border border-[#fcd34d] p-4 rounded-xl flex gap-3 text-xs leading-relaxed">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-4.5 w-4.5 text-[#92400e] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-[#92400e]">
              Setup incomplete ({validationErrors.length} issue{validationErrors.length > 1 ? 's' : ''})
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-[#b45309]">
              {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-1 select-none">
        {(['categories', 'candidates'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all capitalize ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'categories'
              ? `Categories (${election.categories.length})`
              : 'Candidate Registry'}
          </button>
        ))}
      </div>

      {/* Categories tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {isEditable && !showAddCategoryForm && (
            <button
              onClick={() => setShowAddCategoryForm(true)}
              className="w-full py-3 border border-dashed border-border hover:border-primary/40 hover:bg-primary/4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5 transition-all"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4" strokeWidth={2.5} />
              Add Position Category
            </button>
          )}

          {showAddCategoryForm && (
            <div className="p-5 border border-border bg-card rounded-xl shadow-sm animate-fade-in space-y-4">
              <p className="text-xs font-semibold text-foreground">New Category</p>
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-muted-foreground mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. SRC President"
                    className="block w-full px-3 py-2 text-xs border border-border bg-input rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-muted-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="What does this role oversee?"
                    className="block w-full px-3 py-2 text-xs border border-border bg-input rounded-lg focus:border-primary outline-none resize-none font-sans"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryForm(false)}
                    className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted border border-border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg shadow-sm"
                  >
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          )}

          {election.categories.length === 0 ? (
            <div className="text-center py-14 bg-card rounded-2xl border border-dashed border-border text-muted-foreground text-xs">
              No categories configured. Create your first position category above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {election.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="border border-border bg-card p-5 rounded-xl flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-sans font-bold text-sm text-foreground leading-tight truncate">
                        {cat.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {cat.description || 'No description.'}
                      </p>
                    </div>
                    {isEditable && (
                      <button
                        onClick={() => removeCategoryFromElection(election.id, cat.id)}
                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all shrink-0"
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="pt-2 border-t border-border text-[10px] font-mono text-muted-foreground">
                    <span>
                      Candidates:{' '}
                      <strong className="text-foreground">{cat.candidates.length}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Candidates tab */}
      {activeTab === 'candidates' && (
        <div className="space-y-5">
          {election.categories.length === 0 ? (
            <div className="text-center py-14 bg-card rounded-2xl border border-dashed border-border text-muted-foreground text-xs">
              Configure at least one category before registering candidates.
            </div>
          ) : (
            election.categories.map((cat) => {
              const isAddingToThisCat = expandedCategoryIdForCandidate === cat.id;
              return (
                <div key={cat.id} className="border border-border bg-card rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-foreground">{cat.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {cat.candidates.length} candidate{cat.candidates.length !== 1 ? 's' : ''} registered
                      </p>
                    </div>
                    {isEditable && !isAddingToThisCat && (
                      <button
                        onClick={() => setExpandedCategoryIdForCandidate(cat.id)}
                        className="py-1.5 px-3 border border-border hover:border-primary/40 hover:bg-primary/5 text-xs font-semibold rounded-lg text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-all"
                      >
                        <HugeiconsIcon icon={UserAdd01Icon} className="h-3.5 w-3.5" />
                        Register Candidate
                      </button>
                    )}
                  </div>

                  <div className="p-5 space-y-4">
                    {isEditable && isAddingToThisCat && (
                      <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-3 animate-fade-in">
                        <p className="text-xs font-semibold text-foreground">Add Candidate</p>
                        <form onSubmit={(e) => handleAddCandidate(e, cat.id)} className="space-y-3">
                          <div>
                            <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-muted-foreground mb-1">
                              Student
                            </label>
                            <select
                              required
                              value={selectedCandidateStudentId}
                              onChange={(e) => setSelectedCandidateStudentId(e.target.value)}
                              className="block w-full px-3 py-2 text-xs border border-border bg-card rounded-lg focus:border-primary outline-none font-sans"
                            >
                              <option value="">— Select student —</option>
                              {eligibleStudents.map((s) => (
                                <option key={s.studentId} value={s.studentId}>
                                  {s.name} ({s.studentId})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-muted-foreground mb-1">
                              Campaign Bio
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={candidateBio}
                              onChange={(e) => setCandidateBio(e.target.value)}
                              placeholder="Goals, platforms, or manifesto..."
                              className="block w-full px-3 py-2 text-xs border border-border bg-card rounded-lg focus:border-primary outline-none resize-none font-sans"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedCategoryIdForCandidate(null)}
                              className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted border border-border rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={!selectedCandidateStudentId}
                              className="px-4 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg"
                            >
                              Enlist Candidate
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {cat.candidates.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                        No candidates registered yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cat.candidates.map((cand) => (
                          <div
                            key={cand.id}
                            className="border border-border rounded-xl p-4 flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="space-y-1 min-w-0">
                              <h5 className="font-sans font-semibold text-sm text-foreground leading-tight">
                                {cand.name}
                              </h5>
                              <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                                {cand.id}
                              </span>
                              <p className="text-xs text-muted-foreground leading-relaxed mt-1 pr-2">
                                {cand.bio}
                              </p>
                            </div>
                            {isEditable && (
                              <button
                                onClick={() => removeCandidateFromCategory(election.id, cat.id, cand.id)}
                                className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg shrink-0 transition-colors"
                              >
                                <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Close early confirmation modal */}
      {showCloseConfirm && isMounted && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-foreground">Close voting early?</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  This will immediately stop all voting for{' '}
                  <strong className="text-foreground">{election.title}</strong>. Students
                  currently active will be locked out. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground border border-border rounded-xl hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateElectionStatus(election.id, 'Closed');
                  setShowCloseConfirm(false);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-xl transition-all"
              >
                Close Election
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
