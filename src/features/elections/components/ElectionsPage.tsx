/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState } from 'react';
import { useIsMounted } from '@/hooks/useIsMounted';
import { createPortal } from 'react-dom';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import StatusBadge from '@/components/StatusBadge';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Calendar01Icon, Settings01Icon, EyeIcon } from '@hugeicons/core-free-icons';

export default function ElectionsPage() {
  const { elections, createElection } = useAuthContext();
  const { navigateTo } = useNavigation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('2026-05-23T08:00');
  const [endDate, setEndDate] = useState('2026-05-25T18:00');
  const isMounted = useIsMounted();

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
    <div className="space-y-6 font-sans py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-fade-in select-none">
      {/* Header */}
      <div className="flex justify-between items-center pb-5 border-b border-border">
        <div className="space-y-1">
          <h2 className="font-sans font-bold text-2xl text-foreground">Elections Center</h2>
          <p className="text-xs text-muted-foreground">Configure categories, register candidates and observe live balloting.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4" strokeWidth={2.5} />
          New Election
        </button>
      </div>

      {/* Elections list */}
      <div className="grid grid-cols-1 gap-3">
        {elections.length === 0 ? (
          <div className="text-center py-14 bg-card rounded-xl border border-dashed border-border">
            <p className="text-xs text-muted-foreground">No elections registered. Create one above.</p>
          </div>
        ) : (
          elections.map((elect) => (
            <div
              key={elect.id}
              className="bg-card border border-border p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-primary/30 transition-colors"
            >
              <div className="space-y-3 max-w-xl min-w-0">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={elect.status} />
                    <span className="text-[10px] font-mono text-muted-foreground/60">ID: {elect.id}</span>
                  </div>
                  <h3 className="font-sans font-bold text-base text-foreground">{elect.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{elect.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={Calendar01Icon} className="h-3.5 w-3.5" />
                    Starts: {elect.startDate.replace('T', ' ').slice(0, 16)}
                  </span>
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={Calendar01Icon} className="h-3.5 w-3.5" />
                    Ends: {elect.endDate.replace('T', ' ').slice(0, 16)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigateTo(`/admin/elections/${elect.id}`)}
                  className="px-4 py-2 text-xs font-semibold text-foreground bg-card hover:bg-muted border border-border rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <HugeiconsIcon icon={Settings01Icon} className="h-3.5 w-3.5 text-muted-foreground" />
                  Setup Panel
                </button>
                {['Active', 'Closed', 'Published'].includes(elect.status) && (
                  <button
                    onClick={() => navigateTo(`/admin/elections/${elect.id}/live`)}
                    className="px-4 py-2 text-xs font-semibold text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <HugeiconsIcon icon={EyeIcon} className="h-3.5 w-3.5" />
                    Live Tracker
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create election modal — portal so it covers the full viewport */}
      {showCreateModal && isMounted && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="font-sans font-bold text-base text-foreground">Configure New Election</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Creates a Draft — you can add categories and candidates before going live.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-muted-foreground mb-1">
                  Election Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. COMPSSA General Elections 2026"
                  className="block w-full px-3 py-2 text-xs border border-border bg-input rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide parameters and criteria details..."
                  className="block w-full px-3 py-2 text-xs border border-border bg-input rounded-lg focus:border-primary outline-none resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-muted-foreground mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full px-2 py-2 text-xs border border-border bg-input rounded-lg outline-none font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-muted-foreground mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full px-2 py-2 text-xs border border-border bg-input rounded-lg outline-none font-sans"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-foreground border border-border rounded-xl hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-all"
                >
                  Create Election
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
