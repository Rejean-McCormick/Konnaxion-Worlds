// FILE: frontend/services/audit.ts
// services/audit.ts
import { get } from './_request'

/**
 * Canonical audit-log row shape.
 * Includes both the simple Admin UI fields and richer backend metadata.
 */
export interface LogRow {
  /** Unique identifier of the log entry */
  id: string

  /** ISO timestamp when the event occurred */
  ts: string

  /** User or service that triggered the action */
  actor: string

  /** Logical action identifier, e.g. "UPDATE_TOPIC" */
  action: string

  /** Human‑readable target used in the admin UI (topic title, user name, etc.) */
  target?: string

  /** Severity used by the admin UI to color the tag */
  severity?: 'info' | 'warn' | 'critical'

  /** Machine‑oriented entity type, e.g. "topic", "argument", "user" */
  entity?: string

  /** Primary key of the entity in the source system */
  entityId?: string

  /** Source IP address, if tracked */
  ip?: string

  /** Outcome of the operation from the backend point of view */
  status?: 'ok' | 'warn' | 'error'

  /** Free‑form JSON payload with extra context */
  meta?: Record<string, unknown>
}

export interface AuditPayload {
  items: LogRow[]
  page: number
  pageSize: number
  total: number
}

export interface AuditQueryParams {
  page?: number
  pageSize?: number
  q?: string
  sort?: string
  /** Optional server‑side filter by severity */
  severity?: LogRow['severity']
}

/**
 * GET /admin/audit/logs
 * Paginated, filterable audit log stream.
 * Aligned with backend path "admin/audit/logs" and the global services/_request baseURL.
 */
export async function fetchAuditLogs(
  params?: AuditQueryParams,
): Promise<AuditPayload> {
  return get<AuditPayload>('admin/audit/logs', { params })
}
