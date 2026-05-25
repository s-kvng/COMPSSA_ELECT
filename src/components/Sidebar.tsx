/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  DashboardSquare01Icon,
  CheckmarkSquare01Icon,
  TrendingUpDownIcon,
  Award01Icon,
  UserGroupIcon,
  Tv01Icon,
  Logout01Icon,
  SlidersHorizontalIcon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';

export default function Sidebar() {
  const { currentUser, logout, elections } = useAuthContext();
  const { path, navigateTo } = useNavigation();

  if (!currentUser) return null;

  const activeElection = elections.find(e => e.status === 'Active' || e.status === 'Closed' || e.status === 'Ready');
  const activeElectionId = activeElection?.id || 'elect-2026';

  // Define navigation items with role restrictions
  const menuItems = [
    {
      name: 'Dashboard',
      icon: <HugeiconsIcon icon={DashboardSquare01Icon} className="h-4.5 w-4.5" />,
      targetPath: '/dashboard',
      roles: ['Student', 'Candidate', 'EC', 'HOD'],
    },
    {
      name: 'Vote',
      icon: <HugeiconsIcon icon={CheckmarkSquare01Icon} className="h-4.5 w-4.5" />,
      targetPath: '/vote',
      roles: ['Student', 'Candidate'],
    },
    {
      name: 'My Tally',
      icon: <HugeiconsIcon icon={TrendingUpDownIcon} className="h-4.5 w-4.5" />,
      targetPath: '/dashboard/candidate',
      roles: ['Candidate'],
    },
    {
      name: 'Elections',
      icon: <HugeiconsIcon icon={SlidersHorizontalIcon} className="h-4.5 w-4.5" />,
      targetPath: '/admin/elections',
      roles: ['EC'],
    },
    {
      name: 'Students',
      icon: <HugeiconsIcon icon={UserGroupIcon} className="h-4.5 w-4.5" />,
      targetPath: '/admin/students',
      roles: ['EC'],
    },
    {
      name: 'Electoral Live Tracker',
      icon: <HugeiconsIcon icon={Tv01Icon} className="h-4.5 w-4.5 animate-pulse" />,
      targetPath: `/admin/elections/${activeElectionId}/live`,
      roles: ['EC'],
    },
    {
      name: 'HOD Live Center',
      icon: <HugeiconsIcon icon={Tv01Icon} className="h-4.5 w-4.5" />,
      targetPath: '/admin/live',
      roles: ['HOD'],
    },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  const handleSignOut = () => {
    logout();
    navigateTo('/login');
  };

  return (
    <div
      id="sidebar-container"
      className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-40 font-sans"
    >
      <div className="flex flex-col gap-6 pt-6 px-4">
        {/* Logo / Header */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="bg-indigo-500 text-white p-2 rounded-lg flex items-center justify-center shadow-sm">
            <HugeiconsIcon icon={Award01Icon} className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-sm tracking-wide text-white leading-none">
              COMPSSA
            </h1>
            <p className="text-[10px] font-mono text-indigo-300 mt-1 uppercase tracking-wider font-semibold">
              Election Platform
            </p>
          </div>
        </div>

        {/* Separator line */}
        <div className="border-t border-slate-800 my-1"></div>

        {/* Menu list */}
        <nav className="flex flex-col gap-1.5 list-none m-0 p-0">
          <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Main Menu</div>
          {allowedItems.map((item, idx) => {
            const isSelected = path === item.targetPath || path.startsWith(item.targetPath + '/');
            return (
              <li key={idx} className="m-0 p-0">
                <button
                  onClick={() => navigateTo(item.targetPath)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all duration-150 text-left outline-none ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-slate-700/50 shadow-sm'
                      : 'hover:bg-slate-800/60 hover:text-white text-slate-400 border border-transparent'
                  }`}
                >
                  <span className={`${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
        </nav>
      </div>

      {/* User display and Sign Out */}
      <div className="mt-auto p-4 border-t border-slate-800">
        <div className="bg-indigo-950/40 rounded-xl p-3.5 border border-indigo-700/30 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-500 rounded-lg flex items-center justify-center text-xs font-display font-extrabold text-white shadow-sm shrink-0 border border-indigo-400/20">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-indigo-300 truncate mt-0.5 font-mono uppercase tracking-wider font-semibold">
                {currentUser.role}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-700/30 rounded-lg transition-all cursor-pointer"
          >
            <HugeiconsIcon icon={Logout01Icon} className="h-4 w-4" />
            <span>Sign Out Control</span>
          </button>
        </div>
      </div>
    </div>
  );
}

