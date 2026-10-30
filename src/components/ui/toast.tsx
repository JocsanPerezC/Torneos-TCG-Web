import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import i18n from '@/i18n';

type Toast = { id: number; message: ReactNode; error: boolean; exiting?: boolean };

let nextToastId = 0;
let toasts: Toast[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function dismissToast(id: number) {
  toasts = toasts.map((toast) => (toast.id === id ? { ...toast, exiting: true } : toast));
  notify();
  window.setTimeout(() => {
    toasts = toasts.filter((toast) => toast.id !== id);
    notify();
  }, 220);
}

export function showToast(message: ReactNode, error = false) {
  const id = nextToastId++;
  toasts = [...toasts, { id, message, error }];
  notify();
  window.setTimeout(() => {
    toasts = toasts.map((toast) => (toast.id === id ? { ...toast, exiting: true } : toast));
    notify();
  }, 3500);
  window.setTimeout(() => {
    toasts = toasts.filter((toast) => toast.id !== id);
    notify();
  }, 4000);
}

export function ToastViewport() {
  const [items, setItems] = useState(toasts);
  const nodes = useRef(new Map<number, HTMLElement>());
  const positions = useRef(new Map<number, number>());

  useEffect(() => {
    const update = () => setItems(toasts);
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  useLayoutEffect(() => {
    const nextPositions = new Map<number, number>();
    for (const toast of items) {
      const node = nodes.current.get(toast.id);
      if (!node) continue;
      const top = node.getBoundingClientRect().top;
      const previousTop = positions.current.get(toast.id);
      if (
        previousTop !== undefined &&
        previousTop !== top &&
        !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ) {
        node.animate(
          [{ transform: `translateY(${previousTop - top}px)` }, { transform: 'translateY(0)' }],
          { duration: 280, easing: 'ease-out' },
        );
      }
      nextPositions.set(toast.id, top);
    }
    positions.current = nextPositions;
  }, [items]);

  return (
    <div className="toast-viewport" aria-live="polite">
      {items.map((toast) => (
        <article
          key={toast.id}
          ref={(node) => {
            if (node) nodes.current.set(toast.id, node);
            else nodes.current.delete(toast.id);
          }}
          role={toast.error ? 'alert' : 'status'}
          data-tone={toast.error ? 'error' : 'success'}
          className={`app-toast ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}
        >
          <span className="app-toast__indicator" aria-hidden />
          <div className="app-toast__content">
            <strong>
              {i18n.t(toast.error ? 'app.toast.errorTitle' : 'app.toast.successTitle')}
            </strong>
            <div className="app-toast__description">{toast.message}</div>
          </div>
          <button
            type="button"
            className="app-toast__close"
            onClick={() => dismissToast(toast.id)}
            aria-label={i18n.t('app.toast.close')}
          >
            <X size={16} aria-hidden />
          </button>
        </article>
      ))}
    </div>
  );
}
