// FILE: frontend/modules/ethikos/components/DiscussionVisibilityPanel.tsx
'use client'

import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  ReloadOutlined,
  SaveOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { ProCard } from '@ant-design/pro-components'
import {
  Alert,
  App,
  Button,
  Empty,
  Form,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  fetchDiscussionVisibilitySettings,
  setDiscussionVisibilitySetting,
  updateDiscussionVisibilitySetting,
} from '@/services/ethikos'
import type {
  AuthorVisibility,
  DiscussionParticipationType,
  DiscussionVisibilitySettingApi,
  EthikosId,
  SetDiscussionVisibilitySettingPayload,
  UpdateDiscussionVisibilitySettingPayload,
  VoteVisibility,
} from '@/services/ethikos'

const { Text, Paragraph } = Typography

type VisibilityFormValues = {
  participation_type: DiscussionParticipationType
  author_visibility: AuthorVisibility
  vote_visibility: VoteVisibility
}

export type DiscussionVisibilityPanelProps = {
  topicId: EthikosId
  editable?: boolean
  compact?: boolean
  title?: string
  onChange?: (setting: DiscussionVisibilitySettingApi) => void
}

const DEFAULT_VALUES: VisibilityFormValues = {
  participation_type: 'standard',
  author_visibility: 'all',
  vote_visibility: 'all',
}

const PARTICIPATION_OPTIONS: Array<{
  value: DiscussionParticipationType
  label: string
  description: string
}> = [
  {
    value: 'standard',
    label: 'Standard participation',
    description: 'Authors and roles are handled with normal visibility rules.',
  },
  {
    value: 'anonymous',
    label: 'Anonymous participation',
    description:
      'Participants may contribute with reduced public identity exposure.',
  },
]

const AUTHOR_VISIBILITY_OPTIONS: Array<{
  value: AuthorVisibility
  label: string
  description: string
}> = [
  {
    value: 'all',
    label: 'Visible to all',
    description: 'Author identity may be shown to all participants.',
  },
  {
    value: 'admins_only',
    label: 'Admins only',
    description: 'Author identity is limited to administrators/moderators.',
  },
  {
    value: 'never',
    label: 'Never visible',
    description: 'Author identity should not be exposed in the discussion UI.',
  },
]

const VOTE_VISIBILITY_OPTIONS: Array<{
  value: VoteVisibility
  label: string
  description: string
}> = [
  {
    value: 'all',
    label: 'Visible to all',
    description: 'Vote/impact signals may be visible to all participants.',
  },
  {
    value: 'admins_only',
    label: 'Admins only',
    description: 'Vote/impact signals are limited to administrators/moderators.',
  },
  {
    value: 'self_only',
    label: 'Self only',
    description: 'Participants only see their own vote/impact signal.',
  },
]

function optionLabel<TValue extends string>(
  options: Array<{ value: TValue; label: string }>,
  value: TValue,
): string {
  return options.find((option) => option.value === value)?.label ?? value
}

function participationColor(value: DiscussionParticipationType): string {
  return value === 'anonymous' ? 'purple' : 'blue'
}

function authorVisibilityColor(value: AuthorVisibility): string {
  if (value === 'all') return 'green'
  if (value === 'admins_only') return 'orange'
  return 'red'
}

function voteVisibilityColor(value: VoteVisibility): string {
  if (value === 'all') return 'green'
  if (value === 'admins_only') return 'orange'
  return 'default'
}

