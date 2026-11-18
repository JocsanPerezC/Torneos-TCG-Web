import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const SCRIPT_ID = 'cloudflare-turnstile';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type Turnstile = {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export type TurnstileCaptchaHandle = { reset(): void };

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise<Turnstile>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');
    const ready = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile'));
    script.addEventListener('load', ready, { once: true });
    script.addEventListener('error', () => reject(new Error('Turnstile')), { once: true });
    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.append(script);
    }
  });
}

export const TurnstileCaptcha = forwardRef<
  TurnstileCaptchaHandle,
  {
    siteKey: string;
    onSuccess(token: string): void;
    onExpired(): void;
    onError(): void;
  }
>(function TurnstileCaptcha({ siteKey, onSuccess, onExpired, onError }, ref) {
  const element = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const callbacks = useRef({ onSuccess, onExpired, onError });

  useEffect(() => {
    callbacks.current = { onSuccess, onExpired, onError };
  }, [onError, onExpired, onSuccess]);

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    let active = true;
    void loadTurnstile()
      .then((turnstile) => {
        if (!active || !element.current) return;
        widgetId.current = turnstile.render(element.current, {
          sitekey: siteKey,
          callback: (token: string) => callbacks.current.onSuccess(token),
          'expired-callback': () => callbacks.current.onExpired(),
          'error-callback': () => callbacks.current.onError(),
        });
      })
      .catch(() => {
        if (active) callbacks.current.onError();
      });
    return () => {
      active = false;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
    };
  }, [siteKey]);

  return <div ref={element} className="flex justify-center" />;
});
