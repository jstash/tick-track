import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getAuthToken, pricesAPI, watchlistAPI } from "../api/client";

/**
 * DB stores UTC; naive ISO strings (no Z/offset) must be parsed as UTC.
 * Otherwise `new Date("2026-04-12T01:21:00")` is treated as *local* time in JS.
 */
function parseApiInstant(value) {
  if (value == null || value === "") return new Date(NaN);
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value);
  }
  const s = String(value).trim();
  if (/[zZ]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) {
    return new Date(s);
  }
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{1,2}:\d{2}/.test(s)) {
    return new Date(`${s.replace(" ", "T")}Z`);
  }
  return new Date(s);
}

function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return String(value);
  }
}

/** Display time in the user's local timezone (instant is UTC from API). */
function formatTimestampLocal(value) {
  if (value == null || value === "") return "—";
  const d = parseApiInstant(value);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    try {
      return d.toLocaleString();
    } catch {
      return d.toISOString();
    }
  }
}

/**
 * Tooltip: UTC time without Intl (avoids Safari/Chrome edge cases with
 * dateStyle + timeZone + timeZoneName in one call).
 */
function formatTimestampUtcTooltip(value) {
  if (value == null || value === "") return "";
  const d = parseApiInstant(value);
  if (Number.isNaN(d.getTime())) return "";
  return `Time in UTC: ${d.toISOString().replace("T", " ").replace("Z", " (UTC)")}`;
}

/** Short or IANA label for the user's timezone (for the column header). */
function getLocalTimeZoneLabel() {
  try {
    const d = new Date();
    const short = new Intl.DateTimeFormat(undefined, {
      timeZoneName: "short",
    })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")?.value;
    if (short) return short;
    const iana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (iana) return iana;
  } catch {
    /* ignore */
  }
  return "local";
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(getAuthToken()));
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoadError("");
    try {
      const list = await watchlistAPI.getWatchlist();
      const symbols = Array.isArray(list)
        ? list.map((item) => item.symbol).filter(Boolean)
        : [];

      if (symbols.length === 0) {
        setRows([]);
        return;
      }

      const tickersParam = symbols.join(",");
      const pricePayload = await pricesAPI.getPrices(tickersParam);
      const prices = Array.isArray(pricePayload?.prices)
        ? pricePayload.prices
        : [];

      const priceByTicker = new Map(
        prices
          .filter((p) => p && p.ticker != null)
          .map((p) => [String(p.ticker).toUpperCase(), p])
      );

      const sorted = [...symbols].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );

      setRows(
        sorted.map((sym) => {
          const ticker = String(sym).toUpperCase();
          const quote = priceByTicker.get(ticker);
          if (quote) {
            return {
              ticker,
              price: quote.price,
              timestamp: quote.timestamp,
            };
          }
          return {
            ticker,
            price: null,
            timestamp: null,
          };
        })
      );
    } catch (err) {
      setLoadError(err.message || "Could not load watchlist data.");
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [loadDashboard]);

  const localTimeZoneLabel = useMemo(() => getLocalTimeZoneLabel(), []);

  if (!getAuthToken()) {
    return <Navigate to="/login" replace />;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    setLoading(true);
    await loadDashboard();
  };

  const showTable = rows.length > 0;

  return (
    <div className="min-h-[calc(100vh-8rem)] text-slate-50">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Watchlist</h1>
            <p className="mt-1 text-sm text-slate-400">
              Latest prices for symbols on your watchlist.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="self-start rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {loading || refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {loadError ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
            <p className="text-sm text-rose-400">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadDashboard();
              }}
              className="mt-3 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Try again
            </button>
          </div>
        ) : loading && rows.length === 0 && !loadError ? (
          <p className="text-sm text-slate-500">Loading your watchlist…</p>
        ) : !showTable ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl">
            <p className="text-sm text-slate-400">
              Your watchlist is empty. Add symbols to see them here with live prices.
            </p>
            <Link
              to="/watchlist"
              className="mt-4 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              Configure
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50">
                    <th
                      scope="col"
                      className="px-4 py-3 font-medium text-slate-400"
                    >
                      Ticker
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-medium text-slate-400"
                    >
                      Latest price
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 font-medium text-slate-400"
                    >
                      Price time ({localTimeZoneLabel})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rows.map((row) => (
                    <tr key={row.ticker} className="bg-slate-950/30">
                      <td className="px-4 py-3 font-mono font-medium text-slate-200">
                        {row.ticker}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-100">
                        {row.price != null
                          ? formatPrice(row.price)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {row.timestamp != null ? (
                          <span
                            title={formatTimestampUtcTooltip(row.timestamp)}
                            className="cursor-help border-b border-dotted border-slate-500/80"
                          >
                            {formatTimestampLocal(row.timestamp)}
                          </span>
                        ) : (
                          "—"
                        )}
                        {row.price == null && (
                          <span className="ml-2 text-xs text-slate-500">
                            (no quote yet)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showTable && (
          <p className="mt-6 text-center text-xs text-slate-500">
            <Link to="/watchlist" className="text-indigo-400 hover:text-indigo-300">
              Configure
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
