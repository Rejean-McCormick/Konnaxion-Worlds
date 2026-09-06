'use client'

import { Button, Card, Slider, Space, Tag, Typography } from 'antd'

import type { TopicStanceValue } from '@/services/deliberate'

import {
  clampStance,
  stanceColor,
  stanceLabel,
} from '../_lib/topicThreadUtils'

const { Text, Paragraph } = Typography

export default function StanceComposerCard({
  value,
  loading,
  onChange,
  onSave,
}: {
  value: TopicStanceValue
  loading: boolean
  onChange: (value: TopicStanceValue) => void
  onSave: () => void
}): JSX.Element {
  const currentLabel = stanceLabel(value)
  const currentColor = stanceColor(value)

  return (
    <Card
      title="Set your position"
      extra={<Tag color={currentColor}>{currentLabel}</Tag>}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Text strong>Where do you stand on this topic?</Text>
          <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
            Choose a topic-level stance before adding or reviewing arguments.
            You can update it as the deliberation evolves.
          </Paragraph>
        </div>

        <Slider
          min={-3}
          max={3}
          step={1}
          dots
          value={value}
          style={{ margin: '8px 6px 0' }}
          tooltip={{
            formatter: (nextValue) =>
              typeof nextValue === 'number'
                ? stanceLabel(clampStance(nextValue))
                : currentLabel,
          }}
          onChange={(nextValue) => {
            if (typeof nextValue === 'number') {
              onChange(clampStance(nextValue))
            }
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Text type="secondary">Oppose</Text>
          <Text type="secondary">Neutral</Text>
          <Text type="secondary">Support</Text>
        </div>

        <Button
          type="primary"
          loading={loading}
          onClick={onSave}
          block
        >
          Save topic stance
        </Button>

        <Text type="secondary">
          This is your position on the topic. Impact votes belong to individual
          arguments.
        </Text>
      </Space>
    </Card>
  )
}