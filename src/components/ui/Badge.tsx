import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, XCircle, Info } from 'lucide-react';

export type BadgeTone = 'connected' | 'mock' | 'degraded' | 'disconnected' | 'neutral' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'xs' | 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  tone = 'neutral',
  size = 'sm',
  icon,
  className = '',
  ...props
}) => {
  const toneStyles: Record<BadgeTone, string> = {
    connected: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40',
    mock: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40',
    degraded: 'bg-amber-950/50 text-amber-300 border-amber-700/50',
    disconnected: 'bg-rose-950/50 text-rose-300 border-rose-800/50',
    neutral: 'bg-[#1E293B] text-[#CBD5E1] border-[#334155]',
    info: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40',
  };

  const defaultIcons: Record<BadgeTone, React.ReactNode> = {
    connected: <CheckCircle2 className="w-3 h-3 text-[#22C55E] shrink-0" aria-hidden="true" />,
    mock: <AlertTriangle className="w-3 h-3 text-[#F59E0B] shrink-0" aria-hidden="true" />,
    degraded: <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />,
    disconnected: <XCircle className="w-3 h-3 text-rose-400 shrink-0" aria-hidden="true" />,
    neutral: null,
    info: <Info className="w-3 h-3 text-[#38BDF8] shrink-0" aria-hidden="true" />,
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded gap-1 font-mono',
    sm: 'text-[11px] px-2 py-0.5 rounded-md gap-1.5 font-mono',
    md: 'text-xs px-2.5 py-1 rounded-md gap-2 font-mono',
  };

  const activeIcon = icon !== undefined ? icon : defaultIcons[tone];

  return (
    <span
      className={`inline-flex items-center border font-medium uppercase tracking-wider shrink-0 ${toneStyles[tone]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {activeIcon}
      <span>{children}</span>
    </span>
  );
};
