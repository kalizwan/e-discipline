import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  // Use ref to avoid stale closure in setTimeout
  const timersRef = useRef({});

  const dismissToast = useCallback((id) => {
    // Mark as exiting for animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    // Remove after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 280);
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message, duration, exiting: false }]);

    // Auto-dismiss after duration
    timersRef.current[id] = setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        delete timersRef.current[id];
      }, 280);
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
