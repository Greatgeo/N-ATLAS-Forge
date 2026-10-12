import React from 'react';
import { NAtlasHealth } from '../../packages/shared/types.ts';
import { CheckCircle2, AlertTriangle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';

interface StatusBadgeProps {
  health: NAtlasHealth | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ health, loading, onRefresh }) => {
  if (loading || !health) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#172235] border border-[#334155] text-xs text-[#94A3B8]">
        <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8] animate-spin" aria-hidden="true" />
        <span className="font-mono text-[11px]">Connecting N-ATLaS...</span>
      </div>
    );
  }

  const isConnected = health.status === 'connected';
  const isMock = health.status === 'mock_mode' || health.mode === 'mock';
  const isDegraded = health.status === 'degraded';

  let borderBg = 'border-rose-800/50 bg-rose-950/40 text-rose-300 hover:border-rose-700';
  let statusText = 'NOT CONNECTED';
  let statusIcon = <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />;

  if (isConnected) {
    borderBg = 'border-[#22C55E]/40 bg-[#22C55E]/15 text-[#22C55E] hover:border-[#22C55E]/60';
    statusText = 'CONNECTED';
    statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0" aria-hidden="true" />;
  } else if (isMock) {
    borderBg = 'border-[#F59E0B]/40 bg-[#F59E0B]/15 text-[#F59E0B] hover:border-[#F59E0B]/60';
    statusText = 'MOCK MODE';
    statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" aria-hidden="true" />;
  } else if (isDegraded) {
    borderBg = 'border-amber-700/50 bg-amber-950/40 text-amber-300 hover:border-amber-600';
    statusText = 'DEGRADED';
    statusIcon = <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={onRefresh}
      title="Click to ping N-ATLaS runtime status"
      className={`group flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-1 focus-visible:ring-offset-[#101827] ${borderBg}`}
    >
      {statusIcon}
      <span className="font-semibold tracking-wider text-[11px] whitespace-nowrap">{statusText}</span>
      <span className="text-[#334155] hidden sm:inline" aria-hidden="true">|</span>
      <span className="capitalize text-[#CBD5E1] font-sans text-[11px] hidden sm:inline whitespace-nowrap">
        {health.mode === 'local' ? 'Local Worker' : health.mode === 'api' ? 'Remote API' : 'Synthetic Mock'}
      </span>
      <span className="text-[#334155] hidden md:inline" aria-hidden="true">|</span>
      <span className="text-[#94A3B8] text-[11px] truncate max-w-[130px] group-hover:text-[#F8FAFC] hidden md:inline">
        NCAIR1/N-ATLaS
      </span>
    </button>
  );
};
