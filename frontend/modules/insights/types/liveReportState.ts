// FILE: frontend/modules/insights/types/liveReportState.ts
// modules/insights/types/liveReportState.ts

/**
 * Connection status of the live report stream.
 *
 * This is intentionally generic so the backend can refine the contract
 * without forcing a breaking change on the frontend.
 */
export type LiveReportConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface LiveReportError {
  /** Stable machine-readable error code (e.g. "AUTH_FAILED", "TIMEOUT"). */
  code: string;
  /** Human-readable explanation, suitable for logs or UI. */
  message: string;
  /** Optional backend-supplied details (stack, context, etc.). */
  details?: unknown;
}

/**
 * A single time-bucketed data point emitted by the stream.
 * Used to drive preview charts in the custom report builder.
 */
export interface LiveReportSample {
  /** ISO timestamp for the sample (UTC). */
  ts: string;
  /** Optional human-readable label, bucket name, etc. */
  label?: string;
  /**
   * Arbitrary numeric metrics for this sample, keyed by metric name.
   * Example keys: "count", "avg_score", "p95_latency_ms".
   */
  metrics: Record<string, number | null>;
  /**
   * Optional raw payload from the backend for debugging or drill-down.
   * Keep this opaque from the UI perspective.
   */
  raw?: unknown;
}

/**
 * Lightweight summary of the latest window of data the builder is looking at.
 */
export interface LiveReportSummary {
  /** Unique identifier for the query / report definition, if provided. */
  queryId?: string;
  /** Total number of samples seen in the current window. */
  sampleCount?: number;
  /** Duration of the last query in milliseconds, if known. */
  durationMs?: number;
  /**
   * Arbitrary aggregate metrics, keyed by metric name.
   * Example keys: "total_votes", "avg_score", "error_rate_pct".
   */
  aggregates?: Record<string, number | null>;
  /** Additional backend-supplied metadata (e.g. source table, filters). */
  meta?: Record<string, unknown>;
}

/**
 * High-level shape of events emitted on the stream.
 * This union is narrow but extensible via the 'custom' variant.
 */
export type LiveReportEvent =
  | { kind: 'connected'; at: string }
  | { kind: 'disconnected'; at: string; reason?: string }
  | { kind: 'reconnecting'; at: string; attempt: number }
  | { kind: 'error'; at: string; error: LiveReportError }
  | { kind: 'sample'; at: string; sample: LiveReportSample }
  | { kind: 'summary'; at: string; summary: LiveReportSummary }
  | { kind: 'keepalive'; at: string; payload?: unknown }
  | { kind: 'custom'; at: string; type: string; payload: unknown };

/**
 * Connection-related state for the live stream.
 */
export interface LiveReportConnectionState {
  status: LiveReportConnectionStatus;
  /** When we last successfully connected, in ISO format. */
  lastConnectedAt?: string;
  /** When we last received any event on the stream, in ISO format. */
  lastEventAt?: string;
  /** Last error, if the stream is in a degraded state. */
  lastError?: LiveReportError | null;
  /** How many reconnection attempts have been made in this session. */
  reconnectAttempts: number;
}

/**
 * Root state object returned by useReportStream().
 *
 * CustomBuilderPage currently renders this via JSON.stringify, so it is
 * safe to add new optional fields here without breaking the UI.
 */
export interface LiveReportState {
  /** Connection details for the underlying socket / stream. */
  connection: LiveReportConnectionState;

  /**
   * Optional logical group name the user is currently subscribed to
   * (e.g. "reports_user_<id>" or a specific report slug).
   */
  group?: string | null;

  /**
   * If the builder is scoped to a particular report definition,
   * this can be used to track that identifier.
   */
  activeReportId?: string | null;

  /** Rolling window of the most recent samples for preview charts. */
  samples: LiveReportSample[];

  /** Most recent aggregates / summary, if the backend emits them. */
  summary?: LiveReportSummary;

  /**
   * Raw event log, useful for debugging and future UI affordances
   * (timeline, activity summary, etc.).
   */
  events: LiveReportEvent[];
}

/**
 * Convenience constant for useReportStream() initial state.
 */
export const initialLiveReportState: LiveReportState = {
  connection: {
    status: 'idle',
    reconnectAttempts: 0,
    lastError: null,
  },
  group: null,
  activeReportId: null,
  samples: [],
  summary: undefined,
  events: [],
};
