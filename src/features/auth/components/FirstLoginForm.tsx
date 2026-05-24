/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/features/auth/mockAuth';
import { useNavigation } from '@/features/auth/navigation';
import { KeyRound, ShieldAlert, Award, Lock } from 'lucide-react';

export default function FirstLoginForm() {
  const { completeFirstLogin, currentUser } = useAuthContext();
  const { navigateTo } = useNavigation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 8) {
      setErrorMessage('Security constraint: Your new password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Validation error: Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);

    // Simulate database write save latency
    setTimeout(() => {
      completeFirstLogin();
      setIsSubmitting(false);
      navigateTo('/vote');
    }, 600);
  };

  return (
    <div id="first-login-container" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-500 text-white p-2.5 rounded-xl shadow-md">
            <KeyRound className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-center font-display font-extrabold text-2xl text-slate-900 leading-tight">
          Establish New Password
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 max-w">
          Welcome, <strong>{currentUser.name}</strong>. Before casting your official ballot, you must update the default admin-assigned credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <div className="bg-white py-8 px-4 border border-slate-200 rounded-xl shadow-xs sm:px-10">
          {errorMessage && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex gap-2 items-start">
              <ShieldAlert className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="temp-password" className="block text-xs font-semibold text-slate-700">
                Temporary Received Password
              </label>
              <input
                type="text"
                id="temp-password"
                disabled
                className="mt-1.5 block w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 rounded-md text-slate-500 outline-none cursor-not-allowed select-none font-mono"
                value={`COMPSSA_${currentUser.studentId.replace(/[^a-zA-Z0-9]/g, '')}`}
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-xs font-semibold text-slate-700">
                New Secure Password
              </label>
              <div className="mt-1.5 relative">
                <input
                  type="password"
                  id="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="block w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-md placeholder-slate-400 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-700">
                Confirm New Password
              </label>
              <div className="mt-1.5 relative">
                <input
                  type="password"
                  id="confirm-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="block w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-md placeholder-slate-400 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-800 flex gap-2 items-start">
              <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Your records are encrypted and verified. Casting a ballot is irreversible and securely anchored.</span>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-xs cursor-pointer hover:shadow-md transition-all"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Set Password & Enter Voting Booth</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
