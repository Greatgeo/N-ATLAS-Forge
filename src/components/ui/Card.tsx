import React from 'react';

export type CardVariant = 'standard' | 'elevated' | 'interactive' | 'metric';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'standard',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-xl transition-all';

  const paddingStyles: Record<string, string> = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-7',
  };

  const variantStyles: Record<CardVariant, string> = {
    standard: 'border border-[#334155]/80 bg-[#172235]/70 text-[#F8FAFC]',
    elevated: 'border border-[#334155] bg-[#172235] shadow-lg shadow-black/40 text-[#F8FAFC]',
    interactive:
      'border border-[#334155]/80 bg-[#172235]/50 hover:bg-[#172235]/90 hover:border-[#38BDF8]/40 cursor-pointer text-[#F8FAFC] group',
    metric: 'border border-[#334155]/80 bg-[#101827]/80 text-[#F8FAFC]',
  };

  return (
    <div
      className={`${baseStyles} ${paddingStyles[padding]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  unit?: string;
  icon?: React.ReactNode;
  tone?: 'cyan' | 'blue' | 'green' | 'amber' | 'slate';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  unit,
  icon,
  tone = 'cyan',
  className = '',
}) => {
  const toneTextStyles: Record<string, string> = {
    cyan: 'text-[#38BDF8]',
    blue: 'text-[#60A5FA]',
    green: 'text-[#22C55E]',
    amber: 'text-[#F59E0B]',
    slate: 'text-[#F8FAFC]',
  };

  return (
    <Card variant="metric" padding="sm" className={className}>
      <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-mono uppercase tracking-wider mb-1.5">
        <span>{label}</span>
        {icon && <span className="opacity-80 shrink-0">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${toneTextStyles[tone]}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-[#94A3B8] font-mono">{unit}</span>}
      </div>
      {subValue && (
        <div className="text-[11px] text-[#CBD5E1] mt-1 font-sans truncate">
          {subValue}
        </div>
      )}
    </Card>
  );
};
