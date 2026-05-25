'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  UserGroupIcon,
  CheckmarkCircle01Icon,
  FileSpreadsheetIcon,
  Megaphone01Icon,
  Time01Icon,
  Tv01Icon,
  SparklesIcon,
  LockIcon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons';

export default function LiveDashboardPage() {
  const { elections, users, voteRecords, actionLog, updateElectionStatus, addActionLog } =
    useAuthContext();
  const { navigateTo, params } = useNavigation();

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const electId = params.id;
  const election = elections.find((e) => e.id === electId);

  if (!election) {
    return (
      <div className="py-12 text-center max-w-sm mx-auto px-4 space-y-4">
        <p className="text-xs text-muted-foreground">Live tracker record not found.</p>
        <button
          onClick={() => navigateTo('/admin/elections')}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium"
        >
          Return
        </button>
      </div>
    );
  }

  const registeredStudentsCount = users.filter(
    (u) => u.role === 'Student' || u.role === 'Candidate'
  ).length;
  const uniqueVoterIds = new Set(
    voteRecords
      .filter((r) => election.categories.some((c) => c.id === r.categoryId))
      .map((r) => r.voterId)
  );
  const votedTurnoutCount = uniqueVoterIds.size;
  const turnoutPercent =
    registeredStudentsCount > 0
      ? Math.round((votedTurnoutCount / registeredStudentsCount) * 100)
      : 0;
  const isElectionActive = election.status === 'Active';

  const handleCloseEarly = () => {
    updateElectionStatus(election.id, 'Closed');
    setShowCloseConfirm(false);
  };

  const handlePublishResults = () => {
    updateElectionStatus(election.id, 'Published');
    setShowPublishConfirm(false);
  };

  const handleExportCSV = () => {
    try {
      let csvContent = `COMPSSA ELECTION SYSTEM AUDIT JOURNAL\n`;
      csvContent += `Election Title,${election.title}\n`;
      csvContent += `Status,${election.status}\n`;
      csvContent += `Turnout Rate,${turnoutPercent}% (${votedTurnoutCount} of ${registeredStudentsCount})\n`;
      csvContent += `Export Timestamp,${new Date().toISOString()}\n\n`;
      csvContent += `CATEGORY,CANDIDATE ID,CANDIDATE NAME,VOTES COUNT\n`;
      election.categories.forEach((cat) => {
        cat.candidates.forEach((cand) => {
          csvContent += `"${cat.name}","${cand.id}","${cand.name}",${cand.votes}\n`;
        });
      });
      csvContent += `\nINDEPENDENT AUDIT VOTING RECORDS LOG\n`;
      csvContent += `Timestamp,Voter Pseudonym Record ID,Category ID,Candidate ID Selected\n`;
      voteRecords.forEach((r) => {
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
    <div className="space-y-6 font-sans py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-fade-in select-none">

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
            <span className="text-[10px] font-mono bg-primary/8 text-primary font-bold px-2.5 py-0.5 rounded-full border border-primary/20">
              MISSION CONTROL
            </span>
            <h3 className="font-sans font-bold text-lg text-foreground mt-1">{election.title}</h3>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 flex-wrap">
          {election.status === 'Active' && (
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="px-4 py-2 text-xs font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <HugeiconsIcon icon={LockIcon} className="h-3.5 w-3.5" />
              Close Election Early
            </button>
          )}

          {election.status === 'Closed' && (
            <button
              onClick={() => setShowPublishConfirm(true)}
              className="px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              style={{ backgroundColor: 'var(--status-published)' }}
            >
              <HugeiconsIcon icon={Megaphone01Icon} className="h-3.5 w-3.5 animate-bounce" />
              Publish Results
            </button>
          )}

          {['Closed', 'Published'].includes(election.status) && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-xs font-semibold text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <HugeiconsIcon icon={FileSpreadsheetIcon} className="h-3.5 w-3.5" />
              Export Audit CSV
            </button>
          )}

          {election.status === 'Published' && (
            <button
              onClick={() => navigateTo(`/results/${election.id}`)}
              className="px-4 py-2 text-xs font-semibold text-foreground bg-card border border-border rounded-xl hover:bg-muted transition-all"
            >
              View Public Page →
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold text-muted-foreground">
            <HugeiconsIcon icon={UserGroupIcon} className="h-4 w-4" />
            Eligible Board
          </div>
          <p className="text-2xl font-mono font-extrabold text-foreground">{registeredStudentsCount}</p>
          <p className="text-[10px] text-muted-foreground">Registered department electors</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold text-muted-foreground">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-[#10b981]" />
            Ballots Sealed
          </div>
          <p className="text-2xl font-mono font-extrabold text-foreground">{votedTurnoutCount}</p>
          <p className="text-[10px] text-muted-foreground">Unique students who voted</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 col-span-2 md:col-span-1 space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold text-muted-foreground">
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={Tv01Icon} className="h-4 w-4 text-primary" />
              Live Response Rate
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

      {/* Position tallies */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-sans font-semibold text-sm text-foreground">Position Tally Arrays</h3>
          <span className="text-[10px] font-mono text-muted-foreground animate-pulse">
            ● Autoupdates live
          </span>
        </div>

        {election.categories.map((cat) => {
          const candidatesSorted = [...cat.candidates].sort((a, b) => b.votes - a.votes);
          const totalCatVotes = cat.candidates.reduce((acc, c) => acc + c.votes, 0);

          return (
            <div key={cat.id} className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <div>
                <h4 className="font-sans font-bold text-sm text-foreground">{cat.name}</h4>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  Total votes cast: {totalCatVotes}
                </p>
              </div>

              <div className="space-y-4 select-text">
                {candidatesSorted.map((cand, idx) => {
                  const pct = totalCatVotes > 0 ? Math.round((cand.votes / totalCatVotes) * 100) : 0;
                  const isLeader = idx === 0 && cand.votes > 0 && !isElectionActive;

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
                        <div className="font-mono text-muted-foreground">
                          <strong className="text-foreground">{cand.votes}</strong> votes ({pct}%)
                        </div>
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

      {/* Action log */}
      <div className="border border-border rounded-2xl p-5 bg-card space-y-4 select-text">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <HugeiconsIcon icon={Time01Icon} className="h-4.5 w-4.5 text-muted-foreground" />
          <h4 className="font-sans font-bold text-xs text-foreground">EC Administrative Action Log</h4>
        </div>
        <div className="space-y-3 max-h-40 overflow-y-auto no-scrollbar">
          {actionLog.map((log) => (
            <div
              key={log.id}
              className="flex justify-between items-start text-xs text-foreground/80 border-b border-border/50 pb-2 last:border-b-0 last:pb-0"
            >
              <span className="leading-relaxed font-sans">{log.action}</span>
              <span className="font-mono text-[9px] text-muted-foreground shrink-0 uppercase pl-4">
                {log.timestamp.replace('T', ' ').slice(11, 16)} UTC
              </span>
            </div>
          ))}
        </div>
      </div>

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
                  This will immediately lock out all pending voters for{' '}
                  <strong className="text-foreground">{election.title}</strong>. This action cannot be undone.
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
                onClick={handleCloseEarly}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-xl transition-all"
              >
                Close Election
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Publish results confirmation modal */}
      {showPublishConfirm && isMounted && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'color-mix(in oklch, var(--status-published) 15%, transparent)' }}>
                <HugeiconsIcon icon={Megaphone01Icon} className="h-5 w-5" style={{ color: 'var(--status-published)' }} />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-foreground">Publish results?</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  The official results for{' '}
                  <strong className="text-foreground">{election.title}</strong> will be made
                  public to the entire COMPSSA department. This cannot be retracted.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground border border-border rounded-xl hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishResults}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
                style={{ backgroundColor: 'var(--status-published)' }}
              >
                Publish Now
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
