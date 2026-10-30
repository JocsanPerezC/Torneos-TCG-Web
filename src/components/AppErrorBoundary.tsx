import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '@/i18n';
import { panel, primary } from '@/components/ui/classes';

type Props = { children: ReactNode };
type State = { failed: boolean };

/** Keeps an unexpected rendering or browser error from leaving a blank page. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidMount() {
    window.addEventListener('error', this.handleUnhandledError);
    window.addEventListener('unhandledrejection', this.handleUnhandledError);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleUnhandledError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledError);
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The user sees a stable message; diagnostics remain available in the browser console.
  }

  private handleUnhandledError = () => {
    this.setState({ failed: true });
  };

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-foreground">
        <section className={`${panel} w-full max-w-md text-center`}>
          <h1 className="text-2xl font-bold">{i18n.t('app.errorBoundary.title')}</h1>
          <p className="mt-2 text-sm text-ink-soft">{i18n.t('app.errorBoundary.description')}</p>
          <button className={`${primary} mt-5`} onClick={() => window.location.reload()}>
            {i18n.t('app.errorBoundary.reload')}
          </button>
        </section>
      </main>
    );
  }
}
