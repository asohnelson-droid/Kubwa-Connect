import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
          <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mb-8 animate-bounce">
            <AlertTriangle className="text-red-500" size={48} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter">System Error</h1>
          <p className="text-gray-500 mb-10 max-w-xs text-sm font-medium leading-relaxed">
            We encountered an unexpected issue. Please try reloading the application.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-gray-800 transition-all shadow-xl hover:scale-105"
          >
            <RefreshCw size={18} /> Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}