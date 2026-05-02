import React, { useEffect, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
};

const styles: Record<ToastType, { bg: string; border: string; icon: string; progress: string }> = {
  success: {
    bg: 'bg-[#0a1a0e]',
    border: 'border-emerald-500/30',
    icon: 'bg-emerald-500/15 text-emerald-400',
    progress: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-[#1a0a0a]',
    border: 'border-red-500/30',
    icon: 'bg-red-500/15 text-red-400',
    progress: 'bg-red-500',
  },
  info: {
    bg: 'bg-[#0a0f1a]',
    border: 'border-blue-500/30',
    icon: 'bg-blue-500/15 text-blue-400',
    progress: 'bg-blue-500',
  },
  warning: {
    bg: 'bg-[#1a130a]',
    border: 'border-amber-500/30',
    icon: 'bg-amber-500/15 text-amber-400',
    progress: 'bg-amber-500',
  },
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const s = styles[toast.type];
  const duration = toast.duration ?? 4500;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [leaving, setLeaving] = React.useState(false);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 320);
  };

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, duration);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      className={`
        group relative flex items-start gap-3 min-w-[320px] max-w-[420px]
        ${s.bg} border ${s.border} rounded-2xl p-4 shadow-2xl
        backdrop-blur-xl overflow-hidden cursor-pointer
        transition-all duration-300 ease-out select-none
        ${leaving
          ? 'opacity-0 translate-x-8 scale-95'
          : 'opacity-100 translate-x-0 scale-100 animate-toast-in'}
      `}
      onClick={dismiss}
      role="alert"
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${s.icon}`}>
        {icons[toast.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[13px] font-bold text-white leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-[12px] text-zinc-400 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>

      {/* Dismiss × */}
      <button
        className="flex-shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5 opacity-0 group-hover:opacity-100"
        onClick={e => { e.stopPropagation(); dismiss(); }}
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-[2px] ${s.progress} opacity-60 rounded-full`}
        style={{
          width: '100%',
          animation: `toast-progress ${duration}ms linear forwards`,
        }}
      />
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => (
  <div
    className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
    aria-live="polite"
    aria-label="Notifications"
  >
    {toasts.map(t => (
      <div key={t.id} className="pointer-events-auto">
        <ToastItem toast={t} onDismiss={onDismiss} />
      </div>
    ))}
  </div>
);

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const show = (type: ToastType, title: string, message?: string, duration?: number) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  };

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return {
    toasts,
    dismiss,
    success: (title: string, message?: string) => show('success', title, message),
    error:   (title: string, message?: string) => show('error',   title, message),
    info:    (title: string, message?: string) => show('info',    title, message),
    warning: (title: string, message?: string) => show('warning', title, message),
  };
}
