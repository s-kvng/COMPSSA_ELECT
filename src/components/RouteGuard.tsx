'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthState } from '@/shared/auth';
import { HugeiconsIcon } from '@hugeicons/react';
import { LockIcon, ShuffleIcon } from '@hugeicons/core-free-icons';

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const authState = useAuthState();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (authState.status !== 'authenticated') return;
    const { user } = authState;

    if (user.isFirstLogin && pathname !== '/first-login') {
      router.push('/first-login');
    } else if (!user.isFirstLogin && pathname === '/first-login') {
      router.push('/dashboard');
    }
  }, [authState, pathname, router]);

  if (authState.status === 'loading') {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-slate-200">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-slate-200 rounded-sm animate-pulse" />
              <div className="h-4 w-32 bg-slate-200 rounded-sm animate-pulse" />
            </div>
            <div className="h-10 w-24 bg-slate-200 rounded-md animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="h-5 w-1/3 bg-slate-100 rounded-sm animate-pulse" />
                <div className="h-2 w-full bg-slate-100 rounded-sm animate-pulse" />
                <div className="h-2 w-5/6 bg-slate-100 rounded-sm animate-pulse" />
              </div>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-xl h-48 space-y-4">
              <div className="h-5 w-1/2 bg-slate-100 rounded-sm animate-pulse" />
              <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authState.status === 'authenticated') {
    const { user } = authState;
    const isEcRoute = pathname.startsWith('/admin') && pathname !== '/admin/live';
    const isHodRoute = pathname === '/admin/live';
    const isVoteRoute = pathname.startsWith('/vote');

    if (isEcRoute && user.role !== 'ec') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-50 p-4 rounded-full border border-red-200 text-red-600 mb-4 animate-bounce">
            <HugeiconsIcon icon={LockIcon} className="h-8 w-8" />
          </div>
          <h2 className="font-display font-bold text-lg text-slate-900 mb-2">Restricted Action Room</h2>
          <p className="font-sans text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
            Your role (<strong>{user.role}</strong>) is not granted access to Electoral Council controls.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    if (isHodRoute && user.role !== 'hod') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-50 p-4 rounded-full border border-red-200 text-red-600 mb-4">
            <HugeiconsIcon icon={LockIcon} className="h-8 w-8" />
          </div>
          <h2 className="font-display font-bold text-lg text-slate-900 mb-2">HOD Eyes Only</h2>
          <p className="font-sans text-xs text-slate-500 max-w-md mb-6">
            Only the official Head of Department may access this live center.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    if (isVoteRoute && !['student', 'candidate'].includes(user.role)) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-blue-50 p-4 rounded-full border border-blue-200 text-blue-600 mb-4">
            <HugeiconsIcon icon={ShuffleIcon} className="h-8 w-8 animate-spin" />
          </div>
          <h2 className="font-display font-bold text-lg text-slate-900 mb-2">Voter Registry Access Block</h2>
          <p className="font-sans text-xs text-slate-500 max-w-md mb-6">
            Electoral Officials cannot cast votes to preserve audit cleanliness.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
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
