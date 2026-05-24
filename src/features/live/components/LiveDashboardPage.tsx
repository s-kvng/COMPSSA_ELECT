/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import StatusBadge from '@/components/StatusBadge';
import {
  ArrowLeft,
  Users,
  CheckCircle,
  FileSpreadsheet,
  Megaphone,
  History,
  Tv,
  Sparkles,
  Lock
} from 'lucide-react';

export default function LiveDashboardPage() {
  const {
    elections,
    users,
    voteRecords,
    actionLog,
    updateElectionStatus,
    addActionLog
  } = useAuthContext();
  const { navigateTo, params } = useNavigation();

  const electId = params.id;
  const election = elections.find(e => e.id === electId);

  if (!election) {
    return (
      <div id="live-detail-error" className="py-12 text-center max-w-sm mx-auto">
        <p className="text-xs text-slate-500">Live tracker record not found.</p>
        <button onClick={() => navigateTo('/admin/elections')} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold">Return</button>
      </div>
    );
  }

  // Calculate stats
  const registeredStudentsCount = users.filter(u => u.role === 'Student' || u.role === 'Candidate').length;
  // Unique voters
  const uniqueVoterIds = new Set(voteRecords.filter(r => election.categories.some(c => c.id === r.categoryId)).map(r => r.voterId));
  const votedTurnoutCount = uniqueVoterIds.size;
  const turnoutPercent = registeredStudentsCount > 0 ? Math.round((votedTurnoutCount / registeredStudentsCount) * 100) : 0;
  const isElectionActive = election.status === 'Active';

  // Handle close manually
  const handleCloseEarly = () => {
    const conf = window.confirm('Are you certain you want to trigger early ballot closure? This locks out any pending voters.');
    if (conf) {
      updateElectionStatus(election.id, 'Closed');
    }
  };

  // Handle Publish results
  const handlePublishResults = () => {
    const conf = window.confirm('Are you ready to PUBLISH the official election counts to the entire COMPSSA department? This makes the results public and cannot be retracted.');
    if (conf) {
      updateElectionStatus(election.id, 'Published');
    }
  };

  // Export CSV Browser Utility
  const handleExportCSV = () => {
    try {
      let csvContent = `COMPSSA ELECTION SYSTEM AUDIT JOURNAL\n`;
      csvContent += `Election Title,${election.title}\n`;
      csvContent += `Status,${election.status}\n`;
      csvContent += `Turnout Rate,${turnoutPercent}% (${votedTurnoutCount} of ${registeredStudentsCount})\n`;
      csvContent += `Export Timestamp,${new Date().toISOString()}\n\n`;

      csvContent += `CATEGORY,CANDIDATE ID,CANDIDATE NAME,VOTES COUNT\n`;

      election.categories.forEach(cat => {
        cat.candidates.forEach(cand => {
          csvContent += `"${cat.name}","${cand.id}","${cand.name}",${cand.votes}\n`;
        });
      });

      csvContent += `\nINDEPENDENT AUDIT VOTING RECORDS LOG\n`;
      csvContent += `Timestamp,Voter Pseudonym Record ID,Category ID,Candidate ID Selected\n`;
      voteRecords.forEach(r => {
        // Hash / disguise voterId slightly to preserve secrecy in published sheets
        const maskedVoter = `VTR_${r.voterId.replace(/[^0-9]/g, '') || '999'}`;
        csvContent += `"${r.timestamp}","${maskedVoter}","${r.categoryId}","${r.candidateId}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `COMPSSA_Election_${election.id}_Audit_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addActionLog('Exported certified audit log spreadsheets.');
    } catch (e) {
      console.error('CSV generation failure', e);
    }
  };

  return (
    <div id="live-dashboard" className="space-y-6 font-sans py-4 animate-fade-in select-none">
      {/* Top breadcrumb header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('/admin/elections')}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="space-y-1">
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-150">MISSION CONTROL</span>
            <h3 className="font-display font-extrabold text-lg text-slate-900 mt-1">{election.title}</h3>
          </div>
        </div>

        {/* Dynamic CTAs */}
        <div className="flex gap-2.5 shrink-0">
          {election.status === 'Active' && (
            <button
              onClick={handleCloseEarly}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Lock className="h-4 w-4" />
              <span>Close Election Early</span>
            </button>
          )}

          {election.status === 'Closed' && (
            <button
              onClick={handlePublishResults}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Megaphone className="h-4 w-4 animate-bounce" />
              <span>Publish Public Results Board</span>
            </button>
          )}

          {['Closed', 'Published'].includes(election.status) && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-xs font-semibold text-emerald-850 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export Audit Ledger (CSV)</span>
            </button>
          )}

          {election.status === 'Published' && (
            <button
              onClick={() => navigateTo(`/results/${election.id}`)}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-250 rounded-lg hover:bg-slate-50"
            >
              View Public Page →
            </button>
          )}
        </div>
      </div>

      {/* Stats counters row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-5 shadow-3xs space-y-1 text-left">
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold text-slate-400">
            <Users className="h-4 w-4 text-slate-400" />
            <span>Eligible Board</span>
          </div>
          <p className="text-2xl font-mono font-extrabold text-slate-900">{registeredStudentsCount}</p>
          <p className="text-[10px] text-slate-400">Registered department electors</p>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-3xs space-y-1 text-left">
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold text-slate-400">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>Ballots Sealed</span>
          </div>
          <p className="text-2xl font-mono font-extrabold text-slate-900">{votedTurnoutCount}</p>
          <p className="text-[10px] text-slate-400">Unique students who voted</p>
        </div>

        <div className="bg-white border rounded-xl p-5 col-span-2 md:col-span-1 shadow-3xs space-y-2 text-left bg-linear-to-b from-white to-slate-50/20">
          <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold text-slate-400">
            <span className="flex items-center gap-2">
              <Tv className="h-4 w-4 text-blue-500" />
              <span>Live Response Rate</span>
            </span>
            <span>{turnoutPercent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-350" style={{ width: `${turnoutPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Category Results Panels */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-sm text-slate-800">Position Tally Arrays</h3>
          <span className="text-[10px] font-mono text-slate-400 animate-pulse">● Autoupdates live</span>
        </div>

        {election.categories.map((cat) => {
          // Sort candidates to identify leader/winner
          const candidatesSorted = [...cat.candidates].sort((a, b) => b.votes - a.votes);
          const totalCatVotes = cat.candidates.reduce((acc, current) => acc + current.votes, 0);

          return (
            <div key={cat.id} className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-3xs space-y-4">
              <div>
                <h4 className="font-display font-bold text-sm text-slate-950">{cat.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Total votes cast: {totalCatVotes}</p>
              </div>

              <div className="space-y-4 select-text">
                {candidatesSorted.map((cand, idx) => {
                  const pct = totalCatVotes > 0 ? Math.round((cand.votes / totalCatVotes) * 100) : 0;
                  const isLeader = idx === 0 && cand.votes > 0 && !isElectionActive;

                  return (
                    <div key={cand.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-400">{idx + 1}.</span>
                          <span className="font-semibold text-slate-900">{cand.name}</span>
                          {isLeader && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-250 rounded font-mono uppercase leading-none">
                              <Sparkles className="h-2.5 w-2.5" />
                              Leader
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-slate-500">
                          <strong className="text-slate-800 font-bold">{cand.votes}</strong> votes ({pct}%)
                        </div>
                      </div>

                      {/* Bar fill visual */}
                      <div className="h-3.5 w-full bg-slate-100 rounded-md overflow-hidden relative border border-slate-50">
                        <div
                          className={`h-full rounded-md transition-all duration-300 ${isLeader ? 'bg-amber-500' : 'bg-blue-600'}`}
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

      {/* Operations Event Logger */}
      <div className="border rounded-2xl p-5 bg-white space-y-4 select-text">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <History className="h-4.5 w-4.5 text-slate-500" />
          <h4 className="font-display font-bold text-xs text-slate-850">EC Administrative Action Logs</h4>
        </div>

        <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
          {actionLog.map((log) => (
            <div key={log.id} className="flex justify-between items-start text-xs text-slate-600 border-b border-slate-50 pb-2 last:border-b-0 last:pb-0">
              <span className="leading-relaxed font-sans">{log.action}</span>
              <span className="font-mono text-[9px] text-slate-400 shrink-0 uppercase pl-4">{log.timestamp.replace('T', ' ').slice(11, 16)} UTC</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

