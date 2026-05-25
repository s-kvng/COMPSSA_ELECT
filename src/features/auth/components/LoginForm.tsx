'use client';

import React, { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Mail01Icon, LockPasswordIcon, ArrowRight01Icon, Alert01Icon, Award01Icon } from '@hugeicons/core-free-icons';

export default function LoginForm() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signIn('password', { flow: 'signIn', email, password });
      // RouteGuard will handle redirect once auth state updates
    } catch {
      setErrorMessage('Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-blue-500/10">
            <HugeiconsIcon icon={Award01Icon} className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-center font-display font-extrabold text-2xl text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500">
          Enter your COMPSSA student or administrative credentials to enter the booth.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <div className="bg-white py-8 px-4 border border-slate-200 rounded-xl shadow-xs sm:px-10">
          {errorMessage && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex gap-2 items-start">
              <HugeiconsIcon icon={Alert01Icon} className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-md placeholder-slate-400 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="voter@compssa.org"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HugeiconsIcon icon={LockPasswordIcon} className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-md placeholder-slate-400 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-xs hover:shadow-md cursor-pointer disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enter Voting System</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-4 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                  Dev Credentials
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                {[
                  { role: 'Student', email: 'voter@compssa.org', pw: 'COMPSSA_2026' },
                  { role: 'Candidate', email: 'kwame@compssa.org', pw: 'COMPSSA_2026' },
                  { role: 'EC', email: 'ec@compssa.org', pw: 'COMPSSA_2026' },
                  { role: 'HOD', email: 'hod@compssa.org', pw: 'COMPSSA_2026' },
                ].map(({ role, email: e, pw }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setEmail(e); setPassword(pw); }}
                    className="p-2 border border-slate-200 hover:border-blue-400 rounded-lg text-left transition-all space-y-0.5"
                  >
                    <p className="font-bold text-slate-700">{role}</p>
                    <p className="text-slate-400 truncate">{e}</p>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 text-center mt-2">
                Click a card to pre-fill credentials, then press Enter Voting System.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
