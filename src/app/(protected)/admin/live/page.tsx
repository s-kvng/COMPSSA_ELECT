'use client';

import React from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserGroupIcon,
  CheckmarkCircle01Icon,
  Tv01Icon,
  Shield01Icon,
  SparklesIcon,
  HeartbreakIcon,
} from '@hugeicons/core-free-icons';
import StatusBadge from '@/components/StatusBadge';

export default function HodLiveCenterRoute() {
  const { elections, users, voteRecords } = useAuthContext();

  const activeElection = elections.find((e) => e.status === 'Active') || elections[0];

  if (!activeElection) {
    return (
      <div className="py-12 text-center max-w-sm mx-auto px-4 space-y-3 font-sans">
        <HugeiconsIcon icon={HeartbreakIcon} className="h-10 w-10 text-muted-foreground mx-auto" />
        <h3 className="font-sans font-semibold text-foreground text-sm">No Active Elections</h3>
        <p className="text-xs text-muted-foreground">
          There are no live departmental elections currently active to track.
        </p>
      </div>
    );
  }

  const registeredStudentsCount = users.filter(
    (u) => u.role === 'Student' || u.role === 'Candidate'
  ).length;
  const uniqueVoterIds = new Set(
    voteRecords
      .filter((r) => activeElection.categories.some((c) => c.id === r.categoryId))
      .map((r) => r.voterId)
  );
  const votedTurnoutCount = uniqueVoterIds.size;
  const turnoutPercent =
    registeredStudentsCount > 0
      ? Math.round((votedTurnoutCount / registeredStudentsCount) * 100)
      : 0;

  return (
    <div className="space-y-6 font-sans py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-fade-in select-none">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-border">
        <div className="space-y-1">
          <span className="text-[10px] font-mono bg-[#ede9fe] text-[#5b21b6] font-bold px-2.5 py-0.5 rounded-full border border-[#ddd6fe]">
            OVERSIGHT ACCESS
          </span>
          <h2 className="font-sans font-bold text-2xl text-foreground mt-2">Live Dashboard</h2>
          <p className="text-xs text-muted-foreground max-w-md">
            Read-only observer session — you cannot alter parameters, register votes, or edit candidates.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={activeElection.status} />
          <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
            {activeElection.title}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold text-muted-foreground">
            <HugeiconsIcon icon={UserGroupIcon} className="h-4 w-4" />
            Registered Electors
          </div>
          <p className="text-2xl font-mono font-extrabold text-foreground">{registeredStudentsCount}</p>
          <p className="text-[10px] text-muted-foreground">Eligible department voters</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold text-muted-foreground">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-[#10b981]" />
            Voted Ballots
          </div>
          <p className="text-2xl font-mono font-extrabold text-foreground">{votedTurnoutCount}</p>
          <p className="text-[10px] text-muted-foreground">Unique students who voted</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 col-span-2 md:col-span-1 space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold text-muted-foreground">
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={Tv01Icon} className="h-4 w-4 text-primary" />
              Turnout Rate
            </span>
            <span>{turnoutPercent}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${turnoutPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tallies */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-sans font-semibold text-sm text-foreground">Department Position Tallies</h3>
          <span className="text-[10px] font-mono text-muted-foreground animate-pulse">
            ● Live counts stream
          </span>
        </div>

        {activeElection.categories.map((cat) => {
          const sorted = [...cat.candidates].sort((a, b) => b.votes - a.votes);
          const totalVotes = cat.candidates.reduce((a, c) => a + c.votes, 0);

          return (
            <div key={cat.id} className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <div>
                <h4 className="font-sans font-semibold text-sm text-foreground">{cat.name}</h4>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  Running total: {totalVotes} votes
                </p>
              </div>

              <div className="space-y-4 select-text">
                {sorted.map((cand, idx) => {
                  const pct = totalVotes > 0 ? Math.round((cand.votes / totalVotes) * 100) : 0;
                  const isLeader = idx === 0 && cand.votes > 0 && activeElection.status !== 'Active';

                  return (
                    <div key={cand.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-muted-foreground">{idx + 1}.</span>
                          <span className="font-semibold text-foreground">{cand.name}</span>
                          {isLeader && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-extrabold text-[#92400e] bg-[#fef3c7] border border-[#fcd34d] rounded font-mono uppercase leading-none">
                              <HugeiconsIcon icon={SparklesIcon} className="h-2.5 w-2.5" />
                              Leader
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-muted-foreground">
                          <strong className="text-foreground">{cand.votes}</strong> votes ({pct}%)
                        </span>
                      </div>
                      <div className="h-3.5 w-full bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full rounded-md transition-all duration-300"
                          style={{
                            width: `${pct || 1}%`,
                            backgroundColor: isLeader ? '#f59e0b' : 'var(--color-primary)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Read-only notice */}
      <div className="p-4 bg-[#ede9fe]/50 border border-[#ddd6fe] rounded-xl flex gap-3 items-center text-xs text-[#5b21b6]">
        <HugeiconsIcon icon={Shield01Icon} className="h-5 w-5 shrink-0" />
        <span>Certified read-only audit channel. All data is live and cannot be modified from this view.</span>
      </div>
    </div>
  );
}
