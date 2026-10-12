import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'gradient' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all cursor-pointer select-none whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101827] active:scale-[0.99]';

    const sizeStyles: Record<ButtonSize, string> = {
      xs: 'text-[11px] px-2.5 py-1 rounded-md gap-1.5 min-h-[28px]',
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-2 min-h-[34px]',
      md: 'text-xs px-4 py-2 rounded-lg gap-2 min-h-[40px]',
      lg: 'text-sm px-5 py-2.5 rounded-xl gap-2.5 min-h-[44px]',
    };

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[#1D4ED8] hover:bg-[#2563EB] active:bg-[#1E40AF] text-[#F8FAFC] shadow-sm shadow-blue-900/30 font-medium',
      gradient:
        'bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] hover:brightness-110 active:brightness-95 text-[#F8FAFC] font-semibold shadow-md shadow-blue-900/30',
      secondary:
        'bg-[#172235] hover:bg-[#1E293B] text-[#F8FAFC] border border-[#334155]/80 shadow-xs hover:border-[#38BDF8]/40',
      ghost:
        'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#172235]',
      danger:
        'bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-sm shadow-rose-900/20',
      outline:
        'border border-[#334155] text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#172235]/60 hover:border-[#38BDF8]/50',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
