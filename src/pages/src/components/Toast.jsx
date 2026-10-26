import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from './ToastContext';

const ICONS = {
  success: <CheckCircle2 size={20} color="var(--success)" />,
  danger:  <XCircle     size={20} color="var(--danger)"  />,
  warning: <AlertTriangle size={20} color="var(--warning)" />,
  info:    <Info        size={20} color="var(--info)"    />,
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifikasi">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type} ${toast.exiting ? 'exiting' : ''}`}
          role="alert"
        >
          <span className="toast-icon">{ICONS[toast.type] || ICONS.info}</span>

          <div className="toast-body">
            {toast.title && <div className="toast-title">{toast.title}</div>}
            {toast.message && <div className="toast-message">{toast.message}</div>}
          </div>

          <button
            className="toast-close"
            onClick={() => dismissToast(toast.id)}
            aria-label="Tutup notifikasi"
          >
            <X size={16} />
          </button>

          {/* Progress bar */}
          <div
            className="toast-progress"
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      ))}
    </div>
  );
}
