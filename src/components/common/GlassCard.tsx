import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[#141415]/80 border-white/10 shadow-glass-md',
    elevated: 'bg-[#1E1E20]/90 border-white/15 shadow-glass-lg',
    subtle: 'bg-[#0E0E0F]/60 border-white/5 shadow-glass-sm',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-xl border backdrop-blur-md transition-all duration-200',
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
