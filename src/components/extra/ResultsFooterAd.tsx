'use client';

import Image from 'next/image';
import { useAdDismiss } from './useAdDismiss';

const WEB_URL = 'https://xolaceinc.com';
const IOS_URL = 'https://apps.apple.com/gh/app/xolace/id6761601429';
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.xolaceincorg.xolace';

export function ResultsFooterAd() {
  const { dismissed, dismiss } = useAdDismiss('results-footer');
  if (dismissed) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <Image
              src="/campfire-mini.jpeg"
              alt="Xolace"
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900">
              This platform was built free by{' '}
              <span className="text-violet-700">Xolace</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              End-to-end emotional support — for when you need someone in your corner.
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-slate-300 hover:text-slate-500 text-xs w-6 h-6 flex items-center justify-center mt-0.5"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <a
          href={WEB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs font-semibold text-violet-700 border border-violet-200 bg-violet-50 rounded-lg py-2 hover:bg-violet-100 transition-colors"
        >
          Website →
        </a>
        <a
          href={IOS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs font-semibold text-slate-700 border border-slate-200 bg-slate-50 rounded-lg py-2 hover:bg-slate-100 transition-colors"
        >
          App Store →
        </a>
        <a
          href={ANDROID_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs font-semibold text-slate-700 border border-slate-200 bg-slate-50 rounded-lg py-2 hover:bg-slate-100 transition-colors"
        >
          Google Play →
        </a>
      </div>

      <p className="text-[9px] font-mono text-slate-300 text-center mt-3">
        Sponsored · Does not affect election results
      </p>
    </div>
  );
}
