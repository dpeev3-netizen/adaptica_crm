"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught rendering error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div className="p-6 rounded-2xl bg-error-container text-on-error-container flex flex-col items-center justify-center gap-2 border border-error/20">
          <AlertTriangle size={32} className="text-error" />
          <h2 className="md-title-medium font-bold">Something went wrong</h2>
          <p className="md-body-medium text-center opacity-80 max-w-sm">
            {this.state.error?.message || "A rendering error occurred in this module."}
          </p>
          <button
            className="mt-2 px-4 py-2 rounded-full bg-error text-on-error text-sm font-bold shadow-sm"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
