import { useEffect, useRef, useState } from 'react';
import { subscribeToToasts } from '../utils/toast';

const typeStyles = {
  info: 'bg-blue-50 border-blue-300 text-blue-900',
  success: 'bg-green-50 border-green-300 text-green-900',
  error: 'bg-red-50 border-red-300 text-red-900',
  warning: 'bg-amber-50 border-amber-300 text-amber-900',
};

const typeIcons = {
  info: (
    <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
  ),
  success: (
    <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/>
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  ),
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((prev) => [...prev, toast].slice(-5));

      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
        timersRef.current.delete(toast.id);
      }, toast.duration);

      timersRef.current.set(toast.id, timer);
    });

    return () => {
      unsubscribe();
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const dismissToast = (id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-120 flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto w-80 border rounded-xl shadow-xl px-4 py-3 text-sm font-medium animate-slide-in ${
            typeStyles[toast.type] || typeStyles.info
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {typeIcons[toast.type] || typeIcons.info}
            <p className="flex-1 leading-5 pt-0.5">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
