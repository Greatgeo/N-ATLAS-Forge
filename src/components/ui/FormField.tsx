import React, { useId } from 'react';

export interface FormFieldProps {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  required?: boolean;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  helperText,
  errorMessage,
  required,
  id,
  children,
  className = '',
}) => {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const helperId = helperText ? `${fieldId}-helper` : undefined;
  const errorId = errorMessage ? `${fieldId}-error` : undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-[#CBD5E1] font-mono text-xs font-medium"
        >
          {label}
          {required && <span className="text-[#38BDF8] ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      {children}

      {errorMessage && (
        <p id={errorId} className="text-rose-400 text-xs mt-1 font-mono flex items-center gap-1" role="alert">
          <span>{errorMessage}</span>
        </p>
      )}

      {!errorMessage && helperText && (
        <p id={helperId} className="text-[#94A3B8] text-[11px] mt-1 font-sans">
          {helperText}
        </p>
      )}
    </div>
  );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isInvalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', isInvalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={isInvalid}
        className={`w-full px-3 py-2 rounded-lg bg-[#101827] border text-[#F8FAFC] text-xs transition-colors placeholder:text-[#94A3B8]/60 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:border-[#38BDF8] ${
          isInvalid ? 'border-rose-500 focus-visible:ring-rose-500/50' : 'border-[#334155] hover:border-[#38BDF8]/40'
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isInvalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', isInvalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={isInvalid}
        className={`w-full px-3 py-2.5 rounded-lg bg-[#101827] border text-[#F8FAFC] text-xs transition-colors placeholder:text-[#94A3B8]/60 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:border-[#38BDF8] ${
          isInvalid ? 'border-rose-500 focus-visible:ring-rose-500/50' : 'border-[#334155] hover:border-[#38BDF8]/40'
        } ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  isInvalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', isInvalid, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        aria-invalid={isInvalid}
        className={`w-full px-3 py-2 rounded-lg bg-[#101827] border text-[#F8FAFC] text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:border-[#38BDF8] ${
          isInvalid ? 'border-rose-500 focus-visible:ring-rose-500/50' : 'border-[#334155] hover:border-[#38BDF8]/40'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
