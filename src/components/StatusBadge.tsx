/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { ElectionStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: ElectionStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  let styles = 'bg-gray-100 text-gray-700 border-gray-200';
  let label: string = status;

  switch (status) {
    case 'Draft':
      styles = 'bg-gray-100 text-gray-600 border-gray-200';
      break;
    case 'Ready':
      styles = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Ready / Locked';
      break;
    case 'Active':
      styles = 'bg-green-50 text-green-700 border-green-200';
      label = 'Voting Active';
      break;
    case 'Closed':
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Voting Closed';
      break;
    case 'Published':
      styles = 'bg-purple-50 text-purple-700 border-purple-200';
      label = 'Results Published';
      break;
  }

  return (
    <span
      id={`status-${status.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${styles} ${className}`}
    >
      {status === 'Active' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      )}
      {label}
    </span>
  );
}
