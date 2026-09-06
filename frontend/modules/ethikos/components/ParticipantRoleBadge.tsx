// FILE: frontend/modules/ethikos/components/ParticipantRoleBadge.tsx
'use client'

import { Space, Tag, Tooltip, Typography } from 'antd'
import React from 'react'

import type {
  DiscussionParticipantRoleApi,
  DiscussionRole,
} from '@/services/ethikos'

const { Text } = Typography

const ROLE_LABELS: Record<DiscussionRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  writer: 'Writer',
  suggester: 'Suggester',
  viewer: 'Viewer',
}

const ROLE_COLORS: Record<DiscussionRole, string> = {
  owner: 'gold',
  admin: 'red',
  editor: 'blue',
  writer: 'green',
  suggester: 'purple',
  viewer: 'default',
}

const ROLE_DESCRIPTIONS: Record<DiscussionRole, string> = {
  owner: 'Full discussion ownership and governance authority.',
  admin: 'Can administer discussion settings and participant roles.',
  editor: 'Can edit or curate discussion content.',
  writer: 'Can write arguments and replies.',
  suggester: 'Can suggest arguments for review.',
  viewer: 'Can view the discussion.',
}

type ParticipantRoleBadgeParticipant = Partial<
  Omit<DiscussionParticipantRoleApi, 'role' | 'user_id' | 'assigned_by_id'>
> & {
  role?: DiscussionRole | string | null
  user_id?: string | number | null
  assigned_by_id?: string | number | null
}

export interface ParticipantRoleBadgeProps {
  role?: DiscussionRole | string | null
  participant?: ParticipantRoleBadgeParticipant | null
  userLabel?: React.ReactNode
  assignedByLabel?: React.ReactNode
  showUser?: boolean
  showAssignedBy?: boolean
  showDescription?: boolean
  compact?: boolean
}

function normalizeRole(role?: DiscussionRole | string | null): DiscussionRole {
  if (
    role === 'owner' ||
    role === 'admin' ||
    role === 'editor' ||
    role === 'writer' ||
    role === 'suggester' ||
    role === 'viewer'
  ) {
    return role
  }

  return 'viewer'
}

function stringifyLabel(value?: string | number | null): string | undefined {
  if (value === undefined || value === null) return undefined

  const label = String(value).trim()
  return label || undefined
}

function participantUserLabel(
  participant?: ParticipantRoleBadgeParticipant | null,
): string | undefined {
  if (!participant) return undefined

  const user = stringifyLabel(participant.user)
  if (user) return user

  if (participant.user_id !== undefined && participant.user_id !== null) {
    return `User ${participant.user_id}`
  }

  return undefined
}

function participantAssignedByLabel(
  participant?: ParticipantRoleBadgeParticipant | null,
): string | undefined {
  if (!participant) return undefined

  const assignedBy = stringifyLabel(participant.assigned_by)
  if (assignedBy) return assignedBy

  if (
    participant.assigned_by_id !== undefined &&
    participant.assigned_by_id !== null
  ) {
    return `User ${participant.assigned_by_id}`
  }

  return undefined
}

export default function ParticipantRoleBadge({
  role,
  participant,
  userLabel,
  assignedByLabel,
  showUser = false,
  showAssignedBy = false,
  showDescription = true,
  compact = false,
}: ParticipantRoleBadgeProps): JSX.Element {
  const normalizedRole = normalizeRole(role ?? participant?.role)
  const label = ROLE_LABELS[normalizedRole]
  const color = ROLE_COLORS[normalizedRole]
  const description = ROLE_DESCRIPTIONS[normalizedRole]

  const resolvedUserLabel = userLabel ?? participantUserLabel(participant)
  const resolvedAssignedByLabel =
    assignedByLabel ?? participantAssignedByLabel(participant)

  const badge = (
    <Tag color={color} style={{ marginInlineEnd: 0 }}>
      {label}
    </Tag>
  )

  const tooltipTitle =
    showAssignedBy && resolvedAssignedByLabel
      ? `${description} Assigned by ${resolvedAssignedByLabel}.`
      : description

  const content =
    showDescription && !compact ? (
      <Tooltip title={tooltipTitle}>{badge}</Tooltip>
    ) : (
      badge
    )

  if (!showUser || !resolvedUserLabel) {
    return content
  }

  return (
    <Space size={6} wrap>
      <Text>{resolvedUserLabel}</Text>
      {content}
      {showAssignedBy && resolvedAssignedByLabel ? (
        <Text type="secondary">assigned by {resolvedAssignedByLabel}</Text>
      ) : null}
    </Space>
  )
}

export {
  ROLE_COLORS as PARTICIPANT_ROLE_COLORS,
  ROLE_DESCRIPTIONS as PARTICIPANT_ROLE_DESCRIPTIONS,
  ROLE_LABELS as PARTICIPANT_ROLE_LABELS,
  normalizeRole as normalizeParticipantRole,
}