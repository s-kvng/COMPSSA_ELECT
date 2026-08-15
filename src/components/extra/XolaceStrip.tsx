'use client';

import Image from 'next/image';
import { useAdDismiss } from './useAdDismiss';

const WEB_URL = 'https://xolaceinc.com';

interface XolaceStripProps {
  placementKey: string;
  className?: string;
}

export function XolaceStrip({ placementKey, className }: XolaceStripProps) {
  const { dismissed, dismiss } = useAdDismiss(placementKey);
  if (dismissed) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-2.5 ${className ?? ''}`}
    >
      <a
        href={WEB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 min-w-0 group"
      >
        <div className="shrink-0 w-7 h-7 rounded-lg overflow-hidden border border-violet-200">
          <Image
            src="/campfire-mini.jpeg"
            alt="Xolace"
            width={28}
            height={28}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-[11px] text-slate-600 truncate">
          Built free for KTU COMPSSA by{' '}
          <span className="font-bold text-violet-700 group-hover:underline">Xolace</span> —
          emotional support, for when you need someone in your corner.
        </p>
      </a>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-slate-300 hover:text-slate-500 text-xs w-5 h-5 flex items-center justify-center"
      >
        ✕
      </button>
    </div>
  );
}
