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
    case 'draft':
      styles = 'bg-gray-100 text-gray-600 border-gray-200';
      label = 'Draft';
      break;
    case 'ready':
      styles = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Ready / Locked';
      break;
    case 'active':
      styles = 'bg-green-50 text-green-700 border-green-200';
      label = 'Voting Active';
      break;
    case 'closed':
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Voting Closed';
      break;
    case 'published':
      styles = 'bg-purple-50 text-purple-700 border-purple-200';
      label = 'Results Published';
      break;
  }

  return (
    <span
      id={`status-${status}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${styles} ${className}`}
    >
      {status === 'active' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      )}
      {label}
    </span>
  );
}
