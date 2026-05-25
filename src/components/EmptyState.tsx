/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArchiveIcon } from '@hugeicons/core-free-icons';

interface EmptyStateProps {
  title: string;
  description: string;
  actionButton?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  actionButton,
  icon = <HugeiconsIcon icon={ArchiveIcon} className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
}: EmptyStateProps) {
  return (
    <div id="empty-state-container" className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-200 rounded-xl bg-white/40 backdrop-blur-sm shadow-xs max-w-md mx-auto my-6 animate-fade-in">
      <div className="p-3 bg-gray-50 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="font-sans text-xs text-gray-500 mb-5 leading-relaxed max-w-sm">{description}</p>
      {actionButton && <div className="w-full flex justify-center">{actionButton}</div>}
    </div>
  );
}
