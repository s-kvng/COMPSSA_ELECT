/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useEffect } from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import { Lock, Shuffle } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { currentUser, isLoading } = useAuthContext();
  const { path, navigateTo, params } = useNavigation();

  useEffect(() => {
    if (isLoading) return;

    // Define public routes
    const isPublic = path === '/' || path === '/results' || path.startsWith('/results/');
    const isLoginPage = path === '/login';

    if (!currentUser && !isPublic && !isLoginPage) {
      // Force non-authenticated to login
      navigateTo('/login');
    } else if (currentUser) {
      // If logged in and on login/landing, go to dashboard sequence
      if (isLoginPage || path === '/') {
        if (currentUser.firstLoginPending) {
          navigateTo('/first-login');
        } else {
          navigateTo('/dashboard');
        }
      } else if (currentUser.firstLoginPending && path !== '/first-login') {
        // Force set password on first login
        navigateTo('/first-login');
      } else if (!currentUser.firstLoginPending && path === '/first-login') {
        // Already changed, escape page
        navigateTo('/dashboard');
      }
    }
  }, [currentUser, path, isLoading]);

  if (isLoading) {
    return (
      <div id="route-guard-loading-skeleton" className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-slate-200">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-slate-200 rounded-sm animate-pulse"></div>
              <div className="h-4 w-32 bg-slate-200 rounded-sm animate-pulse"></div>
            </div>
            <div className="h-10 w-24 bg-slate-200 rounded-md animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="h-5 w-1/3 bg-slate-100 rounded-sm animate-pulse"></div>
                <div className="h-2 w-full bg-slate-100 rounded-sm animate-pulse"></div>
                <div className="h-2 w-5/6 bg-slate-100 rounded-sm animate-pulse"></div>
              </div>
              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="h-5 w-1/4 bg-slate-100 rounded-sm animate-pulse"></div>
                <div className="h-2 w-full bg-slate-100 rounded-sm animate-pulse"></div>
                <div className="h-2 w-2/3 bg-slate-100 rounded-sm animate-pulse"></div>
              </div>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-xl h-48 space-y-4">
              <div className="h-5 w-1/2 bg-slate-100 rounded-sm animate-pulse"></div>
              <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Route security gate check
  if (currentUser) {
    const isEcRoute = path.startsWith('/admin') && path !== '/admin/live';
    const isHodRoute = path === '/admin/live';
    const isVoteRoute = path.startsWith('/vote');

    if (isEcRoute && currentUser.role !== 'EC') {
      return (
        <div id="guard-restriction-screen" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-50 p-4 rounded-full border border-red-200 text-red-600 mb-4 animate-bounce">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="font-display font-bold text-lg text-slate-900 mb-2">Restricted Action Room</h2>
          <p className="font-sans text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
            Your user profile role (<strong>{currentUser.role}</strong>) is not granted security clearance to access the Electoral Council controls.
          </p>
          <button
            onClick={() => navigateTo('/dashboard')}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    if (isHodRoute && currentUser.role !== 'HOD') {
      return (
        <div id="guard-restriction-screen-hod" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-50 p-4 rounded-full border border-red-200 text-red-600 mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="font-display font-bold text-lg text-slate-900 mb-2">HOD Eyes Only</h2>
          <p className="font-sans text-xs text-slate-500 max-w-md mb-6">
            Only the official Head of Department may enter this read-only live center view.
          </p>
          <button
            onClick={() => navigateTo('/dashboard')}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    if (isVoteRoute && !['Student', 'Candidate'].includes(currentUser.role)) {
      return (
        <div id="guard-restriction-screen-vote" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-blue-50 p-4 rounded-full border border-blue-200 text-blue-600 mb-4">
            <Shuffle className="h-8 w-8 animate-spin" />
          </div>
          <h2 className="font-display font-bold text-lg text-slate-900 mb-2">Voter Registry Access Block</h2>
          <p className="font-sans text-xs text-slate-500 max-w-md mb-6">
            Electoral Officials and department viewers cannot cast votes or enter voting booths to preserve audit cleanliness.
          </p>
          <button
            onClick={() => navigateTo('/dashboard')}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
}

