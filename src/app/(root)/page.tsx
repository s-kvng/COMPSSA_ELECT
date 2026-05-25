/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import { useNavigation } from '../../features/auth/navigation';
import { useAuthContext } from '../../features/auth/mockAuth';
import { HugeiconsIcon } from '@hugeicons/react';
import { Award01Icon, ArrowRight01Icon, CheckmarkSquare01Icon, Shield01Icon, FavouriteIcon, UserGroupIcon } from '@hugeicons/core-free-icons';

export default function LandingPage() {
  const { navigateTo } = useNavigation();
  const { currentUser } = useAuthContext();

  return (
    <div id="landing-hero" className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 flex flex-col justify-between font-sans select-none animate-fade-in text-left">
      {/* Navbar segment */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 text-white p-2 rounded-xl shadow-xs">
            <HugeiconsIcon icon={Award01Icon} className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-sm text-slate-900 tracking-wide uppercase">
              COMPSSA
            </h1>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5 leading-none">
              Electoral Board
            </p>
          </div>
        </div>

        <button
          onClick={() => navigateTo(currentUser ? '/dashboard' : '/login')}
          className="px-4.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all hover:shadow-2xs shadow-3xs cursor-pointer"
        >
          {currentUser ? 'Enter Console' : 'Sign In Portal'}
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/50 rounded-full font-mono text-[10px] text-blue-700 font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-600" />
          <span>Legitimacy • transparency • certified math</span>
        </div>

        <div className="space-y-4">
          <h2 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight leading-tight max-w-2xl mx-auto">
            The Digital Voice of the <span className="text-blue-600">Computer Science</span> Department
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Eliminating candidate disputes and administrative tally overhead. COMPSSA Election platform compiles and encrypts student ballots into verified local audit ledgers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs sm:max-w-none">
          <button
            onClick={() => navigateTo(currentUser ? '/dashboard' : '/login')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition-all"
          >
            <span>Enter Voting Booth</span>
            <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigateTo('/results/elect-2026')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs cursor-pointer transition-all"
          >
            <span>View Public Results</span>
          </button>
        </div>

        {/* Triple selling values cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 w-full">
          <div className="border border-slate-200/70 p-5 bg-white/70 backdrop-blur-xs rounded-xl shadow-3xs text-left space-y-2">
            <HugeiconsIcon icon={CheckmarkSquare01Icon} className="h-5 w-5 text-emerald-500" strokeWidth={2} />
            <h4 className="font-display font-bold text-xs text-slate-900 mt-2">Irrevocable Balloting</h4>
            <p className="text-[11px] text-slate-400 leading-normal">Each student cast is signed, securely logged, and completely unalterable after confirmation.</p>
          </div>
          <div className="border border-slate-200/70 p-5 bg-white/70 backdrop-blur-xs rounded-xl shadow-3xs text-left space-y-2">
            <HugeiconsIcon icon={Shield01Icon} className="h-5 w-5 text-blue-500" strokeWidth={2} />
            <h4 className="font-display font-bold text-xs text-slate-900 mt-2">Anonymity Safeguard</h4>
            <p className="text-[11px] text-slate-400 leading-normal">Independent voter records are pseudoymized. Nobody can associate your name to your selected candidate choices.</p>
          </div>
          <div className="border border-slate-200/70 p-5 bg-white/70 backdrop-blur-xs rounded-xl shadow-3xs text-left space-y-2">
            <HugeiconsIcon icon={UserGroupIcon} className="h-5 w-5 text-purple-500" strokeWidth={2} />
            <h4 className="font-display font-bold text-xs text-slate-900 mt-2">Verified Roster Match</h4>
            <p className="text-[11px] text-slate-400 leading-normal">The Electoral Commission manages verified student ID lists. Only enroled members of COMPSSA can enter.</p>
          </div>
        </div>
      </main>

      {/* Footer lockup */}
      <footer className="border-t border-slate-200/50 py-6 text-center text-[10px] font-mono text-slate-400">
        <p>Department of Computer Science • Association of Ghana Computer Science Students</p>
        <p className="mt-1 flex items-center justify-center gap-1.5">
          <span>Engineered with pure respect for students voice</span>
          <HugeiconsIcon icon={FavouriteIcon} className="h-3 w-3 text-red-500" />
        </p>
      </footer>
    </div>
  );
}

// Sparkler proxy
function Sparkles({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z"/>
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/>
    </svg>
  );
}
