// FILE: frontend/app/ekoh/overview-analytics/current-ekoh-score/page.tsx
'use client';

import {
  Alert,
  Card,
  Col,
  Empty,
  List,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

import EkohPageShell from '@/app/ekoh/EkohPageShell';
import useReputationEvents from '@/hooks/useReputationEvents';
import type { EkohExpertiseScore, EkohScoreHistoryEntry } from '@/services/ekoh';

const { Paragraph, Text } = Typography;

function percent(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

function dateLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

const historyColumns: ColumnsType<EkohScoreHistoryEntry> = [
  {
    title: 'Changed',
    dataIndex: 'changedAt',
    key: 'changedAt',
    render: (value: string) => dateLabel(value),
  },
  {
    title: 'Domain',
    key: 'domain',
    render: (_, row) => (
      <Space wrap>
        <Text>{row.domainName}</Text>
        <Tag>{row.domainCode}</Tag>
      </Space>
    ),
  },
  {
    title: 'Previous',
    dataIndex: 'oldValue',
    key: 'oldValue',
    render: (value: number) => `${percent(value)}%`,
  },
  {
    title: 'Current',
    dataIndex: 'newValue',
    key: 'newValue',
    render: (value: number) => `${percent(value)}%`,
  },
  {
    title: 'Reason',
    dataIndex: 'changeReason',
    key: 'changeReason',
    render: (value: string) => value || 'Not supplied',
  },
];

export default function CurrentEkohScore(): JSX.Element {
  const { data, isLoading, isError, error } = useReputationEvents();
  const profile = data?.ekohProfile ?? null;
  const expertise = profile?.expertise ?? [];
  const history = profile?.scoreHistory ?? [];
  const topDomain = expertise[0];

  return (
    <EkohPageShell
      title="EkoH profile analytics"
      subtitle="Canonical expertise, ethics context, visibility, and disclosed score history."
    >
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Unable to load EkoH profile"
          description={(error as Error | undefined)?.message ?? 'Please try again.'}
          style={{ marginBottom: 16 }}
        />
      )}

      <Alert
        type="info"
        showIcon
        message="No synthetic composite score"
        description="EkoH exposes domain expertise and an ethics/reliability modifier. This page does not combine them with community feedback or random values into an invented universal score."
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card loading={isLoading}>
            <Statistic title="Expertise domains" value={expertise.length} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={isLoading}>
            <Statistic
              title="Strongest domain"
              value={topDomain ? percent(topDomain.weightedScore) : 0}
              suffix={topDomain ? '%' : undefined}
            />
            {topDomain && <Tag style={{ marginTop: 8 }}>{topDomain.domainName}</Tag>}
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={isLoading}>
            <Statistic
              title="Ethics / reliability modifier"
              value={profile?.ethicsScore ?? 1}
              precision={2}
              suffix="×"
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={isLoading}>
            <Statistic
              title="Rating visibility"
              value={profile?.ratingVisibility ?? 'N/A'}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Domain expertise" loading={isLoading} style={{ marginTop: 16 }}>
        {expertise.length ? (
          <List<EkohExpertiseScore>
            dataSource={expertise}
            renderItem={(item) => {
              const value = percent(item.weightedScore);
              return (
                <List.Item key={item.domainCode}>
                  <div style={{ width: '100%' }}>
                    <Space
                      style={{ width: '100%', justifyContent: 'space-between' }}
                      wrap
                    >
                      <Space wrap>
                        <Text strong>{item.domainName}</Text>
                        <Tag>{item.domainCode}</Tag>
                      </Space>
                      <Text type="secondary">{value}%</Text>
                    </Space>
                    <Progress percent={value} showInfo={false} />
                  </div>
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty description="No canonical EkoH expertise profile available" />
        )}
      </Card>

      <Card title="Disclosed score history" loading={isLoading} style={{ marginTop: 16 }}>
        {history.length ? (
          <Table<EkohScoreHistoryEntry>
            rowKey={(row) => `${row.domainCode}-${row.changedAt}`}
            columns={historyColumns}
            dataSource={history}
            pagination={false}
          />
        ) : (
          <Empty description="No score history available in the current EkoH access scope" />
        )}
      </Card>

      {profile?.ratingPublicationBasis && (
        <Card title="Publication basis" style={{ marginTop: 16 }}>
          <Paragraph style={{ marginBottom: 0 }}>
            {profile.ratingPublicationBasis}
          </Paragraph>
        </Card>
      )}
    </EkohPageShell>
  );
}