function toFormValues(
  setting: DiscussionVisibilitySettingApi | null,
): VisibilityFormValues {
  return {
    participation_type:
      setting?.participation_type ?? DEFAULT_VALUES.participation_type,
    author_visibility:
      setting?.author_visibility ?? DEFAULT_VALUES.author_visibility,
    vote_visibility: setting?.vote_visibility ?? DEFAULT_VALUES.vote_visibility,
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

function hasValidTopicId(topicId: EthikosId): boolean {
  return String(topicId).trim().length > 0
}

function buildCreatePayload(
  topicId: EthikosId,
  values: VisibilityFormValues,
): SetDiscussionVisibilitySettingPayload {
  return {
    topic: topicId,
    participation_type: values.participation_type,
    author_visibility: values.author_visibility,
    vote_visibility: values.vote_visibility,
  }
}

function buildUpdatePayload(
  values: VisibilityFormValues,
): UpdateDiscussionVisibilitySettingPayload {
  return {
    participation_type: values.participation_type,
    author_visibility: values.author_visibility,
    vote_visibility: values.vote_visibility,
  }
}

export default function DiscussionVisibilityPanel({
  topicId,
  editable = false,
  compact = false,
  title = 'Discussion visibility',
  onChange,
}: DiscussionVisibilityPanelProps): JSX.Element {
  const { message } = App.useApp()
  const [form] = Form.useForm<VisibilityFormValues>()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [setting, setSetting] = useState<DiscussionVisibilitySettingApi | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  const participationValue =
    Form.useWatch('participation_type', form) ??
    DEFAULT_VALUES.participation_type
  const authorVisibilityValue =
    Form.useWatch('author_visibility', form) ??
    DEFAULT_VALUES.author_visibility
  const voteVisibilityValue =
    Form.useWatch('vote_visibility', form) ?? DEFAULT_VALUES.vote_visibility

  const participationDescription = useMemo(
    () =>
      PARTICIPATION_OPTIONS.find(
        (option) => option.value === participationValue,
      )?.description,
    [participationValue],
  )

  const authorVisibilityDescription = useMemo(
    () =>
      AUTHOR_VISIBILITY_OPTIONS.find(
        (option) => option.value === authorVisibilityValue,
      )?.description,
    [authorVisibilityValue],
  )

  const voteVisibilityDescription = useMemo(
    () =>
      VOTE_VISIBILITY_OPTIONS.find(
        (option) => option.value === voteVisibilityValue,
      )?.description,
    [voteVisibilityValue],
  )

  const loadSetting = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    if (!hasValidTopicId(topicId)) {
      setSetting(null)
      form.setFieldsValue(DEFAULT_VALUES)
      setError('Missing topic id for discussion visibility settings.')
      setLoading(false)
      return
    }

    try {
      const rows = await fetchDiscussionVisibilitySettings(topicId)
      const nextSetting = rows[0] ?? null

      setSetting(nextSetting)
      form.setFieldsValue(toFormValues(nextSetting))
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          'Unable to load discussion visibility settings.',
        ),
      )
      setSetting(null)
      form.setFieldsValue(DEFAULT_VALUES)
    } finally {
      setLoading(false)
    }
  }, [form, topicId])

  useEffect(() => {
    form.setFieldsValue(DEFAULT_VALUES)
    void loadSetting()
  }, [form, loadSetting])

  async function handleSave(): Promise<void> {
    if (!editable) {
      return
    }

    if (!hasValidTopicId(topicId)) {
      message.error('Missing topic id for discussion visibility settings.')
      return
    }

    const formValues = await form.validateFields()

    setSaving(true)

    try {
      const settingId = setting?.id
      const saved = settingId
        ? await updateDiscussionVisibilitySetting(
            settingId,
            buildUpdatePayload(formValues),
          )
        : await setDiscussionVisibilitySetting(
            buildCreatePayload(topicId, formValues),
          )

      setError(null)
      setSetting(saved)
      form.setFieldsValue(toFormValues(saved))
      onChange?.(saved)

      message.success(
        settingId
          ? 'Discussion visibility updated.'
          : 'Discussion visibility created.',
      )
    } catch (err) {
      message.error(
        getErrorMessage(
          err,
          'Unable to save discussion visibility settings.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const showEmpty = !loading && !setting && !editable
  const hasTopicId = hasValidTopicId(topicId)

  return (
    <ProCard
      title={title}
      size={compact ? 'small' : 'default'}
      extra={
        <Space>
          {setting ? (
            <Tag color="green">Configured</Tag>
          ) : (
            <Tag color="default">Default</Tag>
          )}

          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => void loadSetting()}
            disabled={loading || saving || !hasTopicId}
          >
            Refresh
          </Button>

          {editable ? (
            <Button
              size="small"
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={loading || !hasTopicId}
              onClick={() => void handleSave()}
            >
              {setting?.id ? 'Save' : 'Create'}
            </Button>
          ) : null}
        </Space>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: compact ? 2 : 4 }} />
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {error ? (
            <Alert
              type="error"
              showIcon
              message="Visibility settings unavailable"
              description={error}
            />
          ) : null}

          {showEmpty ? (
            <Empty description="No visibility setting configured yet" />
          ) : null}

          {!setting && editable ? (
            <Alert
              type="info"
              showIcon
              message="No saved visibility setting exists yet"
              description="Saving will create the topic visibility setting through the canonical ethiKos service."
            />
          ) : null}

          <Form<VisibilityFormValues>
            form={form}
            layout="vertical"
            initialValues={DEFAULT_VALUES}
            disabled={!editable || saving}
          >
            <Form.Item
              name="participation_type"
              label={
                <Space size={6}>
                  <UserSwitchOutlined />
                  <span>Participation type</span>
                </Space>
              }
              rules={[
                {
                  required: true,
                  message: 'Choose a participation type.',
                },
              ]}
            >
              <Select
                options={PARTICIPATION_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="author_visibility"
              label={
                <Space size={6}>
                  <EyeOutlined />
                  <span>Author visibility</span>
                </Space>
              }
              rules={[
                {
                  required: true,
                  message: 'Choose author visibility.',
                },
              ]}
            >
              <Select
                options={AUTHOR_VISIBILITY_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="vote_visibility"
              label={
                <Space size={6}>
                  <LockOutlined />
                  <span>Vote visibility</span>
                </Space>
              }
              rules={[
                {
                  required: true,
                  message: 'Choose vote visibility.',
                },
              ]}
            >
              <Select
                options={VOTE_VISIBILITY_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />
            </Form.Item>
          </Form>

          <Space wrap>
            <Tag
              icon={<UserSwitchOutlined />}
              color={participationColor(participationValue)}
            >
              {optionLabel(PARTICIPATION_OPTIONS, participationValue)}
            </Tag>

            <Tag
              icon={
                authorVisibilityValue === 'never' ? (
                  <EyeInvisibleOutlined />
                ) : (
                  <EyeOutlined />
                )
              }
              color={authorVisibilityColor(authorVisibilityValue)}
            >
              {optionLabel(AUTHOR_VISIBILITY_OPTIONS, authorVisibilityValue)}
            </Tag>

            <Tag
              icon={<LockOutlined />}
              color={voteVisibilityColor(voteVisibilityValue)}
            >
              {optionLabel(VOTE_VISIBILITY_OPTIONS, voteVisibilityValue)}
            </Tag>
          </Space>

          {!compact ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {participationDescription ? (
                <Paragraph style={{ marginBottom: 0 }}>
                  <Text strong>Participation:</Text>{' '}
                  {participationDescription}
                </Paragraph>
              ) : null}

              {authorVisibilityDescription ? (
                <Paragraph style={{ marginBottom: 0 }}>
                  <Text strong>Authors:</Text>{' '}
                  {authorVisibilityDescription}
                </Paragraph>
              ) : null}

              {voteVisibilityDescription ? (
                <Paragraph style={{ marginBottom: 0 }}>
                  <Text strong>Votes:</Text> {voteVisibilityDescription}
                </Paragraph>
              ) : null}
            </Space>
          ) : null}
        </Space>
      )}
    </ProCard>
  )
}