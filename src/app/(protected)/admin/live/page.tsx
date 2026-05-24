/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import { useAuthContext } from '../../../../features/auth/mockAuth';
import StatusBadge from '../../../../components/StatusBadge';
import { Award, Clock, Activity, ShieldCheck, HeartCrack } from 'lucide-react';

export default function HodLiveCenterRoute() {
  const { elections, users, voteRecords } = useAuthContext();

  const activeElection = elections.find(e => e.status === 'Active') || elections[0];

  if (!activeElection) {
    return (
      <div id="hod-no-elect-screen" className="py-12 text-center max-w-sm mx-auto space-y-4 font-sans">
        <HeartCrack className="h-10 w-10 text-slate-400 mx-auto" />
        <h3 className="font-display font-semibold text-slate-900 text-sm">No Active Elections Cataloged</h3>
        <p className="text-xs text-slate-500">There are no live departmental elections currently active to track.</p>
      </div>
    );
  }

  // Calculate generic stats
  const registeredStudentsCount = users.filter(u => u.role === 'Student' || u.role === 'Candidate').length;
  // Unique voters
  const uniqueVoterIds = new Set(voteRecords.filter(r => activeElection.categories.some(c => c.id === r.categoryId)).map(r => r.voterId));
  const votedTurnoutCount = uniqueVoterIds.size;
  const turnoutPercent = registeredStudentsCount > 0 ? Math.round((votedTurnoutCount / registeredStudentsCount) * 100) : 0;

  return (
    <div id="hod-live-viewport" className="space-y-6 font-sans py-4 animate-fade-in select-none text-left">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <span className="text-[10px] font-mono bg-purple-50 text-purple-700 font-bold px-2.5 py-0.5 rounded-full border border-purple-150">
          OVERSIGHT ACCESS
        </span>
        <h2 className="font-display font-extrabold text-2xl text-slate-900 mt-2">HOD Read-only Live Dashboard</h2>
        <p className="text-xs text-slate-500">Authorized legitimacy observer session. You cannot alter parameters, register votes or edit candidats.</p>
      </div>

      {/* Top Banner stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border p-5 rounded-xl shadow-3xs space-y-1">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Registered Electors</span>
          <p className="text-2xl font-mono font-extrabold text-slate-900">{registeredStudentsCount}</p>
        </div>
        <div className="bg-white border p-5 rounded-xl shadow-3xs space-y-1">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Voted Ballots</span>
          <p className="text-2xl font-mono font-extrabold text-slate-800">{votedTurnoutCount}</p>
        </div>
        <div className="bg-white border p-5 col-span-2 md:col-span-1 rounded-xl shadow-3xs space-y-2">
          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400 uppercase">
            <span>Turnout Percent</span>
            <span>{turnoutPercent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${turnoutPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Categories blocks */}
      <div className="space-y-5">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-display font-bold text-sm text-slate-800">Department Position Tallies</h3>
          <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3 animate-spin" />
            Live counts stream
          </span>
        </div>

        {activeElection.categories.map((cat) => {
          const sorted = [...cat.candidates].sort((a,b) => b.votes - a.votes);
          const totalVotes = cat.candidates.reduce((a,c) => a + c.votes, 0);

          return (
            <div key={cat.id} className="bg-white border p-6 rounded-2xl shadow-3xs space-y-4">
              <div>
                <h4 className="font-display font-semibold text-slate-900 text-sm">{cat.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono">Running category sum: {totalVotes} votes</p>
              </div>

              <div className="space-y-3.5 select-text">
                {sorted.map((cand, idx) => {
                  const pct = totalVotes > 0 ? Math.round((cand.votes / totalVotes) * 100) : 0;
                  const isLeader = idx === 0 && cand.votes > 0 && activeElection.status !== 'Active';

                  return (
                    <div key={cand.id} className="space-y-1">
                      <div className="flex justify-between text-xs items-center font-medium">
                        <span className="text-slate-700">{cand.name}</span>
                        <span className="font-mono text-slate-500">{cand.votes} votes ({pct}%)</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-md overflow-hidden relative">
                        <div
                          className={`h-full rounded-md ${isLeader ? 'bg-amber-500' : 'bg-blue-600'}`}
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

      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex gap-2.5 items-center text-xs text-slate-600">
        <ShieldCheck className="h-5 w-5 text-purple-600 shrink-0" />
        <span>Certified read-only audit channel. All outputs are encrypted and verified safe.</span>
      </div>
    </div>
  );
}
