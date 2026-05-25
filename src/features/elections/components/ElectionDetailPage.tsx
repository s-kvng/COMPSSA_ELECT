/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import StatusBadge from '@/components/StatusBadge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  PlusSignIcon,
  Delete01Icon,
  LockIcon,
  ArrowRight01Icon,
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

  const electId = params.id;
  const election = elections.find(e => e.id === electId);

  if (!election) {
    return (
      <div id="elect-detail-error" className="py-12 text-center max-w-sm mx-auto space-y-4">
        <p className="text-xs text-slate-500">Election record not located.</p>
        <button onClick={() => navigateTo('/admin/elections')} className="px-4 py-2 bg-slate-900 text-white rounded-lg">Return to List</button>
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

  // Perform validation to ensure setup is fully locked and correct
  const getValidationErrors = () => {
    const errs: string[] = [];
    if (election.categories.length === 0) {
      errs.push('Must configure at least 1 position category.');
    } else {
      election.categories.forEach(cat => {
        if (cat.candidates.length === 0) {
          errs.push(`Category "${cat.name}" has no registered candidates.`);
        }
      });
    }
    return errs;
  };

  const validationErrors = getValidationErrors();
  const canLock = isEditable && validationErrors.length === 0;

  // Set from Draft -> Ready
  const handleLockSetup = () => {
    if (!canLock) return;
    updateElectionStatus(election.id, 'Ready');
  };

  // Manual open early for verification/demo purposes
  const handleActivateManual = () => {
    updateElectionStatus(election.id, 'Active');
  };

  // Close election manual
  const handleCloseEarly = () => {
    const conf = window.confirm('Are you sure you want to CLOSE voting early? This will prevent students from casting any more votes.');
    if (conf) {
      updateElectionStatus(election.id, 'Closed');
    }
  };

  // Filter students showing only ones who aren't already candidates in this election
  const currentCandidateIds = new Set(election.categories.flatMap(c => c.candidates.map(cand => cand.id)));
  const eligibleStudents = users.filter(u =>
    u.role !== 'EC' && u.role !== 'HOD' && !currentCandidateIds.has(u.studentId)
  );

  return (
    <div id="election-detail" className="space-y-6 font-sans py-4 animate-fade-in select-none">
      {/* Navigation and Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('/admin/elections')}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4.5 w-4.5" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={election.status} />
              <span className="text-[10px] font-mono text-slate-400">ID: {election.id}</span>
            </div>
            <h3 className="font-display font-extrabold text-lg text-slate-900">{election.title}</h3>
          </div>
        </div>

        {/* Dynamic header primary CTA buttons */}
        <div className="flex items-center gap-2">
          {election.status === 'Draft' && (
            <button
              onClick={handleLockSetup}
              disabled={!canLock}
              className={`px-4 py-2.5 text-xs font-semibold rounded-lg flex items-center gap-1 w-full sm:w-auto justify-center transition-all shadow-2xs ${
                canLock
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <HugeiconsIcon icon={LockIcon} className="h-4 w-4" />
              <span>Lock and Mark Ready</span>
            </button>
          )}

          {election.status === 'Ready' && (
            <button
              onClick={handleActivateManual}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
            >
              <HugeiconsIcon icon={PlayIcon} className="h-4 w-4" />
              <span>Activate Early (Live Demo)</span>
            </button>
          )}

          {election.status === 'Active' && (
            <button
              onClick={handleCloseEarly}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1 transition-all shadow-2xs cursor-pointer hover:shadow-md"
            >
              <HugeiconsIcon icon={LockIcon} className="h-4 w-4" />
              <span>Close Election Early</span>
            </button>
          )}

          {['Active', 'Closed', 'Published'].includes(election.status) && (
            <button
              onClick={() => navigateTo(`/admin/elections/${election.id}/live`)}
              className="px-4 py-2.5 text-xs font-semibold text-blue-750 bg-blue-50 hover:bg-blue-100 border border-blue-200/50 rounded-lg flex items-center gap-1 transition-all"
            >
              <HugeiconsIcon icon={Tv01Icon} className="h-4 w-4" />
              <span>Live Monitor</span>
            </button>
          )}
        </div>
      </div>

      {/* Validation alert banner for Draft status editable check */}
      {isEditable && validationErrors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl space-y-2 flex gap-3 text-xs leading-relaxed">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Setup Validation Parameters Pending ({validationErrors.length})</h4>
            <ul className="list-disc pl-4 space-y-0.5 text-amber-700 font-medium">
              {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Segmented control tabs */}
      <div className="flex border-b border-slate-200 gap-1 select-none">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Categories list ({election.categories.length})
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'candidates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Candidate Registry
        </button>
      </div>

      {/* Categories View */}
      {activeTab === 'categories' && (
        <div className="space-y-5">
          {/* Add Category Form conditional trigger button */}
          {isEditable && !showAddCategoryForm && (
            <button
              onClick={() => setShowAddCategoryForm(true)}
              className="w-full py-3 border border-dashed border-slate-250 hover:border-blue-500 hover:bg-blue-50/10 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="h-4.5 w-4.5" strokeWidth={2.5} />
              <span>Add Position Category</span>
            </button>
          )}

          {/* Quick Create Category Panel */}
          {showAddCategoryForm && (
            <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-3xs animate-fade-in space-y-4 text-left">
              <h4 className="font-display font-bold text-xs text-slate-800">New Category Parameters</h4>
              <form onSubmit={handleCreateCategory} className="space-y-3.5">
                <div className="grid grid-cols-1 select-all">
                  <label htmlFor="cat-name-input" className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Title</label>
                  <input
                    type="text"
                    id="cat-name-input"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. SRC President"
                    className="mt-1 block w-full px-3 py-1.5 text-xs border border-slate-200 bg-slate-50 rounded-md focus:bg-white focus:border-blue-550 focus:ring-1 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="cat-desc-input" className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Position Mandate Description</label>
                  <textarea
                    id="cat-desc-input"
                    rows={2}
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="What does this role oversee or stand for?"
                    className="mt-1 block w-full px-3 py-1.5 text-xs border border-slate-200 bg-slate-50 rounded-md focus:bg-white focus:border-blue-550 outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end gap-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs cursor-pointer font-semibold"
                  >
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          )}

          {election.categories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              No categories configured for setup. Create your first position category representation above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-text">
              {election.categories.map((cat) => (
                <div key={cat.id} className="border border-slate-200/80 p-5 bg-white rounded-xl shadow-3xs flex flex-col justify-between h-40">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase text-slate-400">ID: {cat.id}</span>
                      {isEditable && (
                        <button
                          onClick={() => removeCategoryFromElection(election.id, cat.id)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-all duration-100 cursor-pointer"
                          title="Delete Category"
                        >
                          <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <h4 className="font-display font-bold text-sm text-slate-900 mt-1">{cat.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1">{cat.description || 'No description designated.'}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Registered Candidates: <strong className="text-slate-700 font-bold">{cat.candidates.length}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Candidates View */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          {election.categories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              Please configure at least one category before assigning candidate registers.
            </div>
          ) : (
            election.categories.map((cat) => {
              const isAddingToThisCat = expandedCategoryIdForCandidate === cat.id;

              return (
                <div key={cat.id} className="border border-slate-250 bg-white p-6 rounded-2xl shadow-3xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-light border-slate-100">
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-slate-900">{cat.name} Candidates</h4>
                      <p className="text-[11px] text-slate-400">Registered applicants representing structural position category</p>
                    </div>

                    {isEditable && !isAddingToThisCat && (
                      <button
                        onClick={() => setExpandedCategoryIdForCandidate(cat.id)}
                        className="py-1.5 px-3 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/10 text-[11px] font-bold rounded-lg text-slate-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <HugeiconsIcon icon={UserAdd01Icon} className="h-3.5 w-3.5" />
                        <span>Register Candidate</span>
                      </button>
                    )}
                  </div>

                  {/* Add Candidate inline Form */}
                  {isEditable && isAddingToThisCat && (
                    <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-4 animate-fade-in text-left">
                      <h5 className="font-display font-semibold text-xs text-slate-800">Add Applicant</h5>
                      <form onSubmit={(e) => handleAddCandidate(e, cat.id)} className="space-y-3.5">
                        <div>
                          <label htmlFor="student-select" className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Pick Student Profile</label>
                          <select
                            id="student-select"
                            required
                            value={selectedCandidateStudentId}
                            onChange={(e) => setSelectedCandidateStudentId(e.target.value)}
                            className="mt-1 block w-full px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-md focus:border-blue-550 outline-none font-sans"
                          >
                            <option value="">-- Choose student roster record --</option>
                            {eligibleStudents.map(student => (
                              <option key={student.studentId} value={student.studentId}>
                                {student.name} ({student.studentId} • {student.email})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="candidate-bio" className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Manifest / Campaign Bio</label>
                          <textarea
                            id="candidate-bio"
                            required
                            rows={2}
                            value={candidateBio}
                            onChange={(e) => setCandidateBio(e.target.value)}
                            placeholder="Provide a short description of goals, platforms or manifest representations..."
                            className="mt-1 block w-full px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-md focus:border-blue-550 outline-none resize-none font-sans"
                          />
                        </div>

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setExpandedCategoryIdForCandidate(null)}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 border rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!selectedCandidateStudentId}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-transparent rounded-md cursor-pointer"
                          >
                            Enlist Candidate
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Registered List */}
                  {cat.candidates.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-100 rounded-xl">
                      No candidates enroled. Register applicants representing this structural category.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cat.candidates.map((cand) => (
                        <div key={cand.id} className="border border-slate-100 p-4 rounded-xl hover:border-slate-200 transition-colors flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h5 className="font-display font-bold text-xs text-slate-900 leading-none">
                              {cand.name}
                            </h5>
                            <span className="block font-mono text-[9px] text-slate-400 mt-1 uppercase">Student ID: {cand.id}</span>
                            <p className="text-xs text-slate-500 font-sans mt-2.5 leading-relaxed pr-6">{cand.bio}</p>
                          </div>

                          {isEditable && (
                            <button
                              onClick={() => removeCandidateFromCategory(election.id, cat.id, cand.id)}
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md shrink-0 transition-colors cursor-pointer"
                              title="Remove Candidate"
                            >
                              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

