/**
 * @fileoverview ErrorBoundary — catches React render errors gracefully.
 *
 * Wraps sections that make API calls so a broken widget doesn't crash
 * the entire dashboard. Shows a recovery UI with a retry button.
 */
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-text-primary">Something went wrong</p>
          <p className="text-sm text-text-muted mt-1 max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred in this section.'}
          </p>
        </div>
        <button
          onClick={() => this.reset()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border text-sm font-medium text-text-primary rounded-lg hover:bg-surface-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }
}
