// FILE: frontend/services/admin.ts
import { get, patch, post } from './_request'
import type {
  LogRow as AuditLogRow,
  AuditPayload as AuditPayloadBase,
} from './audit'
import { fetchAuditLogs as fetchAuditLogsRaw } from './audit'
import type { DiscussionRole, EthikosId } from './ethikos'

/* ------------------------------------------------------------------ */
/*  Shared Admin types                                                */
/* ------------------------------------------------------------------ */

type UnknownRecord = Record<string, unknown>

export type ModerationStatus = 'Pending' | 'Resolved' | 'Escalated'
export type ModerationTargetType = 'topic' | 'post' | 'user'
export type ModerationSeverity = 'low' | 'medium' | 'high'
export type ModerationAction = 'approve' | 'remove'

export interface ModerationQueueItem {
  id: string
  targetType: ModerationTargetType
  targetId: string
  contextTitle?: string
  contentPreview?: string
  authorName?: string
  authorId?: string
  reporterName?: string
  reporterId?: string
  reason?: string
  reporterMessage?: string
  reportCount?: number
  createdAt?: string
  lastActionAt?: string
  status: ModerationStatus
  severity?: ModerationSeverity
}

export type Report = ModerationQueueItem

export interface ModerationPayload {
  items: ModerationQueueItem[]
}

export interface RoleRow {
  id: string
  name: string
  description?: string
  userCount: number
  enabled: boolean

  /**
   * Optional Wave 1 fields for role rows backed by DiscussionParticipantRole.
   * Existing admin/roles UI can keep using name/userCount/enabled.
   */
  userId?: string
  userName?: string
  role?: DiscussionRole
  topicId?: string
  topicTitle?: string
  assignedBy?: string
  createdAt?: string
}

export interface RolePayload {
  items: RoleRow[]
}

export type LogRow = AuditLogRow
export type AuditPayload = AuditPayloadBase

/* ------------------------------------------------------------------ */
/*  Normalization helpers                                             */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function unwrapPayload(raw: unknown): unknown {
  if (!isRecord(raw)) {
    return raw
  }

  return raw.data ?? raw
}

function extractItems(raw: unknown): unknown[] {
  const payload = unwrapPayload(raw)

  if (Array.isArray(payload)) {
    return payload
  }

  if (!isRecord(payload)) {
    return []
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.results)) {
    return payload.results
  }

  if (Array.isArray(payload.data)) {
    return payload.data
  }

  if (isRecord(payload.data) && Array.isArray(payload.data.items)) {
    return payload.data.items
  }

  if (isRecord(payload.data) && Array.isArray(payload.data.results)) {
    return payload.data.results
  }

  return []
}

function readString(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }

  return undefined
}

function readNumber(record: UnknownRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return undefined
}

function readBoolean(
  record: UnknownRecord,
  keys: string[],
  fallback = false,
): boolean {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()

      if (['true', '1', 'yes', 'enabled', 'active'].includes(normalized)) {
        return true
      }

      if (['false', '0', 'no', 'disabled', 'inactive'].includes(normalized)) {
        return false
      }
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value > 0
    }
  }

  return fallback
}

function coerceStatus(value: unknown): ModerationStatus {
  if (typeof value !== 'string') {
    return 'Pending'
  }

  const normalized = value.trim().toLowerCase()

  if (
    normalized === 'resolved' ||
    normalized === 'reviewed' ||
    normalized === 'closed'
  ) {
    return 'Resolved'
  }

  if (normalized === 'escalated') {
    return 'Escalated'
  }

  return 'Pending'
}

function coerceTargetType(value: unknown): ModerationTargetType {
  if (value === 'topic' || value === 'user' || value === 'post') {
    return value
  }

  if (
    value === 'argument' ||
    value === 'comment' ||
    value === 'message' ||
    value === 'reply'
  ) {
    return 'post'
  }

  return 'post'
}

function coerceSeverity(value: unknown): ModerationSeverity {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value
  }

  if (value === 'critical') {
    return 'high'
  }

  return 'medium'
}

function coerceDiscussionRole(value: unknown): DiscussionRole | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim().toLowerCase()

  if (
    normalized === 'owner' ||
    normalized === 'admin' ||
    normalized === 'editor' ||
    normalized === 'writer' ||
    normalized === 'suggester' ||
    normalized === 'viewer'
  ) {
    return normalized
  }

  return undefined
}

