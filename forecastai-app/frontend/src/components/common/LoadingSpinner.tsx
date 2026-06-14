import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: { width: 20, height: 20, borderWidth: 2 },
  md: { width: 32, height: 32, borderWidth: 2 },
  lg: { width: 48, height: 48, borderWidth: 3 },
};

export default function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const dims = sizeMap[size];

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className="spinner"
        style={{ width: dims.width, height: dims.height, borderWidth: dims.borderWidth }}
      />
      {text && <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
