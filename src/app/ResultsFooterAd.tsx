export function ResultsFooterAd() {
  const sponsor = getSponsorConfig();
  if (!sponsor) return null;

  return (
    <AdWrapper sponsor={sponsor} className="bg-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4">
        <div className="w-11 h-11 rounded-xl bg-muted border border-primary/30 flex items-center justify-center font-mono text-sm font-semibold text-primary shrink-0">
          {sponsor.logoText}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            This election ran on {sponsor.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{sponsor.tagline}</p>
        </div>
        
          href={sponsor.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Learn more about ${sponsor.name}, opens in new tab`}
          className="text-xs text-primary border border-primary/30 bg-primary/5 rounded-md px-4 py-2 hover:bg-primary/10 transition-colors shrink-0 sm:ml-auto"
        >
          {sponsor.ctaLabel} →
        </a>
      </div>
    </AdWrapper>
  );
}