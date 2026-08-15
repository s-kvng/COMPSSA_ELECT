'use client';

import usePresence from '@convex-dev/presence/react';
import { api } from '../../convex/_generated/api';

const ROOM_ID = 'compssa-elect-global';

interface LiveCounterProps {
  userId: string;
  className?: string;
}

export function LiveCounter({ userId, className }: LiveCounterProps) {
  const presenceState = usePresence(api.presence, ROOM_ID, userId);
  const onlineCount = presenceState?.filter((p) => p.online).length;

  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-700 shadow-2xs ${className ?? ''}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span>{onlineCount ?? '—'} online now</span>
    </div>
  );
}
