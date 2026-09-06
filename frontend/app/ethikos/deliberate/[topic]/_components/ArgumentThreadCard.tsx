'use client'

import {
  BranchesOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { ProCard } from '@ant-design/pro-components'
import { Alert, Button, Space, Tag, Tooltip, Typography } from 'antd'

import ArgumentTree from '@/modules/ethikos/components/ArgumentTree'
import type { ArgumentTreeItem, ArgumentTreeNode } from '@/modules/ethikos/components/ArgumentTree'
import type { TopicDetailStatement } from '@/services/deliberate'

import { sideColor, sideLabel } from '../_lib/topicThreadUtils'

const { Text } = Typography

export interface ParticipantContextTarget {
  userId: string
  displayName: string
}

type NarrativeKind = 'announcement' | 'moderation' | 'conflict' | 'recusal' | null

function rawStatement(argument: ArgumentTreeNode): TopicDetailStatement | null {
  if (!argument.raw || typeof argument.raw !== 'object') return null
  return argument.raw as TopicDetailStatement
}

function participantTarget(argument: ArgumentTreeNode): ParticipantContextTarget | null {
  const raw = rawStatement(argument)
  if (!raw?.userId) return null
  return {
    userId: raw.userId,
    displayName: String(argument.author || raw.author || `User ${raw.userId}`),
  }
}

function narrativeKind(argument: ArgumentTreeNode): NarrativeKind {
  const author = String(argument.author ?? '').toLowerCase()
  const body = String(argument.body ?? '').trim()
  const upper = body.toUpperCase()

  if (author.includes('inquisiteur') || upper.startsWith('MODÉRATION') || upper.startsWith('MODERATION')) {
    return 'moderation'
  }
  if (upper.startsWith('RÉCUSATION') || upper.startsWith('RECUSATION')) {
    return 'recusal'
  }
  if (body.toLowerCase().startsWith('contexte déclaré:')) {
    return 'conflict'
  }
  if (
    author.includes('king klown') &&
    (upper.includes('PUISSANCE DÉDIÉE') || upper.includes('PUISSANCE DEDIEE'))
  ) {
    return 'announcement'
  }
  return null
}

function selectedArgumentLabel(argument: ArgumentTreeItem | null): string {
  if (!argument) return 'No argument selected'
  const side = sideLabel(argument.side)
  const preview = argument.body?.trim()
  if (!preview) return `${side} argument selected`
  return `${side}: ${preview.slice(0, 48)}${preview.length > 48 ? '…' : ''}`
}

function narrativeMeta(argument: ArgumentTreeNode): JSX.Element | null {
  const kind = narrativeKind(argument)
  if (!kind) return null

  if (kind === 'announcement') {
    return (
      <Space size={4} wrap>
        <Tag color="purple">DEMO FICTION</Tag>
        <Tag color="blue">Public announcement</Tag>
      </Space>
    )
  }
  if (kind === 'moderation') {
    return (
      <Space size={4} wrap>
        <Tag color="purple">DEMO FICTION</Tag>
        <Tag color="orange">Moderation event</Tag>
      </Space>
    )
  }
  if (kind === 'conflict') {
    return (
      <Space size={4} wrap>
        <Tag color="purple">DEMO FICTION</Tag>
        <Tag color="gold">Declared conflict</Tag>
      </Space>
    )
  }
  return (
    <Space size={4} wrap>
      <Tag color="purple">DEMO FICTION</Tag>
      <Tag color="cyan">Advisory recusal</Tag>
    </Space>
  )
}

function narrativeBody(argument: ArgumentTreeNode): JSX.Element {
  const kind = narrativeKind(argument)

  if (kind === 'announcement') {
    return (
      <Alert
        type="info"
        showIcon
        message="Public announcement — fictional demo scenario"
        description={<strong style={{ whiteSpace: 'pre-wrap' }}>{argument.body}</strong>}
        style={{ marginBottom: 8 }}
      />
    )
  }
  if (kind === 'moderation') {
    return (
      <Alert
        type="warning"
        showIcon
        message="Moderation event"
        description={argument.body}
        style={{ marginBottom: 8 }}
      />
    )
  }
  if (kind === 'conflict') {
    return (
      <Alert
        type="warning"
        showIcon
        message="Declared participant context"
        description={argument.body}
        style={{ marginBottom: 8 }}
      />
    )
  }
  if (kind === 'recusal') {
    return (
      <Alert
        type="success"
        showIcon
        message="Voluntary advisory recusal"
        description={argument.body}
        style={{ marginBottom: 8 }}
      />
    )
  }

  return (
    <p style={{ marginTop: 0, marginBottom: 8, whiteSpace: 'pre-wrap' }}>
      {argument.body}
    </p>
  )
}

export default function ArgumentThreadCard({
  items,
  loading,
  selectedArgument,
  onSelect,
  onReply,
  onRefresh,
  onOpenParticipant,
}: {
  items: ArgumentTreeItem[]
  loading: boolean
  selectedArgument: ArgumentTreeItem | null
  onSelect: (argument: ArgumentTreeItem) => void
  onReply: (argument: ArgumentTreeItem) => void
  onRefresh: () => void
  onOpenParticipant: (target: ParticipantContextTarget) => void
}): JSX.Element {
  return (
    <ProCard
      title={
        <Space>
          <BranchesOutlined />
          <span>Arguments and replies</span>
        </Space>
      }
      extra={
        <Space wrap>
          <Tag>{items.length} statements</Tag>
          {selectedArgument ? (
            <Tooltip title={selectedArgumentLabel(selectedArgument)}>
              <Tag color="blue">Argument selected</Tag>
            </Tooltip>
          ) : (
            <Tag>Choose an argument</Tag>
          )}
          <Tooltip title="Refresh the argument thread">
            <Button icon={<ReloadOutlined />} onClick={onRefresh}>Refresh</Button>
          </Tooltip>
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text type="secondary">
          Read the argument thread, inspect evidence and participant context, or reply to continue the deliberation.
        </Text>

        <ArgumentTree
          items={items}
          loading={loading}
          selectedId={selectedArgument?.id ?? null}
          onSelect={onSelect}
          onReply={onReply}
          renderAuthor={(argument) => {
            const participant = participantTarget(argument)
            if (!participant) return <strong>{argument.author}</strong>
            return (
              <Button
                type="link"
                size="small"
                data-testid={`ekoh-participant-${participant.userId}`}
                style={{ padding: 0, height: 'auto', fontWeight: 600 }}
                onClick={(event) => {
                  event.stopPropagation()
                  onOpenParticipant(participant)
                }}
              >
                {argument.author}
              </Button>
            )
          }}
          renderBody={narrativeBody}
          renderActions={(argument) => {
            const isSelected = selectedArgument?.id === argument.id
            const participant = participantTarget(argument)
            return (
              <Space size={4} wrap>
                {participant && (
                  <Button
                    size="small"
                    type="link"
                    icon={<SafetyCertificateOutlined />}
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenParticipant(participant)
                    }}
                  >
                    EkoH context
                  </Button>
                )}
                <Button
                  size="small"
                  type={isSelected ? 'primary' : 'link'}
                  icon={<InfoCircleOutlined />}
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelect(argument)
                  }}
                >
                  {isSelected ? 'Viewing details' : 'View details'}
                </Button>
              </Space>
            )
          }}
          renderMeta={(argument) => (
            <Space size={4} wrap>
              <Tag color={sideColor(argument.side)}>{sideLabel(argument.side)}</Tag>
              {narrativeMeta(argument)}
            </Space>
          )}
        />
      </Space>
    </ProCard>
  )
}
