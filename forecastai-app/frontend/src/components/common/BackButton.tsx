import React from 'react';
import { useAppStore } from '../../store/appStore';

export default function BackButton() {
  const goBack = useAppStore((s) => s.goBack);
  const canGoBack = useAppStore((s) => s.canGoBack);

  if (!canGoBack()) return null;

  return (
    <button
      onClick={goBack}
      className="btn-ghost inline-flex items-center gap-1.5"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}
