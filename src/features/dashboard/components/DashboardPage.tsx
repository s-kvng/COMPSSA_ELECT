'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/shared/auth';
import { useIsMounted } from '@/hooks/useIsMounted';
import { api } from '../../../../convex/_generated/api';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { LiveCounter } from '@/components/LiveCounter';
import { XolaceStrip } from '@/components/extra';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CheckmarkCircle01Icon,
  Clock01Icon,
  ArrowRight01Icon,
  TrendingUpDownIcon,
  UserGroupIcon,
  Activity01Icon,
  Time01Icon,
} from '@hugeicons/core-free-icons';

export default function DashboardPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const isMounted = useIsMounted();
  const [currentTime, setCurrentTime] = React.useState<string | null>(null);

  const currentElection = useQuery(api.elections.getCurrentElection);
  const myVotes = useQuery(
    api.votes.getMyVotes,
    currentElection?._id ? { electionId: currentElection._id } : 'skip',
  );
  const candidateTally = useQuery(
    api.results.myVoteCount,
  );
  const turnout = useQuery(
    api.ec_actions.getTurnout,
    currentElection?._id && (currentUser?.role === 'ec' || currentUser?.role === 'hod')
      ? { electionId: currentElection._id }
      : 'skip',
  );
  const recentActions = useQuery(
    api.ec_actions.getRecentEcActions,
    currentElection?._id && currentUser?.role === 'ec'
      ? { electionId: currentElection._id }
      : 'skip',
  );

  React.useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toISOString().replace('T', ' ').slice(0, 16));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentUser) return null;

  const electionId = currentElection?._id;
  const totalCategories = currentElection?.categories.length ?? 0;
  const votedCount = myVotes?.length ?? 0;
  const hasFinishedVoting = totalCategories > 0 && votedCount === totalCategories;

  const uniqueVoters = turnout?.uniqueVoters ?? 0;
  const registeredCount = turnout?.registeredCount ?? 0;
  const turnoutPercent = registeredCount > 0 ? Math.round((uniqueVoters / registeredCount) * 100) : 0;

  const candidateCategoryName = currentElection?.categories.find(
    (c) => c.candidates.some((cand) => cand.userId === currentUser._id),
  )?.name ?? '';

  return (
    <div className="space-y-6 font-sans py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-800 tracking-tight">
            Greetings, {currentUser.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Department of Computer Science • Role: <span className="font-semibold text-slate-700 capitalize">{currentUser.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <LiveCounter userId={currentUser._id} />
          <div className="flex items-center gap-2 font-mono text-xs bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg text-slate-500 shadow-2xs">
            <span>UTC TIME: {isMounted && currentTime ? currentTime : '---'}</span>
          </div>
        </div>
      </div>

      {/* No election state */}
      {currentElection === null && (
        <EmptyState
          title="No Active Elections Set"
          description="The Electoral Commission has not created or launched an election yet. Please check back later."
        />
      )}

      {/* Loading */}
      {currentElection === undefined && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Election Banner */}
      {currentElection && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">KTU COMPSSA General Election</span>
              <h3 className="font-display font-bold text-base text-slate-800 mt-1">{currentElection.title}</h3>
            </div>
            <StatusBadge status={currentElection.status} />
          </div>

          <div className="p-6">
            {/* Student / Candidate View */}
            {(currentUser.role === 'student' || currentUser.role === 'candidate') && (
              <div className="space-y-4">
                {currentElection.status === 'active' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1 md:col-span-2 border border-slate-100 bg-linear-to-b from-white to-slate-50/20 p-5 rounded-xl space-y-4 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-semibold text-sm text-slate-900">Your Voting Progress</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Ensure all categories are marked.</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-slate-600">
                          <span>Categories Cast</span>
                          <span className="font-mono text-slate-900">{votedCount} of {totalCategories}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${(votedCount / (totalCategories || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="pt-2">
                        {hasFinishedVoting ? (
                          <div className="bg-green-50 border border-green-100 text-green-700 p-3 rounded-lg text-xs flex gap-2 items-center">
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4.5 w-4.5 text-green-600" />
                            <span>All of your KTU COMPSSA election ballots have been securely sealed.</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => router.push('/vote')}
                            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all shadow-xs"
                          >
                            <span>{votedCount > 0 ? 'Continue Cast Process' : 'Cast Your Ballots Now'}</span>
                            <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="border border-slate-100 p-5 rounded-xl bg-slate-50/50 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <HugeiconsIcon icon={Clock01Icon} className="h-4 w-4" />
                          <span>Closing Deadline</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-slate-800">
                          {new Date(currentElection.endTime).toISOString().replace('T', ' ').slice(0, 16)} UTC
                        </p>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Results will be posted publicly by the EC right after polling closure.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : currentElection.status === 'published' ? (
                  <div className="bg-purple-50/40 border border-purple-100 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-sm text-purple-900">Official Election Results Posted</h4>
                      <p className="text-xs text-purple-700">The Electoral Commission has verified the tallies and released the public audit logs.</p>
                    </div>
                    <button
                      onClick={() => router.push(`/results/${electionId}`)}
                      className="whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm"
                    >
                      Enter Public Results Board
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-xl text-center space-y-2">
                    <HugeiconsIcon icon={Clock01Icon} className="h-8 w-8 text-amber-500 mx-auto" />
                    <h4 className="font-display font-bold text-sm text-slate-800">Voting Window Closed</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      All ballots are locked for audits. The Electoral Commission will publish results shortly.
                    </p>
                  </div>
                )}

                {/* Candidate Tally Badge */}
                {currentUser.role === 'candidate' && (
                  <div className="mt-4 border border-blue-100 bg-linear-to-b from-blue-50/30 to-blue-50/60 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg">
                        <HugeiconsIcon icon={TrendingUpDownIcon} className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-sm text-slate-900">Your Tally Tracker</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Category: <span className="font-semibold text-slate-700">{candidateCategoryName || 'Unassigned'}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center sm:text-right">
                        <span className="block text-2xl font-mono font-extrabold text-blue-700">{candidateTally ?? '—'}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Live Votes</span>
                      </div>
                      <button
                        onClick={() => router.push('/dashboard/candidate')}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs px-3.5 py-2 rounded-lg transition-all"
                      >
                        Launch Monitor →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EC View */}
            {currentUser.role === 'ec' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-slate-200/80 p-5 rounded-xl space-y-3.5 bg-linear-to-b from-white to-slate-50/20 shadow-3xs flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <HugeiconsIcon icon={UserGroupIcon} className="h-4.5 w-4.5 text-blue-500" />
                        <span>Registered Turnout</span>
                      </div>
                      <h4 className="text-2xl font-mono font-extrabold text-slate-900 mt-2">{turnoutPercent}%</h4>
                      <p className="text-[11px] text-slate-400">{uniqueVoters} of {registeredCount} verified electors have voted.</p>
                    </div>
                    <button
                      onClick={() => electionId && router.push(`/admin/elections/${electionId}/live`)}
                      className="w-full flex items-center justify-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 py-2 rounded-lg transition-all"
                    >
                      Enter EC Live Control Panel →
                    </button>
                  </div>

                  <div className="border border-slate-200/80 p-5 rounded-xl space-y-3 bg-linear-to-b from-white to-slate-50/20 shadow-3xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4.5 w-4.5 text-emerald-500" />
                        <span>Election Controls</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-3">
                        Total categories: <span className="font-mono font-bold text-slate-800">{totalCategories}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 leading-normal mt-1.5">
                        Status: <span className="font-bold text-blue-600 capitalize">{currentElection.status}</span>.
                      </p>
                    </div>
                    <button
                      onClick={() => router.push('/admin/elections')}
                      className="w-full flex items-center justify-center gap-1 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2 rounded-lg transition-all text-slate-700"
                    >
                      Manage Elections List
                    </button>
                  </div>

                  <div className="border border-slate-200/80 p-5 rounded-xl bg-slate-50/40 shadow-3xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-3">
                        <HugeiconsIcon icon={Activity01Icon} className="h-4.5 w-4.5 text-rose-500" />
                        <span>Quick Setup Actions</span>
                      </div>
                      <span className="block text-2xs uppercase tracking-wider text-slate-400 font-mono font-bold">Voters Database</span>
                      <p className="text-xs text-slate-600 mt-1 font-semibold">Students Registry</p>
                    </div>
                    <button
                      onClick={() => router.push('/admin/students')}
                      className="w-full mt-3 flex items-center justify-center gap-1 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 py-2 rounded-lg transition-all cursor-pointer"
                    >
                      Enter Students Portal
                    </button>
                  </div>
                </div>

                {/* Audit History */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <HugeiconsIcon icon={Time01Icon} className="h-4 w-4 text-slate-500" />
                      <span>Electoral Audit History Log</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border px-2 py-0.5 rounded">Security Sealed</span>
                  </div>
                  <div className="mt-3.5 space-y-3">
                    {!recentActions || recentActions.length === 0 ? (
                      <p className="text-xs text-slate-400">No recent EC actions.</p>
                    ) : (
                      recentActions.map((log) => (
                        <div key={log._id} className="flex justify-between items-start text-xs border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0">
                          <p className="text-slate-700 font-medium">{log.action}</p>
                          <span className="font-mono text-[9px] text-slate-400 shrink-0 uppercase">
                            {new Date(log.timestamp).toISOString().slice(11, 16)} UTC
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* HOD View */}
            {currentUser.role === 'hod' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 border border-slate-150 p-5 rounded-xl bg-slate-50/50 space-y-4 shadow-3xs">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg border border-amber-100">
                      <HugeiconsIcon icon={Activity01Icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-slate-900">Registered Turnout Oversight</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Real-time inspection mode authorized.</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Live Response Tally Rate</span>
                      <span className="font-mono text-slate-900">{uniqueVoters} cast / {registeredCount} total</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${turnoutPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-normal bg-white p-3 border rounded-lg">
                    You have read-only monitoring access. You cannot edit categories or interfere with voter submissions.
                  </div>
                </div>

                <div className="border border-slate-200 p-5 rounded-xl bg-white flex flex-col justify-between shadow-3xs">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">Department Panel</span>
                    <h4 className="font-display font-bold text-sm text-slate-900">Watch Counts Live</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Observe candidate tallies climb transparently, category-by-category.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/admin/live')}
                    className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-900 text-white font-semibold text-xs text-center rounded-lg hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                  >
                    Enter Live Center
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <XolaceStrip placementKey="dashboard" />
    </div>
  );
}
