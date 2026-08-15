'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import { useIsMounted } from '@/hooks/useIsMounted';
import { createPortal } from 'react-dom';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
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

const ACTION_LABELS: Record<string, string> = {
  early_close: 'Voting closed early by EC',
  publish: 'Results published by EC',
  activate: 'Election activated',
  mark_ready: 'Election marked ready',
};

export default function LiveDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const isMounted = useIsMounted();

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [actionError, setActionError] = useState('');

  const electionId = params.id as Id<'elections'>;

  const election = useQuery(api.elections.getElection, { electionId });
  const results = useQuery(api.results.electionResults, { electionId });
  const turnout = useQuery(api.ec_actions.getVoterTurnout, { electionId });
  const electorBase = useQuery(api.ec_actions.getElectorBase, {});
  const ecActions = useQuery(api.ec_actions.getRecentEcActions, { electionId });
  const auditLog = useQuery(
    api.ec_actions.auditLogExport,
    election && ['closed', 'published'].includes(election.status) ? { electionId } : 'skip',
  );

  const earlyClose = useMutation(api.ec_actions.earlyClose);
  const publishElection = useMutation(api.ec_actions.publishElection);

  if (election === undefined) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="h-6 w-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="py-12 text-center max-w-sm mx-auto px-4 space-y-4">
        <p className="text-xs text-muted-foreground">Live tracker record not found.</p>
        <button
          onClick={() => router.push('/admin/elections')}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium"
        >
          Return
        </button>
      </div>
    );
  }

  const uniqueVoters = turnout?.uniqueVoters ?? 0;
  const registeredCount = electorBase?.registeredCount ?? 0;
  const turnoutPercent = registeredCount > 0 ? Math.round((uniqueVoters / registeredCount) * 100) : 0;
  const resultCategories = results?.status === 'ok' ? results.categories : [];

  const handleCloseEarly = async () => {
    setIsClosing(true);
    setActionError('');
    try {
      await earlyClose({ electionId });
      setShowCloseConfirm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to close election.');
    } finally {
      setIsClosing(false);
    }
  };

  const handlePublishResults = async () => {
    setIsPublishing(true);
    setActionError('');
    try {
      await publishElection({ electionId });
      setShowPublishConfirm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to publish results.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExportCSV = () => {
    try {
      let csv = `KTU COMPSSA ELECTION SYSTEM AUDIT JOURNAL\n`;
      csv += `Election Title,${election.title}\n`;
      csv += `Status,${election.status}\n`;
      csv += `Turnout Rate,${turnoutPercent}% (${uniqueVoters} of ${registeredCount})\n`;
      csv += `Export Timestamp,${new Date().toISOString()}\n\n`;
      csv += `CATEGORY,CANDIDATE ID,CANDIDATE NAME,VOTE COUNT\n`;
      resultCategories.forEach((cat) => {
        [...cat.candidates]
          .sort((a, b) => b.count - a.count)
          .forEach((cand) => {
            csv += `"${cat.name}","${cand._id}","${cand.userName}",${cand.count}\n`;
          });
      });
      if (auditLog?.length) {
        csv += `\nANONYMISED VOTER AUDIT LOG\n`;
        csv += `Timestamp,Voter Pseudonym,Category ID\n`;
        auditLog.forEach((r) => {
          const masked = `VTR_${String(r.studentId).slice(-6)}`;
          csv += `"${new Date(r.timestamp).toISOString()}","${masked}","${r.categoryId}"\n`;
        });
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KTU_COMPSSA_Election_Audit_${electionId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('CSV export failed', e);
    }
  };

  return (
    <div className="space-y-6 font-sans py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-fade-in select-none">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/elections')}
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
          {election.status === 'active' && (
            <button
              onClick={() => setShowCloseConfirm(true)}
              className="px-4 py-2 text-xs font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <HugeiconsIcon icon={LockIcon} className="h-3.5 w-3.5" />
              Close Election Early
            </button>
          )}

          {election.status === 'closed' && (
            <button
              onClick={() => setShowPublishConfirm(true)}
              className="px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              style={{ backgroundColor: 'var(--status-published)' }}
            >
              <HugeiconsIcon icon={Megaphone01Icon} className="h-3.5 w-3.5 animate-bounce" />
              Publish Results
            </button>
          )}

          {['closed', 'published'].includes(election.status) && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-xs font-semibold text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <HugeiconsIcon icon={FileSpreadsheetIcon} className="h-3.5 w-3.5" />
              Export Audit CSV
            </button>
          )}

          {election.status === 'published' && (
            <button
              onClick={() => router.push(`/results/${electionId}`)}
              className="px-4 py-2 text-xs font-semibold text-foreground bg-card border border-border rounded-xl hover:bg-muted transition-all"
            >
              View Public Page →
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">{actionError}</div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold text-muted-foreground">
            <HugeiconsIcon icon={UserGroupIcon} className="h-4 w-4" />
            Eligible Board
          </div>
          <p className="text-2xl font-mono font-extrabold text-foreground">{registeredCount}</p>
          <p className="text-[10px] text-muted-foreground">Verified department electors</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-bold text-muted-foreground">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-[#10b981]" />
            Ballots Sealed
          </div>
          <p className="text-2xl font-mono font-extrabold text-foreground">{uniqueVoters}</p>
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
          <span className="text-[10px] font-mono text-muted-foreground animate-pulse">● Autoupdates live</span>
        </div>

        {resultCategories.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
            <p className="text-xs text-muted-foreground">
              {results === undefined ? 'Loading results…' : 'No tally data available yet.'}
            </p>
          </div>
        ) : (
          resultCategories.map((cat) => {
            const sorted = [...cat.candidates].sort((a, b) => b.count - a.count);
            const totalCatVotes = cat.candidates.reduce((acc, c) => acc + c.count, 0);

            return (
              <div key={cat._id} className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <div>
                  <h4 className="font-sans font-bold text-sm text-foreground">{cat.name}</h4>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    Total votes cast: {totalCatVotes}
                  </p>
                </div>

                <div className="space-y-4 select-text">
                  {sorted.map((cand, idx) => {
                    const pct = totalCatVotes > 0 ? Math.round((cand.count / totalCatVotes) * 100) : 0;
                    const isLeader = idx === 0 && cand.count > 0 && election.status !== 'active';

                    return (
                      <div key={cand._id} className="space-y-1.5">
                        <div className="flex justify-between text-xs items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-muted-foreground">{idx + 1}.</span>
                            <span className="font-semibold text-foreground">{cand.userName}</span>
                            {isLeader && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-extrabold text-[#92400e] bg-[#fef3c7] border border-[#fcd34d] rounded font-mono uppercase leading-none">
                                <HugeiconsIcon icon={SparklesIcon} className="h-2.5 w-2.5" />
                                Leader
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-muted-foreground">
                            <strong className="text-foreground">{cand.count}</strong> votes ({pct}%)
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
          })
        )}
      </div>

      {/* Action log */}
      <div className="border border-border rounded-2xl p-5 bg-card space-y-4 select-text">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <HugeiconsIcon icon={Time01Icon} className="h-4.5 w-4.5 text-muted-foreground" />
          <h4 className="font-sans font-bold text-xs text-foreground">EC Administrative Action Log</h4>
        </div>
        <div className="space-y-3 max-h-40 overflow-y-auto no-scrollbar">
          {!ecActions || ecActions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No actions recorded.</p>
          ) : (
            ecActions.map((log) => (
              <div
                key={log._id}
                className="flex justify-between items-start text-xs text-foreground/80 border-b border-border/50 pb-2 last:border-b-0 last:pb-0"
              >
                <span className="leading-relaxed font-sans">
                  {ACTION_LABELS[log.action] ?? log.action}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground shrink-0 uppercase pl-4">
                  {new Date(log.timestamp).toISOString().replace('T', ' ').slice(11, 16)} UTC
                </span>
              </div>
            ))
          )}
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
            {actionError && <p className="text-xs text-red-600">{actionError}</p>}
            <div className="flex gap-2">
              <button
                disabled={isClosing}
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground border border-border rounded-xl hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isClosing}
                onClick={handleCloseEarly}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-xl transition-all disabled:opacity-60"
              >
                {isClosing ? 'Closing…' : 'Close Election'}
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
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'color-mix(in oklch, var(--status-published) 15%, transparent)' }}
              >
                <HugeiconsIcon icon={Megaphone01Icon} className="h-5 w-5" style={{ color: 'var(--status-published)' }} />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-foreground">Publish results?</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  The official results for{' '}
                  <strong className="text-foreground">{election.title}</strong> will be made
                  public to the entire KTU COMPSSA department. This cannot be retracted.
                </p>
              </div>
            </div>
            {actionError && <p className="text-xs text-red-600">{actionError}</p>}
            <div className="flex gap-2">
              <button
                disabled={isPublishing}
                onClick={() => setShowPublishConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground border border-border rounded-xl hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isPublishing}
                onClick={handlePublishResults}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-60"
                style={{ backgroundColor: 'var(--status-published)' }}
              >
                {isPublishing ? 'Publishing…' : 'Publish Now'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
