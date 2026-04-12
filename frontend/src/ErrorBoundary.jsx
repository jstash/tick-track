import { Component } from "react";
import { Link } from "react-router-dom";

/**
 * Catches render errors in children so the whole app does not go blank.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg rounded-xl border border-rose-900/60 bg-slate-900/90 p-8 text-slate-200 shadow-xl">
          <h1 className="text-lg font-semibold text-rose-200">
            Something went wrong on this page
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            A rendering error occurred. You can reload or go home and try again.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
            >
              Reload page
            </button>
            <Link
              to="/"
              className="inline-flex items-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
