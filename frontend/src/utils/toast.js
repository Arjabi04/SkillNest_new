const listeners = new Set();
let nextToastId = 1;

export const subscribeToToasts = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emitToast = (toast) => {
  listeners.forEach((listener) => listener(toast));
};

export const showToast = (message, options = {}) => {
  if (!message) return;

  emitToast({
    id: nextToastId++,
    message: String(message),
    type: options.type || 'info',
    duration: typeof options.duration === 'number' ? options.duration : 3500,
  });
};

export const toast = {
  info: (message, options = {}) => showToast(message, { ...options, type: 'info' }),
  success: (message, options = {}) => showToast(message, { ...options, type: 'success' }),
  error: (message, options = {}) => showToast(message, { ...options, type: 'error' }),
  warning: (message, options = {}) => showToast(message, { ...options, type: 'warning' }),
};
