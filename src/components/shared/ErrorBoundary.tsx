import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Shown instead of the children if they throw. Defaults to nothing (decorative visuals). */
  fallback?: ReactNode;
  label?: string;
}

interface State {
  failed: boolean;
}

/**
 * Keeps one broken visual (for example a WebGL scene on an unusual GPU)
 * from taking the whole page down.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`[${this.props.label ?? 'section'}] fell back after an error:`, error, info.componentStack);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
