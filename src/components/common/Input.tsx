import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-[#ACADB1] tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#706F70] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={twMerge(
              clsx(
                'w-full rounded-xl bg-[#0E0E0F]/80 border border-white/10 px-3.5 py-2 text-sm text-[#EBEDF1]',
                'placeholder-[#706F70] transition-all duration-150',
                'focus:outline-none focus:border-[#D4D8DF] focus:ring-1 focus:ring-[#D4D8DF]/30',
                leftIcon && 'pl-9',
                rightIcon && 'pr-9',
                error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20',
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[#706F70] flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-[11px] text-[#F87171]">{error}</span>}
        {!error && helperText && (
          <span className="text-[11px] text-[#706F70]">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
