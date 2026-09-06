'use client'

import { ReloadOutlined } from '@ant-design/icons'
import { ProCard, StatisticCard } from '@ant-design/pro-components'
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Segmented,
  Skeleton,
  Space,
  Table,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useEffect, useState } from 'react'

import ReportsPageShell from '../ReportsPageShell'

const { RangePicker } = DatePicker
const { Title, Paragraph, Text } = Typography

type RangeKey = '7d' | '30d' | '90d'

type ApiSmartVoteSummary = {
  linkedTopics: number
  openTopics: number
  currentStances: number
  domainsCovered: number
}

type ApiSmartVoteDomain = {
  key: string
  domainCode: string
  domain: string
  topics: number
  currentStances: number
  topicsWithStancesPct: number
  avgRelevancePct: number
}

type ApiSmartVoteResponse = {
  generatedAt: string
  range: {
    key: RangeKey
    days: number
    from: string
    to: string
    semantics: string
  }
  summary: ApiSmartVoteSummary
  history: {
    available: boolean
    reason: string
  }
  domains: ApiSmartVoteDomain[]
}

function computePresetRange(rangeKey: RangeKey): [Dayjs, Dayjs] {
  const end = dayjs()
  const days = rangeKey === '7d' ? 7 : rangeKey === '30d' ? 30 : 90
  return [end.subtract(days - 1, 'day'), end]
}

export default function SmartVoteReportPage(): JSX.Element {
  const [rangeKey, setRangeKey] = useState<RangeKey>('30d')
  const [[start, end], setRange] = useState<[Dayjs, Dayjs]>(() =>
    computePresetRange('30d'),
  )
  const [data, setData] = useState<ApiSmartVoteResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = async (key: RangeKey): Promise<void> => {
    setLoading(true)
    setError(false)

    try {
      const res = await fetch(`/api/reports/smart-vote/?range=${key}`)
      if (!res.ok) throw new Error('Failed to fetch Smart Vote report')
      setData((await res.json()) as ApiSmartVoteResponse)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData(rangeKey)
  }, [rangeKey])

  const handleRangePresetChange = (value: RangeKey | string): void => {
    const key = value as RangeKey
    setRangeKey(key)
    setRange(computePresetRange(key))
  }

  const domainColumns: ColumnsType<ApiSmartVoteDomain> = [
    {
      title: 'Domain',
      dataIndex: 'domain',
      key: 'domain',
      render: (value: string, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Text type="secondary">{row.domainCode}</Text>
        </Space>
      ),
    },
    {
      title: 'Topics in range',
      dataIndex: 'topics',
      key: 'topics',
      width: 140,
    },
    {
      title: 'Current stances',
      dataIndex: 'currentStances',
      key: 'currentStances',
      width: 150,
    },
    {
      title: 'Topics with stances',
      dataIndex: 'topicsWithStancesPct',
      key: 'topicsWithStancesPct',
      width: 170,
      render: (value: number) => `${value.toFixed(1)}%`,
    },
    {
      title: 'Avg relevance',
      dataIndex: 'avgRelevancePct',
      key: 'avgRelevancePct',
      width: 140,
      render: (value: number) => `${value.toFixed(1)}%`,
    },
  ]

  if (loading && !data) {
    return (
      <ReportsPageShell
        title="Smart Vote"
        subtitle="Current Smart Vote coverage over canonical Ethikos source facts."
        metaTitle="Reports · Smart Vote"
      >
        <Skeleton active paragraph={{ rows: 10 }} />
      </ReportsPageShell>
    )
  }

  if (error || !data) {
    return (
      <ReportsPageShell
        title="Smart Vote"
        subtitle="Current Smart Vote coverage over canonical Ethikos source facts."
        metaTitle="Reports · Smart Vote"
      >
        <Empty description="Failed to load Smart Vote analytics">
          <Button icon={<ReloadOutlined />} onClick={() => void fetchData(rangeKey)}>
            Retry
          </Button>
        </Empty>
      </ReportsPageShell>
    )
  }

  const { summary, history, domains, generatedAt } = data

  return (
    <ReportsPageShell
      title="Smart Vote"
      subtitle="Real cross-sectional reporting over Ethikos topics bound to declared Smart Vote readings."
      metaTitle="Reports · Smart Vote"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <ProCard ghost>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Space direction="vertical" size={4}>
                <Text strong>Topic creation range</Text>
                <Segmented
                  value={rangeKey}
                  options={[
                    { label: 'Last 7 days', value: '7d' },
                    { label: 'Last 30 days', value: '30d' },
                    { label: 'Last 90 days', value: '90d' },
                  ]}
                  onChange={(value) => handleRangePresetChange(value as RangeKey)}
                />
              </Space>
            </Col>

            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Space direction="vertical" size={4} style={{ alignItems: 'flex-end' }}>
                <Space>
                  <Text type="secondary">Custom dates disabled</Text>
                  <RangePicker value={[start, end]} disabled />
                </Space>
                <Text type="secondary">
                  Generated {dayjs(generatedAt).format('MMM D, YYYY · HH:mm')}
                </Text>
              </Space>
            </Col>
          </Row>
        </ProCard>

        <Alert
          type="info"
          showIcon
          message="Snapshot semantics"
          description="The selected range filters Ethikos topics by creation date. Metrics below show the current canonical stance state of those topics; they do not claim when each stance was originally cast."
        />

        <ProCard gutter={16} wrap>
          <StatisticCard
            colSpan={{ xs: 24, sm: 12, lg: 6 }}
            statistic={{ title: 'Smart Vote linked topics', value: summary.linkedTopics }}
          />
          <StatisticCard
            colSpan={{ xs: 24, sm: 12, lg: 6 }}
            statistic={{ title: 'Currently open topics', value: summary.openTopics }}
          />
          <StatisticCard
            colSpan={{ xs: 24, sm: 12, lg: 6 }}
            statistic={{ title: 'Current canonical stances', value: summary.currentStances }}
          />
          <StatisticCard
            colSpan={{ xs: 24, sm: 12, lg: 6 }}
            statistic={{ title: 'Relevant domains covered', value: summary.domainsCovered }}
          />
        </ProCard>

        <Card>
          <Title level={4}>Historical trends</Title>
          <Alert
            type="warning"
            showIcon
            message="Historical trend unavailable"
            description={history.reason}
          />
          <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
            A real time-series report requires an append-only stance/vote event log. Until that source exists, Konnaxion does not synthesize participation, consensus, or polarization history.
          </Paragraph>
        </Card>

        <Card>
          <Title id="smart-vote-domain-heading" level={4} style={{ marginBottom: 8 }}>
            Domain coverage · EkoH relevance
          </Title>
          <Paragraph type="secondary">
            Each row is derived from the real Smart Vote source bindings, consultation relevance vector, and current Ethikos stances. A topic may contribute to more than one declared relevant domain.
          </Paragraph>
          <Table<ApiSmartVoteDomain>
            size="small"
            rowKey="key"
            columns={domainColumns}
            dataSource={domains}
            pagination={false}
            locale={{ emptyText: 'No Smart Vote-linked topics were created in this range.' }}
            aria-labelledby="smart-vote-domain-heading"
          />
        </Card>
      </Space>
    </ReportsPageShell>
  )
}
