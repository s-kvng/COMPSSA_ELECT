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
import { SlidersHorizontalIcon, PlusSignIcon, Calendar01Icon, Settings01Icon, PlayIcon, EyeIcon } from '@hugeicons/core-free-icons';

export default function ElectionsPage() {
  const { elections, createElection } = useAuthContext();
  const { navigateTo } = useNavigation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('2026-05-23T08:00');
  const [endDate, setEndDate] = useState('2026-05-25T18:00');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // Convert local datetime-local value to ISO string format before saving
    createElection(
      title,
      description,
      new Date(startDate).toISOString(),
      new Date(endDate).toISOString()
    );

    // Reset forms
    setTitle('');
    setDescription('');
    setShowCreateModal(false);
  };

  return (
    <div id="elections-page" className="space-y-6 font-sans py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-fade-in relative select-none">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <h2 className="font-display font-extrabold text-2xl text-slate-900">Elections Center</h2>
          <p className="text-xs text-slate-500">Configure COMPSSA structural categories, list candidates and observe live balloting events.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4" strokeWidth={2.5} />
          <span>New Election</span>
        </button>
      </div>

      {/* Elections grid container */}
      <div className="grid grid-cols-1 gap-4">
        {elections.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-400">No elections registered. Create one using the button above.</p>
          </div>
        ) : (
          elections.map((elect) => (
            <div
              key={elect.id}
              className="bg-white border border-slate-250/70 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-3xs hover:border-slate-350 transition-colors"
            >
              <div className="space-y-4 max-w-xl">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={elect.status} />
                    <span className="text-[10px] font-mono text-slate-400">ID: {elect.id}</span>
                  </div>
                  <h3 className="font-display font-bold text-base text-slate-900">{elect.title}</h3>
                  <p className="text-xs text-slate-500 leading-normal line-clamp-2">{elect.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500 font-semibold mt-1">
                  <div className="flex items-center gap-1">
                    <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-400" />
                    <span>Starts: {elect.startDate.replace('T', ' ').slice(0, 16)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-400" />
                    <span>Ends: {elect.endDate.replace('T', ' ').slice(0, 16)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons right col */}
              <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
                <button
                  onClick={() => navigateTo(`/admin/elections/${elect.id}`)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <HugeiconsIcon icon={Settings01Icon} className="h-4 w-4 text-slate-400" />
                  <span>Setup Panel</span>
                </button>

                {['Active', 'Closed', 'Published'].includes(elect.status) && (
                  <button
                    onClick={() => navigateTo(`/admin/elections/${elect.id}/live`)}
                    className="px-4 py-2 text-xs font-semibold text-blue-750 bg-blue-50 hover:bg-blue-100 border border-blue-200/50 rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    <HugeiconsIcon icon={EyeIcon} className="h-4 w-4" />
                    <span>Live Tracker</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dynamic Modal Sheet for creation */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl text-left">
            <h3 className="font-display font-extrabold text-base text-slate-900">Configure New Election Group</h3>
            <p className="text-xs text-slate-500 mt-1">Initial setup creates a Draft environment where you can establish official categories and register candidates.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="modal-title" className="block text-xs font-semibold text-slate-700">Election Title</label>
                <input
                  type="text"
                  id="modal-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. COMPSSA General Elections 2026"
                  className="mt-1.5 block w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-desc" className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  id="modal-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide parameters and criteria details..."
                  className="mt-1.5 block w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start-date" className="block text-xs font-semibold text-slate-700">Start Time</label>
                  <input
                    type="datetime-local"
                    id="start-date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1.5 block w-full px-2 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-md focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-xs font-semibold text-slate-700">End Time</label>
                  <input
                    type="datetime-local"
                    id="end-date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1.5 block w-full px-2 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-md focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 border border-slate-200 rounded-md transition-all outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-all outline-none cursor-pointer"
                >
                  Create Election Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
