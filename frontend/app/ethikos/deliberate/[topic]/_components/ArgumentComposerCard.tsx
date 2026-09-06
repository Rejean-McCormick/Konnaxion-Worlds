'use client'

import { Alert, Button, Card, Input, Segmented, Space } from 'antd'
import type { SegmentedValue } from 'antd/es/segmented'

import type { ArgumentTreeItem } from '@/modules/ethikos/components/ArgumentTree'
import type { ArgumentSide } from '@/services/ethikos'

const { TextArea } = Input

export default function ArgumentComposerCard({
  replyTarget,
  side,
  value,
  loading,
  onSideChange,
  onValueChange,
  onSubmit,
  onClearReply,
}: {
  replyTarget: ArgumentTreeItem | null
  side: ArgumentSide
  value: string
  loading: boolean
  onSideChange: (value: SegmentedValue) => void
  onValueChange: (value: string) => void
  onSubmit: () => void
  onClearReply: () => void
}): JSX.Element {
  return (
    <Card title="Add to the argument thread">
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {replyTarget && (
          <Alert
            type="info"
            showIcon
            message={`Replying to ${replyTarget.author ?? 'Anonymous'}`}
            description={replyTarget.body}
            action={
              <Button size="small" onClick={onClearReply}>
                Clear
              </Button>
            }
          />
        )}

        <Segmented
          value={side}
          onChange={onSideChange}
          options={[
            { label: 'Pro', value: 'pro' },
            { label: 'Con', value: 'con' },
          ]}
        />

        <TextArea
          rows={4}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={
            replyTarget ? 'Write a concise reply…' : 'Write a concise argument…'
          }
        />

        <Space>
          <Button type="primary" loading={loading} onClick={onSubmit}>
            {replyTarget ? 'Post reply' : 'Post argument'}
          </Button>
          {replyTarget && <Button onClick={onClearReply}>Cancel reply</Button>}
        </Space>
      </Space>
    </Card>
  )
}
