import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Sponsor } from '../types';

interface AdWrapperProps {
  sponsor: Sponsor;
  showDismiss?: boolean;
  onDismiss?: () => void;
  children: ReactNode;
  className?: string;
}

export function AdWrapper({
  sponsor,
  showDismiss,
  onDismiss,
  children,
  className,
}: AdWrapperProps) {
  return (
    <aside
      role="complementary"
      aria-label={`Sponsored content from ${sponsor.name}`}
      className={cn('rounded-xl border border-border overflow-hidden', className)}
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
          Sponsored · {sponsor.name}
        </span>
        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss ad"
            className="text-muted-foreground hover:text-foreground text-xs w-6 h-6 flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>
      {children}
    </aside>
  );
}