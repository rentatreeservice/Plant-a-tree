import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let isDatabaseError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed && parsed.error) {
            errorMessage = `Database Error: ${parsed.error}`;
            isDatabaseError = true;
          }
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-red-100 p-10 text-center">
            <div className="bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Oops! Something went wrong</h1>
            <p className="text-slate-500 mb-8">{errorMessage}</p>
            
            {isDatabaseError && (
              <div className="mb-8 p-4 bg-amber-50 rounded-2xl text-left text-sm text-amber-800 border border-amber-100">
                <p className="font-bold mb-1">Troubleshooting:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Check your internet connection</li>
                  <li>Ensure Firebase is properly configured</li>
                  <li>Try refreshing the page</li>
                </ul>
              </div>
            )}

            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-200"
            >
              <RefreshCcw className="h-5 w-5" />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
