import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  durationMs = 4000,
}) => {
  useEffect(() => {
    if (durationMs > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [durationMs, onClose]);

  const typeConfig: Record<
    ToastType,
    { icon: React.ReactNode; border: string; bg: string; text: string }
  > = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />,
      border: 'border-[#22C55E]/40',
      bg: 'bg-[#172235]/95',
      text: 'text-[#F8FAFC]',
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
      border: 'border-rose-800/80',
      bg: 'bg-rose-950/95',
      text: 'text-rose-100',
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
      border: 'border-amber-700/80',
      bg: 'bg-amber-950/95',
      text: 'text-amber-100',
    },
    info: {
      icon: <Info className="w-4 h-4 text-[#38BDF8] shrink-0" />,
      border: 'border-[#38BDF8]/40',
      bg: 'bg-[#172235]/95',
      text: 'text-[#F8FAFC]',
    },
  };

  const current = typeConfig[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all flex items-start gap-3 ${current.border} ${current.bg} ${current.text}`}
    >
      <div className="pt-0.5">{current.icon}</div>
      <div className="flex-1 text-xs space-y-0.5">
        {title && <div className="font-semibold font-mono uppercase tracking-wider text-[#38BDF8]">{title}</div>}
        <div className="leading-relaxed text-[#CBD5E1]">{message}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-md hover:bg-white/10 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5 text-current" />
      </button>
    </div>
  );
};
