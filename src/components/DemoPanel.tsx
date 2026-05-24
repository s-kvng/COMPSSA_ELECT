/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import { Sliders, RefreshCw, Sparkles, Shuffle, ShieldAlert, X } from 'lucide-react';

export default function DemoPanel() {
  const {
    currentUser,
    setMockRole,
    resetDatabase,
    users,
    elections,
    voteRecords,
    registerVote,
    addActionLog
  } = useAuthContext();
  const { path } = useNavigation();

  const [isOpen, setIsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fast voting simulation helper
  const handleTriggerSimulatedVotes = () => {
    if (!isMounted) return;
    setIsSimulating(true);
    addActionLog('Triggered automated high-volume demo voting loop.');

    const activeElection = elections.find(e => e.status === 'Active');
    if (!activeElection) {
      alert('Simulation constraint: There must be an "Active" election running to simulate student choices.');
      setIsSimulating(false);
      return;
    }

    const eligibleVoters = users.filter(u => u.role === 'Student' && u.firstLoginPending);
    if (eligibleVoters.length === 0) {
      alert('No pending student voters left to cast ballots.');
      setIsSimulating(false);
      return;
    }

    let voteAddedCount = 0;
    eligibleVoters.forEach((voter) => {
      activeElection.categories.forEach((cat) => {
        const alreadyCast = voteRecords.some(r => r.voterId === voter.id && r.categoryId === cat.id);
        if (!alreadyCast && cat.candidates.length > 0) {
          const randomCandidate = cat.candidates[Math.floor(Math.random() * cat.candidates.length)];
          
          setTimeout(() => {
            registerVote(cat.id, randomCandidate.id);
          }, Math.random() * 500);

          voteAddedCount++;
        }
      });
    });

    setTimeout(() => {
      setIsSimulating(false);
      alert(`Simulation completed: Seeded ${voteAddedCount} realistic candidate votes across pending categories! Check out Live results boards now.`);
    }, 1200);
  };

  const activeElection = elections.find(e => e.status === 'Active' || e.status === 'Closed' || e.status === 'Ready');

  return (
    <div id="demo-controls-wrapper" className="fixed bottom-4 right-4 z-50 font-sans select-none print:hidden">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 border border-slate-750 text-white p-3 rounded-full hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group cursor-pointer"
        >
          <Sliders className="h-5 w-5 stroke-2 text-blue-400 group-hover:rotate-45 transition-transform" />
          <span className="text-xs font-bold font-display pr-1 hidden sm:inline">Inspect Demo Engine</span>
          {isSimulating && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </button>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-76 text-slate-300 shadow-2xl animate-fade-in space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <h4 className="font-display font-black text-xs text-white uppercase tracking-wider">Demo Control Board</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Status summaries */}
            <div className="space-y-1 font-mono text-[10px] bg-slate-950 p-2.5 border border-slate-800 rounded-lg text-slate-400">
              <p>Active User: <span className="text-white font-bold">{currentUser ? currentUser.name : 'Unauthenticated'}</span></p>
              <p>User Role: <span className="text-blue-405 font-bold">{currentUser ? currentUser.role : 'None'}</span></p>
              <p>Client Path: <span className="text-slate-205">{path}</span></p>
              <p>Election State: <span className="text-emerald-400">{activeElection ? activeElection.status : 'None'}</span></p>
            </div>

            {/* Quick Role Selectors */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500">Fast-Login Role Swapper</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Student', 'Candidate', 'EC', 'HOD'] as const).map((role) => {
                  const isActive = currentUser?.role === role;
                  return (
                    <button
                      key={role}
                      onClick={() => setMockRole(role)}
                      className={`px-2.5 py-1.5 text-[10px] font-bold rounded-md border text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-350 border-slate-750 hover:text-white'
                      }`}
                    >
                      {role === 'EC' ? 'Admin Official' : role === 'HOD' ? 'Oversight (HOD)' : role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated tools actions */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase text-slate-500">Live Simulation Tools</span>
              
              <button
                disabled={isSimulating}
                onClick={handleTriggerSimulatedVotes}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg border border-blue-800 text-[11px] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Shuffle className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin text-amber-400' : 'text-blue-300'}`} />
                <span>{isSimulating ? 'Injecting Ballots...' : 'Simulate Voter Actions'}</span>
              </button>

              <button
                onClick={resetDatabase}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-red-400 hover:text-red-300 font-semibold rounded-lg border border-slate-750 text-[10px] transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset Database Defaults</span>
              </button>
            </div>
            
            <p className="text-[9px] text-slate-500 leading-normal text-center bg-slate-950/40 p-1.5 border border-slate-850 rounded">
              Use "Simulate Voter Actions" to trigger mock students submitting votes, then log in as <strong>EC</strong> or <strong>HOD</strong> to watch tallies jump live!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

