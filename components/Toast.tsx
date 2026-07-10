'use client';

import type { ToastMessage } from '../src/types';

interface ToastProps {
  toasts: ToastMessage[];
}

export function Toast({ toasts }: ToastProps) {
  if (toasts.length === 0) return null;

  const icons: Record<string, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{icons[toast.type]}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
