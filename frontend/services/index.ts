// FILE: frontend/services/index.ts
// services/index.ts

/**
 * Barrel exports for frontend services.
 *
 * Keep canonical services exported normally.
 * Re-export compatibility services with explicit aliases only when they collide
 * with canonical ethiKos/admin service names.
 */

export * from './ethikos'

export * from './admin'
export * from './decide'
export * from './impact'
export * from './learn'
export * from './pulse'

/* ------------------------------------------------------------------ */
/*  Audit aliases                                                     */
/* ------------------------------------------------------------------ */
/**
 * `admin.ts` intentionally exposes admin-friendly audit wrappers.
 * `audit.ts` is the canonical paginated audit-log service.
 *
 * Do not `export * from './audit'` here, because it collides with:
 * - AuditPayload
 * - LogRow
 * - fetchAuditLogs
 */
export {
  fetchAuditLogs as fetchCanonicalAuditLogs,
} from './audit'

export type {
  AuditPayload as CanonicalAuditPayload,
  AuditQueryParams as CanonicalAuditQueryParams,
  LogRow as CanonicalAuditLogRow,
} from './audit'

/* ------------------------------------------------------------------ */
/*  Deliberate compatibility aliases                                  */
/* ------------------------------------------------------------------ */
/**
 * `ethikos.ts` is canonical.
 * `deliberate.ts` is the Korum/Deliberate compatibility adapter.
 *
 * Do not `export * from './deliberate'` here, because it collides with:
 * - TopicDetailResponse
 * - TopicPreviewStatement
 * - fetchTopicArguments
 * - fetchTopicDetail
 * - fetchTopicPreview
 * - fetchTopicStances
 * - submitTopicStance
 */
export {
  createEliteTopic as createDeliberateEliteTopic,
  fetchEliteTopics as fetchDeliberateEliteTopics,
  fetchTopicArguments as fetchDeliberateTopicArguments,
  fetchTopicDetail as fetchDeliberateTopicDetail,
  fetchTopicPreview as fetchDeliberateTopicPreview,
  fetchTopicStances as fetchDeliberateTopicStances,
  submitTopicArgument as submitDeliberateTopicArgument,
  submitTopicStance as submitDeliberateTopicStance,
} from './deliberate'

export type {
  CreateEliteTopicPayload as DeliberateCreateEliteTopicPayload,
  EliteTopic as DeliberateEliteTopic,
  EliteTopicsResponse as DeliberateEliteTopicsResponse,
  SubmitTopicArgumentPayload as DeliberateSubmitTopicArgumentPayload,
  SubmitTopicStancePayload as DeliberateSubmitTopicStancePayload,
  TopicDetailResponse as DeliberateTopicDetailResponse,
  TopicDetailStatement as DeliberateTopicDetailStatement,
  TopicPreviewStatement as DeliberateTopicPreviewStatement,
  TopicStance as DeliberateTopicStance,
  TopicStanceValue as DeliberateTopicStanceValue,
} from './deliberate'