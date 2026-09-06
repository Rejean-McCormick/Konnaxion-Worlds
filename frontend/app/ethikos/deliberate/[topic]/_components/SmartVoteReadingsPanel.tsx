'use client'

import {
  BarChartOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { ProCard } from '@ant-design/pro-components'
import { useRequest } from 'ahooks'
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  List,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd'
import { useMemo, useState } from 'react'

import {
  fetchEthikosTopicReading,
  primaryAdvisoryReading,
} from '@/services/readings'
import type { SmartVoteReadingParticipant } from '@/services/readings'

import type { ParticipantContextTarget } from './ArgumentThreadCard'

const { Paragraph, Text } = Typography

function pct(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value * 100)))
}

function stanceLabel(score: number): string {
  if (score >= 2.25) return 'Strong support'
  if (score >= 0.75) return 'Support'
  if (score > 0.15) return 'Lean support'
  if (score <= -2.25) return 'Strong oppose'
  if (score <= -0.75) return 'Oppose'
  if (score < -0.15) return 'Lean oppose'
  return 'Near neutral'
}

function ReadingDistribution({
  support,
  neutral,
  oppose,
}: {
  support?: number
  neutral?: number
  oppose?: number
}): JSX.Element {
  return (
    <Space direction="vertical" size={6} style={{ width: '100%' }}>
      <div>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>Support</Text><Text>{pct(support)}%</Text>
        </Space>
        <Progress percent={pct(support)} showInfo={false} />
      </div>
      <div>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>Neutral</Text><Text>{pct(neutral)}%</Text>
        </Space>
        <Progress percent={pct(neutral)} showInfo={false} />
      </div>
      <div>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>Oppose</Text><Text>{pct(oppose)}%</Text>
        </Space>
        <Progress percent={pct(oppose)} showInfo={false} />
      </div>
    </Space>
  )
}

function participantTarget(row: SmartVoteReadingParticipant): ParticipantContextTarget {
  return {
    userId: String(row.user_id),
    displayName: row.display_name,
  }
}

