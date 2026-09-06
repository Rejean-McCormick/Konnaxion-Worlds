// FILE: frontend/modules/konsultations/pages/ConsultationsHomePage.tsx
﻿'use client';

import {
  BarChartOutlined,
  GlobalOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  type ProColumns,
  ProTable,
  StatisticCard,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Empty,
  Progress,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';

import usePageTitle from '@/hooks/usePageTitle';
import {
  fetchPublicBallots,
  type PublicBallot,
  type PublicBallotResponse,
} from '@/services/decide';
import {
  fetchImpactOutcomes,
  type OutcomeKPI,
} from '@/services/impact';

const { Paragraph, Text } = Typography;

type BallotRow = PublicBallot;
type ImpactData = Awaited<ReturnType<typeof fetchImpactOutcomes>>;

export default function ConsultationsHomePage(): JSX.Element {
  usePageTitle('Konsultations · Home');

  const { data: ballotsData, loading: loadingBallots } =
    useRequest<PublicBallotResponse, []>(fetchPublicBallots);

  const { data: impactData, loading: loadingImpact } =
    useRequest<ImpactData, []>(fetchImpactOutcomes);

  const ballots = ballotsData?.ballots ?? [];
  const impactKpis = impactData?.kpis ?? [];
  const loading = loadingBallots || loadingImpact;

  const totalConsultations = ballots.length;
  const avgTurnout =
    totalConsultations > 0
      ? Math.round(
          ballots.reduce((sum, b) => sum + (b.turnout ?? 0), 0) /
            totalConsultations,
        )
      : 0;

  const closingSoonCount = ballots.filter((ballot) => {
    const closes = dayjs(ballot.closesAt);
    return closes.isValid() && closes.diff(dayjs(), 'hour') <= 48;
  }).length;

  const headerStats = [
    { label: 'Active consultations', value: totalConsultations },
    { label: 'Avg participation', value: avgTurnout, suffix: '%' },
    { label: 'Closing ≤ 48h', value: closingSoonCount },
  ];

  const kpiByKey = new Map<string, OutcomeKPI>();
  for (const k of impactKpis) {
    kpiByKey.set(k.key, k);
  }

  const impactSummaryKpis: OutcomeKPI[] = [
    kpiByKey.get('resolved'),
    kpiByKey.get('participation'),
    kpiByKey.get('agreement'),
    kpiByKey.get('open'),
  ].filter(Boolean) as OutcomeKPI[];

  const columns: ProColumns<BallotRow>[] = [
    {
      title: 'Consultation',
      dataIndex: 'title',
      width: 320,
      ellipsis: true,
    },
    {
      title: 'Closes',
      dataIndex: 'closesAt',
      width: 220,
      render: (_, row) => {
        const closes = dayjs(row.closesAt);
        const closingSoon =
          closes.isValid() && closes.diff(dayjs(), 'hour') <= 48;

        return (
          <Space direction="vertical" size={2}>
            <span>
              {closes.isValid()
                ? closes.format('YYYY-MM-DD HH:mm')
                : '—'}
            </span>
            {closingSoon && <Tag color="volcano">Closing soon</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Turnout',
      dataIndex: 'turnout',
      width: 180,
      render: (_, row) => {
        const turnout = Math.round(row.turnout ?? 0);
        return (
          <Space>
            <Progress type="circle" percent={turnout} width={44} />
            <span>{turnout}%</span>
          </Space>
        );
      },
    },
    {
      title: 'Scope',
      dataIndex: 'scope',
      width: 120,
      render: (_, row) => <Tag color="purple">{row.scope}</Tag>,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      width: 240,
      render: () => (
        <Space>
          <Link href="/ethikos/decide/public" prefetch={false}>
            <Button size="small" type="primary">
              Open voting
            </Button>
          </Link>
          <Link href="/ethikos/decide/results" prefetch={false}>
            <Button size="small" icon={<BarChartOutlined />}>
              Results
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      ghost
      loading={loading}
      header={{
        title: 'Konsultations',
        subTitle:
          'Time‑boxed public consultations on Ethikos topics, with transparent weighted outcomes.',
      }}
    >
      <Space
        direction="vertical"
        size="large"
        style={{ width: '100%' }}
      >
        <Alert
          type="info"
          showIcon
          message="How Konsultations fit into Ethikos"
          description={
            <Paragraph style={{ marginBottom: 0 }}>
              Consultations sit on top of Korum debates. While a
              consultation is open, verified participants can express a
              nuanced stance on a −3…+3 scale. Once closed, outcomes feed
              into the Ethikos impact tracker and opinion analytics.
            </Paragraph>
          }
        />

        <ProCard gutter={16} wrap>
          {headerStats.map((stat) => (
            <StatisticCard
              key={stat.label}
              colSpan={{ xs: 24, sm: 8, md: 6 }}
              statistic={{
                title: stat.label,
                value: stat.value,
                suffix: stat.suffix,
              }}
            />
          ))}

          {impactSummaryKpis.map((kpi) => (
            <StatisticCard
              key={kpi.key}
              colSpan={{ xs: 24, sm: 8, md: 6 }}
              statistic={{
                title: kpi.label,
                value: kpi.value,
                suffix:
                  typeof kpi.delta === 'number' ? '%' : undefined,
              }}
            />
          ))}
        </ProCard>

        <ProCard
          title="Open consultations snapshot"
          extra={
            <Space>
              <Text type="secondary">
                Snapshot of public Ethikos consultations currently open
                for voting.
              </Text>
              <Link href="/ethikos/decide/public" prefetch={false}>
                <Button
                  type="default"
                  size="small"
                  icon={<GlobalOutlined />}
                >
                  Go to full list
                </Button>
              </Link>
            </Space>
          }
        >
          {ballots.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No open public consultations right now."
            />
          ) : (
            <ProTable<BallotRow>
              rowKey="id"
              size="small"
              columns={columns}
              dataSource={ballots}
              pagination={{ pageSize: 5 }}
              search={false}
              options={false}
              toolBarRender={false}
            />
          )}
        </ProCard>

        <ProCard
          title="Outcomes and implementation"
          extra={
            <Space>
              <Link href="/ethikos/impact/outcomes" prefetch={false}>
                <Button
                  size="small"
                  icon={<BarChartOutlined />}
                >
                  Outcomes analytics
                </Button>
              </Link>
              <Link href="/ethikos/impact/tracker" prefetch={false}>
                <Button
                  size="small"
                  icon={<HistoryOutlined />}
                >
                  Impact tracker
                </Button>
              </Link>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Use Ethikos impact dashboards to follow how consultation
            results translate into decisions and implementation work over
            time.
          </Paragraph>
        </ProCard>
      </Space>
    </PageContainer>
  );
}
