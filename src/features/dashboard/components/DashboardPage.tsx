/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import {
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  Activity,
  History,
  FileVolume
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, elections, voteRecords, actionLog, users } = useAuthContext();
  const { navigateTo } = useNavigation();
  const [currentTime, setCurrentTime] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const updateTime = () => {
      const now = new Date();
      const utcString = now.toISOString().replace('T', ' ').slice(0, 16);
      setCurrentTime(utcString);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentUser) return null;

  // Find standard or active elections
  const activeElection = elections.find(e => e.status === 'Active') || elections[0];
  const hasElection = !!activeElection;

  // Let's compute some live statistics
  // Voted categories by CURRENT student
  const totalCategoriesCount = activeElection ? activeElection.categories.length : 0;
  const userCastVotes = voteRecords.filter(r => r.voterId === currentUser.id && activeElection?.categories.some(c => c.id === r.categoryId));
  const userVotedCount = userCastVotes.length;
  const hasFinishedVoting = totalCategoriesCount > 0 && userVotedCount === totalCategoriesCount;

  // Turnout stats
  const registeredStudentsCount = users.filter(u => u.role === 'Student' || u.role === 'Candidate').length;
  // Unique voters in active election
  const uniqueVoterIds = new Set(voteRecords.filter(r => activeElection?.categories.some(c => c.id === r.categoryId)).map(r => r.voterId));
  const votedTurnoutCount = uniqueVoterIds.size;
  const turnoutPercent = registeredStudentsCount > 0 ? Math.round((votedTurnoutCount / registeredStudentsCount) * 100) : 0;

  // Candidate tally lookup
  let candidateTally = 0;
  let candidateCategoryName = '';
  if (currentUser.role === 'Candidate') {
    const matchedCategory = activeElection?.categories.find(c =>
      c.candidates.some(cand => cand.id === currentUser.id)
    );
    if (matchedCategory) {
      candidateCategoryName = matchedCategory.name;
      const meAsCandidate = matchedCategory.candidates.find(cand => cand.id === currentUser.id);
      candidateTally = meAsCandidate ? meAsCandidate.votes : 0;
    }
  }

  // Last 3 action logs for EC
  const recentLogs = actionLog.slice(0, 3);

  return (
    <div id="dashboard-viewport" className="space-y-6 font-sans py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Visual Welcome Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-800 tracking-tight">
            Greetings, {currentUser.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Department of Computer Science • Registered Role: <span className="font-semibold text-slate-700">{currentUser.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg text-slate-500 shadow-2xs">
          <span>UTC TIME: {isMounted && currentTime ? currentTime : '---'}</span>
        </div>
      </div>

      {/* Main Active Election status banner */}
      {hasElection ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">COMPSSA General Election</span>
              <h3 className="font-display font-bold text-base text-slate-800 mt-1">{activeElection.title}</h3>
            </div>
            <StatusBadge status={activeElection.status} />
          </div>

          <div className="p-6">
            {/* Student View Panel */}
            {(currentUser.role === 'Student' || currentUser.role === 'Candidate') && (
              <div className="space-y-4">
                {activeElection.status === 'Active' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Voting Progress Card */}
                    <div className="col-span-1 md:col-span-2 border border-slate-100 bg-linear-to-b from-white to-slate-50/20 p-5 rounded-xl space-y-4 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-semibold text-sm text-slate-900">Your Voting Progress</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Please ensure all administrative boxes are marked.</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-slate-600">
                          <span>Categories Cast</span>
                          <span className="font-mono text-slate-900">{userVotedCount} of {totalCategoriesCount}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${(userVotedCount / (totalCategoriesCount || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {hasFinishedVoting ? (
                          <div className="bg-green-50 border border-green-100 text-green-700 p-3 rounded-lg text-xs flex gap-2 items-center">
                            <CheckCircle className="h-4.5 w-4.5 text-green-600" />
                            <span>Congratulations! All of your COMPSSA election ballots have been securely sealed.</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => navigateTo('/vote')}
                            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4  py-2.5 rounded-lg transition-all shadow-xs"
                          >
                            <span>{userVotedCount > 0 ? 'Continue Cast Process' : 'Cast Your Ballots Now'}</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Additional info pane */}
                    <div className="border border-slate-100 p-5 rounded-xl bg-slate-50/50 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                          <Clock className="h-4 w-4" />
                          <span>Closing Deadline</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-slate-800">
                          May 25, 2026 • 18:00 UTC
                        </p>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Results will be formatted, checked, and posted publicly directly by the EC right after polling closure.
                        </p>
                      </div>

                      {activeElection.status === 'Published' && (
                        <button
                          onClick={() => navigateTo(`/results/${activeElection.id}`)}
                          className="w-full mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 py-2 rounded-lg hover:bg-purple-100/50"
                        >
                          View Official Results →
                        </button>
                      )}
                    </div>
                  </div>
                ) : activeElection.status === 'Published' ? (
                  <div className="bg-purple-50/40 border border-purple-100 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-sm text-purple-900">Official Election Results Posted</h4>
                      <p className="text-xs text-purple-700">The Electoral Commission has verified the tallies and released the public audit logs.</p>
                    </div>
                    <button
                      onClick={() => navigateTo(`/results/${activeElection.id}`)}
                      className="whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm"
                    >
                      Enter Public Results Board
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-xl text-center space-y-2">
                    <Clock className="h-8 w-8 text-amber-500 mx-auto" />
                    <h4 className="font-display font-bold text-sm text-slate-800">Voting Window Closed</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      All ballots are currently locked for audits. The Electoral Commission will publish the final winner counts shortly.
                    </p>
                  </div>
                )}

                {/* Candidate Specific Live Tally Badge */}
                {currentUser.role === 'Candidate' && (
                  <div className="mt-4 border border-blue-100 bg-linear-to-b from-blue-50/30 to-blue-50/60 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-sm text-slate-900">Your Tally Tracker</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Category: <span className="font-semibold text-slate-700">{candidateCategoryName || 'Unassigned'}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center sm:text-right">
                        <span className="block text-2xl font-mono font-extrabold text-blue-700">{candidateTally}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Live Votes</span>
                      </div>
                      <button
                        onClick={() => navigateTo('/dashboard/candidate')}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs px-3.5 py-2 rounded-lg transition-all"
                      >
                        Launch Monitor →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EC Admin Dashboard View */}
            {currentUser.role === 'EC' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Turnout Stats widget */}
                  <div className="border border-slate-200/80 p-5 rounded-xl space-y-3.5 bg-linear-to-b from-white to-slate-50/20 shadow-3xs flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Users className="h-4.5 w-4.5 text-blue-500" />
                        <span>Registered Turnout</span>
                      </div>
                      <h4 className="text-2xl font-mono font-extrabold text-slate-900 mt-2">
                        {turnoutPercent}%
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {votedTurnoutCount} of {registeredStudentsCount} verified student electors have voted.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => navigateTo(`/admin/elections/${activeElection.id}/live`)}
                        className="w-full flex items-center justify-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 py-2 rounded-lg transition-all"
                      >
                        Enter EC Live Control Panel →
                      </button>
                    </div>
                  </div>

                  {/* Registered voters breakdown */}
                  <div className="border border-slate-200/80 p-5 rounded-xl space-y-3 bg-linear-to-b from-white to-slate-50/20 shadow-3xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                        <span>Election Controls</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-3">
                        Total categories cataloged: <span className="font-mono font-bold text-slate-800">{totalCategoriesCount}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 leading-normal mt-1.5">
                        Current system status: <span className="font-bold text-blue-600">{activeElection.status}</span>. You can modify categories, manage candidates list and import credentials safely.
                      </p>
                    </div>
                    <button
                      onClick={() => navigateTo('/admin/elections')}
                      className="w-full flex items-center justify-center gap-1 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2 rounded-lg transition-all text-slate-700"
                    >
                      Manage Elections List
                    </button>
                  </div>

                  {/* EC Quick Actions */}
                  <div className="border border-slate-200/80 p-5 rounded-xl bg-slate-50/40 shadow-3xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-3">
                        <Activity className="h-4.5 w-4.5 text-rose-500" />
                        <span>Quick Setup Actions</span>
                      </div>
                      <span className="block text-2xs uppercase tracking-wider text-slate-400 font-mono font-bold">Voters Database</span>
                      <p className="text-xs text-slate-600 mt-1 font-semibold">Bulk Import Students</p>
                      <p className="text-[11px] text-slate-400 leading-normal mt-1">
                        Download fresh templates, copy-paste CSV records, and generate on-the-fly random passwords.
                      </p>
                    </div>
                    <button
                      onClick={() => navigateTo('/admin/students')}
                      className="w-full mt-3 flex items-center justify-center gap-1 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 py-2 rounded-lg transition-all cursor-pointer"
                    >
                      Enter Students Portal
                    </button>
                  </div>
                </div>

                {/* Audit Logger History */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <History className="h-4 w-4 text-slate-500" />
                      <span>Electoral Audit History Log</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border px-2 py-0.5 rounded">Security Sealed</span>
                  </div>

                  <div className="mt-3.5 space-y-3">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="flex justify-between items-start text-xs border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0">
                        <div className="space-y-0.5 max-w-lg">
                          <p className="text-slate-700 font-medium leading-normal">{log.action}</p>
                          <p className="text-[10px] text-slate-400">Issuer: {log.user}</p>
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 shrink-0 uppercase">
                          {log.timestamp.replace('T', ' ').slice(11, 16)} UTC
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* HOD View Panel */}
            {currentUser.role === 'HOD' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 border border-slate-150 p-5 rounded-xl bg-slate-50/50 space-y-4 shadow-3xs">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg border border-amber-100">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-slate-900">Registered Turnout Oversight</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Real-time inspection mode authorized.</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Live Response Tally Rate</span>
                      <span className="font-mono text-slate-900">{votedTurnoutCount} cast / {registeredStudentsCount} total</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${turnoutPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 leading-normal bg-white p-3 border rounded-lg">
                    You have read-only monitoring access to all registered position charts. You cannot edit categories or interfere with voter submissions.
                  </div>
                </div>

                <div className="border border-slate-200 p-5 rounded-xl bg-white flex flex-col justify-between shadow-3xs">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">Department Panel</span>
                    <h4 className="font-display font-bold text-sm text-slate-900">Watch Counts Live</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Enter the monitoring dashboard to observe candidate tallies climb transparently, category-by-category.
                    </p>
                  </div>
                  <button
                    onClick={() => navigateTo('/admin/live')}
                    className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-900 text-white font-semibold text-xs text-center rounded-lg hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                  >
                    Enter Live Center
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Active Elections Set"
          description="The Electoral Commission has not created or launched an election draft in the system yet. Please check back later."
        />
      )}
    </div>
  );
}

