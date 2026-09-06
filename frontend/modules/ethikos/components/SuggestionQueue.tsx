// FILE: frontend/modules/ethikos/components/SuggestionQueue.tsx
'use client'

import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  message,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  fetchArgumentSuggestions,
  submitArgumentSuggestion,
} from '@/services/ethikos'
import type {
  ArgumentSide,
  ArgumentSuggestionApi,
  ArgumentSuggestionStatus,
  EthikosId,
  SubmitArgumentSuggestionPayload,
} from '@/services/ethikos'

const { Text, Paragraph } = Typography
const { TextArea } = Input

type SuggestionSide = ArgumentSide | null
type SuggestionStatusFilter = ArgumentSuggestionStatus | 'all'

export interface SuggestionQueueProps {
  topicId: EthikosId
  /**
   * Parent filtering semantics:
   * - undefined: show all suggestions for the topic.
   * - null: show only top-level suggestions.
   * - id: show only suggestions attached to that parent argument.
   */
  parentId?: EthikosId | null
  side?: SuggestionSide
  status?: SuggestionStatusFilter
  title?: string
  description?: string
  emptyText?: string
  submitLabel?: string
  showComposer?: boolean
  showStatusFilter?: boolean
  autoLoad?: boolean
  disabled?: boolean
  className?: string
  onSubmitted?: (suggestion: ArgumentSuggestionApi) => void
  onLoaded?: (suggestions: ArgumentSuggestionApi[]) => void
  onError?: (error: string) => void
}

interface SuggestionFormValues {
  content?: string
  side?: ArgumentSide | 'none'
}

const STATUS_LABELS: Record<ArgumentSuggestionStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  revision_requested: 'Revision requested',
}

const STATUS_COLORS: Record<ArgumentSuggestionStatus, string> = {
  pending: 'gold',
  accepted: 'green',
  rejected: 'red',
  revision_requested: 'blue',
}

const STATUS_FILTER_OPTIONS: { label: string; value: SuggestionStatusFilter }[] =
  [
    { label: 'All statuses', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Revision requested', value: 'revision_requested' },
  ]

const SIDE_LABELS: Record<ArgumentSide, string> = {
  pro: 'Pro',
  con: 'Con',
}

const SIDE_COLORS: Record<ArgumentSide, string> = {
  pro: 'green',
  con: 'red',
}

function toId(value: EthikosId | null | undefined): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return String(value)
}

function normalizeContent(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function displayAuthor(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'Anonymous'
  }

  return String(value)
}

