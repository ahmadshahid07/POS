import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const variantStyles = {
    default: 'bg-[#353536] text-[#EBEDF1] border-white/10',
    success: 'bg-[#16A34A]/15 text-[#4ADE80] border-[#16A34A]/30',
    warning: 'bg-[#D97706]/15 text-[#FBBF24] border-[#D97706]/30',
    danger: 'bg-[#DC2626]/15 text-[#F87171] border-[#DC2626]/30',
    info: 'bg-[#706F70]/20 text-[#D4D8DF] border-white/10',
    outline: 'bg-transparent text-[#ACADB1] border-white/20',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium rounded-full border tracking-wide uppercase',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
    >
      {children}
    </span>
  );
};
