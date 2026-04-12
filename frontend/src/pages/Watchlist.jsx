import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getAuthToken, watchlistAPI } from "../api/client";

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(getAuthToken()));
  const [loadError, setLoadError] = useState("");
  const [symbol, setSymbol] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [pendingAdd, setPendingAdd] = useState(false);
  const [removingSymbol, setRemovingSymbol] = useState(null);

  const loadWatchlist = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    setLoadError("");
    try {
      const data = await watchlistAPI.getWatchlist();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err.message || "Could not load your watchlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    loadWatchlist();
  }, [loadWatchlist]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        (a.symbol || "").localeCompare(b.symbol || "", undefined, {
          sensitivity: "base",
        })
      ),
    [items]
  );

  if (!getAuthToken()) {
    return <Navigate to="/login" replace />;
  }

  const handleAdd = async (event) => {
    event.preventDefault();
    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) {
      setStatus({ type: "error", message: "Enter a ticker symbol." });
      return;
    }

    setStatus({ type: "idle", message: "" });
    setPendingAdd(true);
    try {
      await watchlistAPI.addToWatchlist(trimmed);
      setSymbol("");
      setStatus({ type: "success", message: `Added ${trimmed} to your watchlist.` });
      await loadWatchlist();
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Could not add symbol.",
      });
    } finally {
      setPendingAdd(false);
    }
  };

  const handleRemove = async (sym) => {
    setStatus({ type: "idle", message: "" });
    setRemovingSymbol(sym);
    try {
      await watchlistAPI.removeFromWatchlist(sym);
      setStatus({ type: "success", message: `Removed ${sym} from your watchlist.` });
      await loadWatchlist();
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Could not remove symbol.",
      });
    } finally {
      setRemovingSymbol(null);
    }
  };

  const isBusy = pendingAdd || removingSymbol !== null;

  return (
    <div className="min-h-[calc(100vh-8rem)] text-slate-50">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-100">Watchlist</h1>
          <p className="mt-1 text-sm text-slate-400">
            Track ticker symbols you care about. Add or remove symbols below.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <h2 className="text-sm font-medium text-slate-300 mb-3">Add a symbol</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="symbol" className="sr-only">
                Ticker symbol
              </label>
              <input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="e.g. AAPL"
                disabled={isBusy}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm uppercase outline-none placeholder:normal-case placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              {pendingAdd ? "Adding…" : "Add symbol"}
            </button>
          </form>

          {status.type !== "idle" && (
            <p
              className={`mt-4 text-sm ${
                status.type === "error" ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {status.message}
            </p>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Your symbols</h2>

          {loading ? (
            <p className="text-sm text-slate-500">Loading watchlist…</p>
          ) : loadError ? (
            <div className="space-y-3">
              <p className="text-sm text-rose-400">{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  loadWatchlist();
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                Try again
              </button>
            </div>
          ) : sortedItems.length === 0 ? (
            <p className="text-sm text-slate-500">
              No symbols yet. Add a ticker above to get started.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800/80 overflow-hidden">
              {sortedItems.map(({ symbol: sym }) => (
                <li
                  key={sym}
                  className="flex items-center justify-between gap-4 bg-slate-950/40 px-4 py-3"
                >
                  <span className="font-mono text-sm font-medium text-slate-200">
                    {sym}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(sym)}
                    disabled={removingSymbol !== null}
                    className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-rose-500/60 hover:bg-rose-950/30 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    {removingSymbol === sym ? "Removing…" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
