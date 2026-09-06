// FILE: frontend/modules/insights/pages/CustomBuilderPage.tsx
"use client";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";

import MainLayout from "@/shared/layout/MainLayout";

import TimeRangePicker from "../components/TimeRangePicker";
import useReportStream from "../hooks/useReportStream";

type Range = [dayjs.Dayjs, dayjs.Dayjs];

type BuilderMetric = "smart-vote" | "usage" | "perf";
type BuilderGroupBy = "day" | "week";

interface BuilderState {
  metric: BuilderMetric;
  groupBy: BuilderGroupBy;
  includeRaw: boolean;
  range: Range;
}

interface StreamMessage {
  ts: string;
  direction: "in" | "out";
  payload: unknown;
}

export default function CustomBuilderPage() {
  // Keep the hook wired so it can evolve to manage the stream internally.
  useReportStream();

  const [builder, setBuilder] = useState<BuilderState>({
    metric: "smart-vote",
    groupBy: "day",
    includeRaw: false,
    range: [dayjs().subtract(7, "day"), dayjs()],
  });

  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "open" | "closed" | "error"
  >("idle");
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;

    setConnectionStatus("connecting");
    setLastError(null);

    const ws = new WebSocket(`${protocol}://${host}/ws/reports/custom`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("open");
    };

    ws.onerror = () => {
      setConnectionStatus("error");
      setLastError("Unable to open /ws/reports/custom WebSocket.");
    };

    ws.onclose = () => {
      setConnectionStatus((prev) => (prev === "error" ? prev : "closed"));
    };

    ws.onmessage = (event) => {
      let payload: unknown = event.data;
      if (typeof event.data === "string") {
        try {
          payload = JSON.parse(event.data);
        } catch {
          payload = event.data;
        }
      }

      setMessages((prev) => [
        {
          ts: new Date().toISOString(),
          direction: "in",
          payload,
        },
        ...prev,
      ]);
    };

    return () => {
      wsRef.current = null;
      ws.close();
    };
  }, []);

  const payload = useMemo(
    () => ({
      metric: builder.metric,
      group_by: builder.groupBy,
      include_raw_samples: builder.includeRaw,
      range: {
        from: builder.range[0].toISOString(),
        to: builder.range[1].toISOString(),
      },
    }),
    [builder],
  );

  const handleSend = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setLastError(
        "Live stream is not connected yet. Wait for status “Connected” and try again.",
      );
      return;
    }

    const outgoing = {
      kind: "custom-report-query",
      ...payload,
    };

    ws.send(JSON.stringify(outgoing));

    setMessages((prev) => [
      {
        ts: new Date().toISOString(),
        direction: "out",
        payload: outgoing,
      },
      ...prev,
    ]);
    setLastError(null);
  };

  const statusLabel =
    connectionStatus === "idle"
      ? "Idle"
      : connectionStatus === "connecting"
      ? "Connecting…"
      : connectionStatus === "open"
      ? "Connected"
      : connectionStatus === "closed"
      ? "Closed"
      : "Error";

  const statusDotClass =
    connectionStatus === "open"
      ? "bg-green-500"
      : connectionStatus === "error"
      ? "bg-red-500"
      : connectionStatus === "connecting"
      ? "bg-yellow-400"
      : "bg-gray-300";

  return (
    <MainLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Custom report builder</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span
            className={`inline-block h-2 w-2 rounded-full ${statusDotClass}`}
          />
          <span>{statusLabel}</span>
        </div>
      </div>

      <p className="mb-6 text-sm text-gray-600">
        Define an Insights query and send it over the live WebSocket stream.
        This page is a beta playground; the backend may still return only test
        data.
      </p>

      {lastError && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {lastError}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Query definition
            </h2>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Time range
              </label>
              <TimeRangePicker
                value={builder.range}
                onChange={(range) =>
                  setBuilder((prev) => ({
                    ...prev,
                    range,
                  }))
                }
              />
            </div>

            <div className="mb-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Metric
                </label>
                <select
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  value={builder.metric}
                  onChange={(e) =>
                    setBuilder((prev) => ({
                      ...prev,
                      metric: e.target.value as BuilderMetric,
                    }))
                  }
                >
                  <option value="smart-vote">Smart Vote</option>
                  <option value="usage">Usage</option>
                  <option value="perf">API performance</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Grouping
                </label>
                <select
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  value={builder.groupBy}
                  onChange={(e) =>
                    setBuilder((prev) => ({
                      ...prev,
                      groupBy: e.target.value as BuilderGroupBy,
                    }))
                  }
                >
                  <option value="day">By day</option>
                  <option value="week">By week</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  id="include-raw"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={builder.includeRaw}
                  onChange={(e) =>
                    setBuilder((prev) => ({
                      ...prev,
                      includeRaw: e.target.checked,
                    }))
                  }
                />
                <label
                  htmlFor="include-raw"
                  className="text-xs font-medium text-gray-600"
                >
                  Include raw samples
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSend}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={connectionStatus !== "open"}
            >
              Send to live stream
            </button>
          </section>
        </div>

        <div className="space-y-4">
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Payload preview
            </h2>
            <pre className="max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Live stream (debug)
            </h2>
            {messages.length === 0 ? (
              <p className="text-xs text-gray-500">
                No messages yet. When the backend starts emitting responses over
                /ws/reports/custom, they will appear here.
              </p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-auto rounded border border-gray-200 bg-white p-2 text-xs">
                {messages.map((msg, idx) => (
                  <li key={`${msg.ts}-${idx}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-gray-500">
                        {msg.ts}
                      </span>
                      <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] uppercase text-gray-600">
                        {msg.direction === "out" ? "Sent" : "Received"}
                      </span>
                    </div>
                    <pre className="overflow-auto rounded bg-gray-50 p-2">
                      {JSON.stringify(msg.payload, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
