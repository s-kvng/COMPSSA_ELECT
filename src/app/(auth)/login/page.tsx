/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import LoginForm from '../../../features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Sleek, professional "Back to Home" navigation bar */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-white bg-white/75 backdrop-blur-md px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>Back to Home</span>
        </Link>
      </div>

      <LoginForm />
    </div>
  );
}
