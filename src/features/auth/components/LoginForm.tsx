/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Mail01Icon, ArrowRight01Icon, Alert01Icon, Award01Icon } from '@hugeicons/core-free-icons';

export default function LoginForm() {
  const { login, setMockRole } = useAuthContext();
  const { navigateTo } = useNavigation();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please type in your student or admin email.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const user = await login(email);
      if (user.firstLoginPending) {
        navigateTo('/first-login');
      } else {
        navigateTo('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (role: 'Student' | 'Candidate' | 'EC' | 'HOD') => {
    setErrorMessage('');
    setIsSubmitting(true);
    let mockEmail = '';
    switch (role) {
      case 'EC':
        mockEmail = 'ec@compssa.org';
        break;
      case 'HOD':
        mockEmail = 'hod@compssa.org';
        break;
      case 'Candidate':
        mockEmail = 'kwame@compssa.org';
        break;
      case 'Student':
        mockEmail = 'voter@compssa.org';
        break;
    }

    setEmail(mockEmail);
    setTimeout(async () => {
      try {
        const user = await login(mockEmail);
        if (user.firstLoginPending) {
          navigateTo('/first-login');
        } else {
          navigateTo('/dashboard');
        }
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setIsSubmitting(false);
      }
    }, 400);
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
        <p className="mt-2 text-center text-xs text-slate-500 max-w">
          Enter your COMPSSA student or administrative credential to enter the booth.
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
                  name="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-md placeholder-slate-400 text-slate-900 border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="voter@compssa.org"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-optional" className="block text-xs font-semibold text-slate-700">
                Access Password
              </label>
              <p className="text-[10px] text-slate-400 mt-0.5 mb-1.5 leading-none">
                Password validation is mock. Any secure password works. Let field empty.
              </p>
              <input
                type="password"
                id="password-optional"
                disabled={isSubmitting}
                className="block w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-md text-slate-900 outline-none placeholder-slate-400"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-xs hover:shadow-md cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Enter Voting System</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* QUICK DEMO CONTROLS - AN INSPECTOR'S DREAM */}
          <div className="mt-8">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest bg-white z-10 px-1">
                Demo Quick Swappers
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <p className="text-[10px] text-slate-400 text-center mb-4 leading-normal">
              Click any profile button below to instantly login as that role with seeded accounts.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('Student')}
                className="flex flex-col items-center justify-center p-2.5 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-lg text-left transition-all"
              >
                <span className="text-xs font-bold text-slate-800">Student Voter</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5 mt-1">Pending password change</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Candidate')}
                className="flex flex-col items-center justify-center p-2.5 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-lg text-left transition-all"
              >
                <span className="text-xs font-bold text-slate-800">Candidate Tally</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5 mt-1">Kwame (SRC President)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('EC')}
                className="flex flex-col items-center justify-center p-2.5 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-lg text-left transition-all"
              >
                <span className="text-xs font-bold text-slate-800">Electoral Com.</span>
                <span className="text-[9px] text-slate-500 font-mono mt-1">Superuser controls (EC)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('HOD')}
                className="flex flex-col items-center justify-center p-2.5 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-lg text-left transition-all"
              >
                <span className="text-xs font-bold text-slate-800">Head of Dept.</span>
                <span className="text-[9px] text-slate-500 font-mono mt-1">Legitimacy Oversight</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
