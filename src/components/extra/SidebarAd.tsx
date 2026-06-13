'use client';

import { getSponsorConfig } from './config';
import { useAdDismiss } from './useAdDismiss';
import { AdWrapper } from './AdWrapper';

export function SidebarAd() {
  const sponsor = getSponsorConfig();
  const { dismissed, dismiss } = useAdDismiss('sidebar');
  if (!sponsor || dismissed) return null;

  return (
    <AdWrapper
      sponsor={sponsor}
      showDismiss
      onDismiss={dismiss}
      className="hidden md:block bg-card"
    >
      <div className="p-3 space-y-2">
        <span className="font-mono text-sm font-semibold text-primary">{sponsor.logoText}</span>
        <p className="text-xs text-foreground leading-relaxed">{sponsor.tagline}</p>
        <a
          href={sponsor.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${sponsor.name}, opens in new tab`}
          className="block text-center text-xs text-primary border border-primary/30 bg-primary/5 rounded-md py-1.5 hover:bg-primary/10 transition-colors"
        >
          {sponsor.ctaLabel} →
        </a>
        <p className="text-[9px] text-muted-foreground text-center pt-1 border-t border-border">
          Does not affect election data
        </p>
      </div>
    </AdWrapper>
  );
}