function formatDate(value?: string | null): string {
  if (!value) return 'Unknown date'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

function sortSuggestions(
  suggestions: ArgumentSuggestionApi[],
): ArgumentSuggestionApi[] {
  return [...suggestions].sort((a, b) => {
    const left = a.created_at ? Date.parse(a.created_at) : 0
    const right = b.created_at ? Date.parse(b.created_at) : 0
    return right - left
  })
}

function suggestionParentId(item: ArgumentSuggestionApi): string | null {
  return toId(item.parent_id ?? item.parent)
}

function SuggestionStatusTag({
  status,
}: {
  status: ArgumentSuggestionStatus
}) {
  return (
    <Tag color={STATUS_COLORS[status] ?? 'default'}>
      {STATUS_LABELS[status] ?? status}
    </Tag>
  )
}

function SuggestionSideTag({ side }: { side?: ArgumentSide | null }) {
  if (!side) {
    return <Tag>General</Tag>
  }

  return <Tag color={SIDE_COLORS[side] ?? 'default'}>{SIDE_LABELS[side]}</Tag>
}

export default function SuggestionQueue({
  topicId,
  parentId,
  side = null,
  status = 'all',
  title = 'Suggestion queue',
  description = 'Propose a new argument or reply for review.',
  emptyText = 'No suggestions yet.',
  submitLabel = 'Submit suggestion',
  showComposer = true,
  showStatusFilter = true,
  autoLoad = true,
  disabled = false,
  className,
  onSubmitted,
  onLoaded,
  onError,
}: SuggestionQueueProps) {
  const [form] = Form.useForm<SuggestionFormValues>()
  const [suggestions, setSuggestions] = useState<ArgumentSuggestionApi[]>([])
  const [statusFilter, setStatusFilter] =
    useState<SuggestionStatusFilter>(status)
  const [loading, setLoading] = useState(Boolean(autoLoad))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedTopicId = useMemo(() => toId(topicId), [topicId])
  const normalizedParentId = useMemo(() => toId(parentId), [parentId])
  const parentFilterEnabled = parentId !== undefined

  useEffect(() => {
    setStatusFilter(status)
  }, [status])

  useEffect(() => {
    form.setFieldsValue({
      side: side ?? 'none',
    })
  }, [form, side])

  const reportError = useCallback(
    (fallback: string, err?: unknown) => {
      const nextError = err instanceof Error ? err.message : fallback
      setError(nextError)
      onError?.(nextError)
      return nextError
    },
    [onError],
  )

  const filterSuggestions = useCallback(
    (rows: ArgumentSuggestionApi[]) =>
      rows.filter((row) => {
        if (statusFilter !== 'all' && row.status !== statusFilter) {
          return false
        }

        if (!parentFilterEnabled) {
          return true
        }

        const rowParentId = suggestionParentId(row)

        if (normalizedParentId === null) {
          return rowParentId === null
        }

        return rowParentId === normalizedParentId
      }),
    [normalizedParentId, parentFilterEnabled, statusFilter],
  )

  const visibleSuggestions = useMemo(
    () => sortSuggestions(filterSuggestions(suggestions)),
    [filterSuggestions, suggestions],
  )

  const pendingCount = useMemo(
    () => visibleSuggestions.filter((item) => item.status === 'pending').length,
    [visibleSuggestions],
  )

  const loadSuggestions = useCallback(async () => {
    if (!normalizedTopicId) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const rows = await fetchArgumentSuggestions(normalizedTopicId)
      const filtered = sortSuggestions(filterSuggestions(rows))

      setSuggestions(rows)
      onLoaded?.(filtered)
    } catch (err) {
      reportError('Unable to load argument suggestions.', err)
    } finally {
      setLoading(false)
    }
  }, [filterSuggestions, normalizedTopicId, onLoaded, reportError])

  useEffect(() => {
    if (autoLoad) {
      void loadSuggestions()
    }
  }, [autoLoad, loadSuggestions])

  const handleSubmit = useCallback(
    async (values: SuggestionFormValues) => {
      if (!normalizedTopicId) {
        reportError('Topic id is required before submitting a suggestion.')
        return
      }

      const content = normalizeContent(values.content)
      if (!content) {
        reportError('Suggestion content is required.')
        return
      }

      const selectedSide =
        values.side && values.side !== 'none' ? values.side : side ?? null

      const payload: SubmitArgumentSuggestionPayload = {
        topic: normalizedTopicId,
        content,
        ...(normalizedParentId ? { parent_id: normalizedParentId } : {}),
        ...(selectedSide ? { side: selectedSide } : {}),
      }

      setSubmitting(true)
      setError(null)

      try {
        const created = await submitArgumentSuggestion(payload)

        setSuggestions((current) => sortSuggestions([created, ...current]))
        form.resetFields()
        form.setFieldsValue({ side: side ?? 'none' })

        onSubmitted?.(created)
        message.success('Suggestion submitted.')
      } catch (err) {
        reportError('Unable to submit argument suggestion.', err)
      } finally {
        setSubmitting(false)
      }
    },
    [
      form,
      normalizedParentId,
      normalizedTopicId,
      onSubmitted,
      reportError,
      side,
    ],
  )

  const contextDescription = useMemo(() => {
    if (!parentFilterEnabled) {
      return null
    }

    if (normalizedParentId === null) {
      return 'Showing top-level suggestions only.'
    }

    return `Showing suggestions for argument #${normalizedParentId}.`
  }, [normalizedParentId, parentFilterEnabled])

  return (
    <Card
      className={className}
      title={
        <Space size={8} wrap>
          <span>{title}</span>
          {pendingCount > 0 && <Tag color="gold">{pendingCount} pending</Tag>}
        </Space>
      }
      extra={
        <Space size={8} wrap>
          {showStatusFilter && (
            <Select
              size="small"
              value={statusFilter}
              style={{ minWidth: 180 }}
              options={STATUS_FILTER_OPTIONS}
              disabled={loading || submitting}
              onChange={(value) =>
                setStatusFilter(value as SuggestionStatusFilter)
              }
            />
          )}

          <Button
            size="small"
            onClick={() => {
              void loadSuggestions()
            }}
            disabled={loading || submitting || !normalizedTopicId}
          >
            Refresh
          </Button>
        </Space>
      }
    >
      {description && (
        <Paragraph type="secondary" style={{ marginTop: 0 }}>
          {description}
        </Paragraph>
      )}

      {contextDescription && (
        <Paragraph type="secondary" style={{ marginTop: -8 }}>
          {contextDescription}
        </Paragraph>
      )}

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 16 }}
        />
      )}

      {showComposer && (
        <Form<SuggestionFormValues>
          form={form}
          layout="vertical"
          onFinish={(values) => {
            void handleSubmit(values)
          }}
          disabled={disabled || submitting}
          initialValues={{
            side: side ?? 'none',
          }}
          style={{ marginBottom: 16 }}
        >
          <Form.Item
            name="content"
            label="Suggestion"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Enter a suggestion before submitting.',
              },
            ]}
          >
            <TextArea
              rows={4}
              maxLength={2000}
              showCount
              placeholder="Suggest a new argument, clarification, or reply."
            />
          </Form.Item>

          <Space align="end" wrap>
            <Form.Item
              name="side"
              label="Side"
              style={{ minWidth: 160, marginBottom: 0 }}
            >
              <Select
                options={[
                  { label: 'General', value: 'none' },
                  { label: 'Pro', value: 'pro' },
                  { label: 'Con', value: 'con' },
                ]}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                disabled={disabled || !normalizedTopicId}
              >
                {submitLabel}
              </Button>
            </Form.Item>
          </Space>
        </Form>
      )}

      <Spin spinning={loading}>
        {visibleSuggestions.length === 0 ? (
          <Empty description={emptyText} />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={visibleSuggestions}
            rowKey={(item) => String(item.id)}
            renderItem={(item) => (
              <List.Item>
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Space size={6} wrap>
                    <SuggestionStatusTag status={item.status} />
                    <SuggestionSideTag side={item.side ?? null} />

                    {item.parent != null && (
                      <Tag>Reply to #{String(item.parent)}</Tag>
                    )}

                    {item.accepted_argument != null && (
                      <Tag color="green">
                        Accepted as #{String(item.accepted_argument)}
                      </Tag>
                    )}
                  </Space>

                  <Paragraph style={{ marginBottom: 0 }}>
                    {item.content}
                  </Paragraph>

                  <Text type="secondary">
                    Suggested by {displayAuthor(item.created_by)} ·{' '}
                    {formatDate(item.created_at)}
                    {item.reviewed_by ? (
                      <>
                        {' '}
                        · Reviewed by {displayAuthor(item.reviewed_by)}
                        {item.reviewed_at
                          ? ` · ${formatDate(item.reviewed_at)}`
                          : ''}
                      </>
                    ) : null}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Spin>
    </Card>
  )
}