import React from 'react';
import { classNames } from '../../utils/formatters';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit';
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
} as const;

const variantClasses = {
  primary:
    'text-white font-semibold shadow-lg hover:shadow-xl active:scale-[0.98]',
  secondary:
    'border font-medium hover:shadow-md active:scale-[0.98]',
  ghost:
    'font-medium hover:active:scale-[0.98]',
  destructive:
    'text-white font-semibold shadow-lg hover:shadow-xl active:scale-[0.98]',
} as const;

function Spinner() {
  return (
    <svg
      className="animate-spin -ml-1 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  className,
  type = 'button',
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--accent, #C8A86B)',
      color: '#fff',
      borderRadius: '9999px',
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: 'var(--border, rgba(200,168,107,0.3))',
      color: 'var(--text-primary, #F5F0E8)',
      borderRadius: '9999px',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary, #B8B0A0)',
    },
    destructive: {
      backgroundColor: '#DC2626',
      color: '#fff',
      borderRadius: '9999px',
    },
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={classNames(
        'inline-flex items-center justify-center gap-2 transition-all duration-200',
        sizeClasses[size],
        variantClasses[variant],
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      style={variantStyles[variant]}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
