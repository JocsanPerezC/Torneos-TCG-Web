import { Component, type ErrorInfo, type ReactNode } from 'react';

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
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
        <section className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 text-center shadow-xl">
          <h1 className="text-2xl font-bold">Ha ocurrido un error</h1>
          <p className="mt-2 text-sm text-slate-300">
            Actualiza la página para intentarlo de nuevo.
          </p>
          <button
            className="mt-5 rounded-lg bg-amber-400 px-4 py-2 font-bold text-slate-950 hover:bg-amber-300"
            onClick={() => window.location.reload()}
          >
            Actualizar página
          </button>
        </section>
      </main>
    );
  }
}
