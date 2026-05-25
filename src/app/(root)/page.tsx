'use client';

import React from 'react';
import { useNavigation } from '../../features/auth/navigation';
import { useAuthContext } from '../../features/auth/mockAuth';
import { HugeiconsIcon } from '@hugeicons/react';
import { Award01Icon, ArrowRight01Icon, Shield01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';

export default function LandingPage() {
  const { navigateTo } = useNavigation();
  const { currentUser } = useAuthContext();

  return (
    <>
      <style>{`
        @keyframes ring-slow {
          0%, 100% { opacity: 0.12; transform: translate(-50%, -50%) scale(1); }
          50%       { opacity: 0.22; transform: translate(-50%, -50%) scale(1.018); }
        }
        @keyframes ring-mid {
          0%, 100% { opacity: 0.08; transform: translate(-50%, -50%) scale(1); }
          50%       { opacity: 0.16; transform: translate(-50%, -50%) scale(1.025); }
        }
        @keyframes icon-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rv  { animation: slide-up 0.55s cubic-bezier(0.16,1,0.3,1) both; }
        .rv1 { animation-delay: 0.04s; }
        .rv2 { animation-delay: 0.14s; }
        .rv3 { animation-delay: 0.24s; }
        .rv4 { animation-delay: 0.36s; }
        .rv5 { animation-delay: 0.46s; }
      `}</style>

      <div className="h-screen w-screen overflow-hidden flex font-sans select-none">

        {/* ── LEFT VISUAL PANEL ─────────────────────────── */}
        <div
          className="hidden lg:flex w-[52%] shrink-0 relative overflow-hidden flex-col justify-between"
          style={{ backgroundColor: 'oklch(0.13 0.018 248)' }}
        >
          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, oklch(0.30 0.055 248) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              opacity: 0.5,
            }}
          />

          {/* Outer ring */}
          <div
            className="absolute rounded-full border pointer-events-none"
            style={{
              top: '50%', left: '50%',
              width: 540, height: 540,
              borderColor: 'oklch(0.36 0.09 248)',
              borderWidth: 1,
              animation: 'ring-mid 7s ease-in-out infinite',
            }}
          />
          {/* Mid ring */}
          <div
            className="absolute rounded-full border pointer-events-none"
            style={{
              top: '50%', left: '50%',
              width: 390, height: 390,
              borderColor: 'oklch(0.42 0.12 248)',
              borderWidth: 1,
              animation: 'ring-slow 5s ease-in-out infinite',
            }}
          />
          {/* Glow pool behind icon */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 220, height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, oklch(0.6723 0.1606 244.99 / 0.14) 0%, transparent 70%)',
            }}
          />

          {/* Center composition */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: 76, height: 76,
                backgroundColor: 'oklch(0.6723 0.1606 244.99)',
                boxShadow: '0 0 56px oklch(0.6723 0.1606 244.99 / 0.4)',
                animation: 'icon-float 4.5s ease-in-out infinite',
              }}
            >
              <HugeiconsIcon icon={Award01Icon} className="h-9 w-9 text-white" strokeWidth={1.8} />
            </div>

            <div className="text-center space-y-1.5">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.35em] font-bold"
                style={{ color: 'oklch(0.52 0.09 248)' }}
              >
                Electoral Commission
              </p>
              <p
                className="font-sans font-black leading-none tracking-tighter"
                style={{
                  fontSize: 100,
                  color: 'oklch(0.195 0.022 248)',
                }}
              >
                2026
              </p>
            </div>
          </div>

          {/* Rotated brand label on left edge */}
          <div
            className="absolute font-mono text-[9px] uppercase tracking-[0.38em] font-bold pointer-events-none"
            style={{
              color: 'oklch(0.32 0.055 248)',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              left: 28,
              top: '50%',
              marginTop: -120,
            }}
          >
            COMPSSA · Dept. of Computer Science
          </div>

          {/* Bottom metadata */}
          <div
            className="relative z-10 p-8 flex items-end justify-between"
            style={{ color: 'oklch(0.40 0.06 248)' }}
          >
            <div className="space-y-0.5">
              <p className="font-mono text-[9px] uppercase tracking-widest">General Elections</p>
              <p className="font-mono text-[9px] uppercase tracking-widest">Koforidua Technical University</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="font-mono text-[9px] uppercase tracking-widest">Certified</p>
              <p className="font-mono text-[9px] uppercase tracking-widest">& Sealed ✓</p>
            </div>
          </div>

          {/* Right-edge gradient separator */}
          <div
            className="absolute top-0 right-0 bottom-0 w-px pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent, oklch(0.27 0.055 248) 25%, oklch(0.27 0.055 248) 75%, transparent)',
            }}
          />
        </div>

        {/* ── RIGHT CONTENT PANEL ───────────────────────── */}
        <div className="flex-1 flex flex-col justify-between px-10 py-9 lg:px-14 lg:py-11 bg-background overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center justify-between rv rv1">
            <div className="flex items-center gap-2.5 lg:hidden">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                <HugeiconsIcon icon={Award01Icon} className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">COMPSSA</span>
            </div>
            <div className="hidden lg:block" />

            <button
              onClick={() => navigateTo(currentUser ? '/dashboard' : '/login')}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {currentUser ? 'Enter Console →' : 'Sign in →'}
            </button>
          </div>

          {/* Centre content */}
          <div className="space-y-8 max-w-[340px]">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold rv rv2"
              style={{ color: 'var(--color-accent)' }}
            >
              COMPSSA · 2026 General Elections
            </p>

            <div className="space-y-4 rv rv3">
              <h1
                className="font-sans font-black text-foreground leading-[1.04] tracking-tight"
                style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.15rem)' }}
              >
                Your<br />Department.<br />
                <span style={{ color: 'var(--color-accent)' }}>Your Voice.</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The official digital ballot platform for COMPSSA. Every vote is sealed, anonymised, and cryptographically verified by the Electoral Commission.
              </p>
            </div>

            <div className="flex flex-col gap-3 rv rv4">
              <button
                onClick={() => navigateTo(currentUser ? '/dashboard' : '/login')}
                className="flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-primary-foreground rounded-xl transition-all group shadow-sm hover:opacity-90"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                <span>Enter Voting Booth</span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              </button>
              <button
                onClick={() => navigateTo('/results/elect-2026')}
                className="px-5 py-3.5 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-all"
              >
                View Public Results
              </button>
            </div>

            <div className="flex items-center gap-5 rv rv5">
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: 'var(--color-success)' }}
                />
                Irrevocable ballots
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                <HugeiconsIcon
                  icon={Shield01Icon}
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: 'var(--color-accent)' }}
                />
                Anonymised records
              </span>
            </div>
          </div>

          {/* Footer */}
          <p className="font-mono text-[9px] text-muted-foreground/40 uppercase tracking-wider rv rv1">
            © 2026 Department of Computer Science · Ghana
          </p>
        </div>
      </div>
    </>
  );
}
