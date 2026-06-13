import { getSponsorConfig } from './config';

export function SponsorBar() {
  const sponsor = getSponsorConfig();
  if (!sponsor) return null;

  return (
    <div
      role="complementary"
      aria-label="Platform sponsor"
      className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 bg-muted border-y border-border"
    >
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
        Platform sponsor
      </span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-semibold text-primary border border-primary/30 rounded px-2 py-0.5 bg-primary/5">
          {sponsor.logoText}
        </span>
        <span className="text-xs text-muted-foreground">{sponsor.tagline}</span>
      </div>
      <a
        href={sponsor.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${sponsor.name}, opens in new tab`}
        className="text-xs text-primary border border-primary/30 rounded-full px-3 py-0.5 hover:bg-primary/5 transition-colors"
      >
        {sponsor.ctaLabel}
      </a>
    </div>
  );
}
