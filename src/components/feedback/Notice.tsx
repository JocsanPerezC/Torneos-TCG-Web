import { useEffect, useRef } from 'react';
import { showToast } from '../ui/toast';
import i18n from '../../i18n';

export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  const validationMessages = [
    i18n.t('app.messages.completeResults'),
    i18n.t('app.messages.outcomeRequired'),
  ];
  const isError = error || (typeof children === 'string' && validationMessages.includes(children));
  const shown = useRef<{ children: React.ReactNode; error: boolean } | undefined>(undefined);
  useEffect(() => {
    const previous = shown.current;
    if (previous && previous.children === children && previous.error === isError) return;
    shown.current = { children, error: isError };
    showToast(children, isError);
  }, [children, isError]);
  return null;
}
