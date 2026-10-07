import React from 'react';
import { NAtlasHealth } from '../../packages/shared/types.ts';

interface StatusBadgeProps {
  health: NAtlasHealth | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ health, loading, onRefresh }) => {
  if (loading || !health) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
        <span>Checking N-ATLaS...</span>
      </div>
    );
  }

  const isConnected = health.status === 'connected';
  const isMock = health.status === 'mock_mode' || health.mode === 'mock';

  let dotColor = 'bg-rose-500 shadow-rose-500/50';
  let badgeBorder = 'border-rose-900/50 bg-rose-950/20 text-rose-300';
  let statusText = 'NOT CONNECTED';

  if (isConnected) {
    dotColor = 'bg-emerald-400 shadow-emerald-400/50 animate-pulse';
    badgeBorder = 'border-emerald-900/50 bg-emerald-950/30 text-emerald-300';
    statusText = 'CONNECTED';
  } else if (isMock) {
    dotColor = 'bg-amber-400 shadow-amber-400/50';
    badgeBorder = 'border-amber-900/50 bg-amber-950/30 text-amber-300';
    statusText = 'DEVELOPMENT MOCK';
  } else if (health.status === 'degraded') {
    dotColor = 'bg-yellow-400';
    badgeBorder = 'border-yellow-900/50 bg-yellow-950/30 text-yellow-300';
    statusText = 'DEGRADED';
  }

  return (
    <div
      onClick={onRefresh}
      title="Click to re-ping N-ATLaS runtime status"
      className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer select-none ${badgeBorder}`}
    >
      <span className={`w-2 h-2 rounded-full shadow-sm ${dotColor}`} />
      <span className="font-semibold tracking-wider">{statusText}</span>
      <span className="text-slate-600">|</span>
      <span className="capitalize text-slate-300 font-sans text-xs">
        {health.mode === 'local' ? 'Local Model' : health.mode === 'api' ? 'Remote API' : 'Synthetic Mock'}
      </span>
      <span className="text-slate-600">|</span>
      <span className="text-slate-400 text-[11px] truncate max-w-[130px] group-hover:text-slate-200">
        NCAIR1/N-ATLaS
      </span>
    </div>
  );
};