export default function SmartVoteReadingsPanel({
  topicId,
  onOpenParticipant,
}: {
  topicId: string | number
  onOpenParticipant: (target: ParticipantContextTarget) => void
}): JSX.Element {
  const [expanded, setExpanded] = useState(false)

  const { data, loading, refresh } = useRequest(
    () => fetchEthikosTopicReading(topicId),
    {
      ready: expanded && Boolean(topicId),
      refreshDeps: [expanded, topicId],
    },
  )

  const advisory = primaryAdvisoryReading(data)
  const baseline = data?.baseline.results_payload
  const reading = advisory?.results_payload

  const participants = useMemo(
    () =>
      [...(reading?.participants ?? [])].sort((left, right) => {
        if (left.included_in_advisory !== right.included_in_advisory) {
          return left.included_in_advisory ? -1 : 1
        }
        return right.expertise_alignment - left.expertise_alignment
      }),
    [reading?.participants],
  )

  const divergence =
    baseline && reading ? Math.abs(reading.score - baseline.score) : 0

  return (
    <ProCard
      title={
        <Space>
          <BarChartOutlined />
          <span>Decision-support readings</span>
        </Space>
      }
      subTitle="Single source truth, multiple declared readings"
      data-testid="smart-vote-readings-panel"
      extra={
        <Space wrap>
          <Tag>Baseline always preserved</Tag>
          <Button
            type={expanded ? 'default' : 'primary'}
            data-testid="view-readings-button"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Hide readings' : 'View readings'}
          </Button>
        </Space>
      }
    >
      {!expanded ? (
        <Alert
          type="info"
          showIcon
          message="Compare the public baseline with a declared relevant-expertise lens"
          description="Opening the panel does not change any stance. Smart Vote derives an advisory interpretation from the same source facts using the EkoH context relevant to this question."
        />
      ) : loading ? (
        <Card loading />
      ) : !data || !baseline || !reading ? (
        <Empty description="No Smart Vote reading is bound to this topic yet">
          <Button onClick={() => refresh()}>Retry</Button>
        </Empty>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="warning"
            showIcon
            message="Advisory reading — not a transfer of sovereignty"
            description="Expertise informs judgment. It does not silently acquire political sovereignty. The baseline below keeps every canonical Ethikos stance unweighted."
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Public baseline" data-testid="baseline-reading-card">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Statistic
                    title={stanceLabel(baseline.score)}
                    value={baseline.score}
                    precision={2}
                    suffix="/ 3"
                  />
                  <Text type="secondary">{baseline.participant_count} source stances · no weighting</Text>
                  <ReadingDistribution
                    support={baseline.support_share}
                    neutral={baseline.neutral_share}
                    oppose={baseline.oppose_share}
                  />
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Relevant-expertise reading" data-testid="expertise-reading-card">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Statistic
                    title={stanceLabel(reading.score)}
                    value={reading.score}
                    precision={2}
                    suffix="/ 3"
                  />
                  <Space wrap>
                    <Tag>{reading.advisory_participant_count ?? reading.participant_count} advisory participants</Tag>
                    {(reading.excluded_participant_count ?? 0) > 0 && (
                      <Tag color="orange">{reading.excluded_participant_count} declared recusal</Tag>
                    )}
                  </Space>
                  <ReadingDistribution
                    support={reading.support_share}
                    neutral={reading.neutral_share}
                    oppose={reading.oppose_share}
                  />
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic title="Divergence" value={divergence} precision={2} suffix=" stance pts" />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic title="Expertise coverage" value={pct(reading.expertise_coverage)} suffix="%" />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic title="Average contextual alignment" value={pct(reading.average_expertise_alignment)} suffix="%" />
              </Card>
            </Col>
          </Row>

          <ProCard title="Relevant domains" bordered>
            <Space wrap>
              {(reading.domains ?? []).map((domain) => (
                <Tag key={domain.domain_code}>
                  {domain.domain_name} · {pct(domain.weight)}%
                </Tag>
              ))}
            </Space>
          </ProCard>

          <ProCard
            title="Participant relevance in this lens"
            subTitle="No one becomes more important everywhere. Expertise follows the question."
            bordered
          >
            {(reading.participant_detail_visible_count ?? participants.length) < reading.participant_count ? (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="Some participant-level EkoH details are restricted"
                description={`${reading.participant_detail_visible_count ?? participants.length} of ${reading.participant_count} participant detail records are visible in your current EkoH access scope. Aggregate baseline and advisory readings remain unchanged.`}
              />
            ) : null}
            <List<SmartVoteReadingParticipant>
              dataSource={participants}
              renderItem={(participant) => (
                <List.Item
                  key={participant.user_id}
                  actions={[
                    <Button
                      key="ekoh"
                      type="link"
                      icon={<SafetyCertificateOutlined />}
                      onClick={() => onOpenParticipant(participantTarget(participant))}
                    >
                      EkoH context
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space wrap>
                        <Text strong>{participant.display_name}</Text>
                        <Tag>stance {participant.stance_value > 0 ? '+' : ''}{participant.stance_value}</Tag>
                        {participant.included_in_advisory ? (
                          <Tag color="green">Included</Tag>
                        ) : (
                          <Tag color="orange">Recused</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <Text type="secondary">
                          Contextual alignment {pct(participant.expertise_alignment)}% · advisory weight {participant.advisory_weight.toFixed(2)}×
                        </Text>
                        {participant.exclusion_reason && (
                          <Text type="secondary">{participant.exclusion_reason}</Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </ProCard>

          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Lens hash: {advisory?.lens_hash ?? 'n/a'} · snapshot: {advisory?.snapshot_ref ?? 'n/a'}
          </Paragraph>
        </Space>
      )}
    </ProCard>
  )
}