function normalizeModerationItem(
  item: UnknownRecord,
  index: number,
): ModerationQueueItem {
  const id =
    readString(item, ['id', 'reportId', 'report_id']) ??
    `moderation-report-${index}`

  return {
    id,
    targetType: coerceTargetType(
      item.targetType ??
        item.target_type ??
        item.entityType ??
        item.entity_type ??
        item.type,
    ),
    targetId:
      readString(item, [
        'targetId',
        'target_id',
        'argumentId',
        'argument_id',
        'postId',
        'post_id',
        'topicId',
        'topic_id',
        'userId',
        'user_id',
        'id',
      ]) ?? id,
    contextTitle: readString(item, [
      'contextTitle',
      'context_title',
      'threadTitle',
      'thread_title',
      'topicTitle',
      'topic_title',
      'debateTitle',
      'debate_title',
    ]),
    contentPreview: readString(item, [
      'content',
      'contentPreview',
      'content_preview',
      'contentSnippet',
      'content_snippet',
      'preview',
    ]),
    authorName: readString(item, [
      'authorName',
      'author_name',
      'offenderName',
      'offender_name',
      'user',
      'username',
      'author',
    ]),
    authorId: readString(item, [
      'authorId',
      'author_id',
      'offenderId',
      'offender_id',
      'userId',
      'user_id',
    ]),
    reporterName: readString(item, [
      'reporterName',
      'reporter_name',
      'reporter',
    ]),
    reporterId: readString(item, ['reporterId', 'reporter_id']),
    reason: readString(item, [
      'reason',
      'reportReason',
      'report_reason',
      'category',
      'type',
    ]),
    reporterMessage: readString(item, [
      'reporterMessage',
      'reporter_message',
      'message',
      'notes',
    ]),
    reportCount:
      readNumber(item, ['reportCount', 'report_count', 'count']) ?? 1,
    createdAt: readString(item, [
      'createdAt',
      'created_at',
      'timestamp',
      'reportedAt',
      'reported_at',
    ]),
    lastActionAt: readString(item, [
      'lastActionAt',
      'last_action_at',
      'updatedAt',
      'updated_at',
    ]),
    status: coerceStatus(item.status),
    severity: coerceSeverity(item.severity ?? item.priority),
  }
}

function normalizeRoleRow(item: UnknownRecord, index: number): RoleRow {
  const id =
    readString(item, ['id', 'roleId', 'role_id', 'userId', 'user_id']) ??
    `role-${index}`

  const role = coerceDiscussionRole(item.role)
  const userName = readString(item, [
    'userName',
    'user_name',
    'username',
    'user',
    'name',
  ])

  return {
    id,
    name:
      readString(item, ['name', 'label', 'title']) ??
      role ??
      userName ??
      `Role ${index + 1}`,
    description: readString(item, ['description', 'summary', 'details']),
    userCount:
      readNumber(item, [
        'userCount',
        'user_count',
        'count',
        'members',
        'member_count',
      ]) ?? 0,
    enabled: readBoolean(item, ['enabled', 'active', 'is_active'], true),

    userId: readString(item, ['userId', 'user_id']),
    userName,
    role,
    topicId: readString(item, ['topicId', 'topic_id', 'topic']),
    topicTitle: readString(item, ['topicTitle', 'topic_title']),
    assignedBy: readString(item, [
      'assignedBy',
      'assigned_by',
      'assigned_by_id',
    ]),
    createdAt: readString(item, ['createdAt', 'created_at']),
  }
}

function normalizeModerationPayload(raw: unknown): ModerationPayload {
  return {
    items: extractItems(raw)
      .filter(isRecord)
      .map((item, index) => normalizeModerationItem(item, index)),
  }
}

function normalizeRolePayload(raw: unknown): RolePayload {
  return {
    items: extractItems(raw)
      .filter(isRecord)
      .map((item, index) => normalizeRoleRow(item, index)),
  }
}

/* ------------------------------------------------------------------ */
/*  API calls                                                         */
/* ------------------------------------------------------------------ */

export async function fetchModerationQueue(): Promise<ModerationPayload> {
  const payload = await get<unknown>('admin/moderation')
  return normalizeModerationPayload(payload)
}

export async function actOnReport(
  id: string,
  remove: boolean,
): Promise<void> {
  await post<void>(`admin/moderation/${encodeURIComponent(id)}`, { remove })
}

export async function fetchRoles(): Promise<RolePayload> {
  const payload = await get<unknown>('admin/roles')
  return normalizeRolePayload(payload)
}

export async function toggleRole(
  id: string,
  enabled: boolean,
): Promise<void> {
  await patch<void>(`admin/roles/${encodeURIComponent(id)}`, { enabled })
}

/**
 * Convenience wrapper for audit logs used by the Admin UI.
 * It delegates to the canonical implementation in services/audit
 * and intentionally exposes a no-arg signature so that
 * `useRequest<AuditPayload, []>(fetchAuditLogs)` keeps working.
 */
export async function fetchAuditLogs(): Promise<AuditPayload> {
  return fetchAuditLogsRaw()
}

/**
 * Compatibility names for pages that use explicit Ethikos admin wording.
 */
export const fetchEthikosModerationQueue = fetchModerationQueue
export const actOnEthikosReport = actOnReport
export const fetchEthikosRoles = fetchRoles
export const toggleEthikosRole = toggleRole

export type AdminRoleId = EthikosId