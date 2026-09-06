// FILE: frontend/app/ethikos/impact/outcomes/page.tsx
// app/ethikos/impact/outcomes/page.tsx
'use client';

import { BarChartOutlined } from '@ant-design/icons';
import { Bar, Line } from '@ant-design/plots';
import {
  PageContainer,
  ProCard,
  type ProColumns,
  ProTable,
  StatisticCard,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Divider, Empty, Space, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import {
  type DecisionResult,
  fetchDecisionResults,
} from '@/services/decide';
import { fetchImpactOutcomes } from '@/services/impact';

const { Text } = Typography;

type OutcomesData = Awaited<ReturnType<typeof fetchImpactOutcomes>>;
type DecisionResultsData = Awaited<ReturnType<typeof fetchDecisionResults>>;

type DecisionRow = DecisionResult & { key: string };

export default function Outcomes(): JSX.Element {
  const { data: outcomesData, loading: loadingOutcomes } =
    useRequest<OutcomesData, []>(fetchImpactOutcomes);

  const { data: decisionResults, loading: loadingDecisions } =
    useRequest<DecisionResultsData, []>(fetchDecisionResults);

  const loading = loadingOutcomes || loadingDecisions;

  const kpis = outcomesData?.kpis ?? [];
  const charts = outcomesData?.charts ?? [];

  const decisionsItems = decisionResults?.items ?? [];

  const decisionRows: DecisionRow[] = decisionsItems.map((d) => ({
    ...d,
    key: d.id,
  }));

  const decisionRegionMap = new Map<
    string,
    { region: string; passed: number; rejected: number }
  >();

  for (const d of decisionRows) {
    const region = d.region ?? 'Unspecified';
    const bucket = decisionRegionMap.get(region) ?? {
      region,
      passed: 0,
      rejected: 0,
    };

    if (d.passed) {
      bucket.passed += 1;
    } else {
      bucket.rejected += 1;
    }

    decisionRegionMap.set(region, bucket);
  }

  const decisionOutcomeData = [
    ...Array.from(decisionRegionMap.values()).map((r) => ({
      region: r.region,
      outcome: 'Passed',
      value: r.passed,
    })),
    ...Array.from(decisionRegionMap.values()).map((r) => ({
      region: r.region,
      outcome: 'Rejected',
      value: r.rejected,
    })),
  ];

  const decisionOutcomeConfig = {
    data: decisionOutcomeData,
    isGroup: true,
    xField: 'region',
    yField: 'value',
    seriesField: 'outcome',
  };

  const decisionsColumns: ProColumns<DecisionRow>[] = [
    {
      title: 'Decision',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 260,
    },
    {
      title: 'Result',
      dataIndex: 'passed',
      key: 'passed',
      width: 120,
      render: (_, row) => (
        <Tag color={row.passed ? 'green' : 'red'}>
          {row.passed ? 'PASSED' : 'REJECTED'}
        </Tag>
      ),
    },
    {
      title: 'Scope',
      dataIndex: 'scope',
      key: 'scope',
      width: 120,
      render: (_, row) => (
        <Tag color={row.scope === 'Elite' ? 'geekblue' : 'default'}>
          {row.scope}
        </Tag>
      ),
    },
    {
      title: 'Region',
      dataIndex: 'region',
      key: 'region',
      ellipsis: true,
      render: (_, row) =>
        row.region ?? <Text type="secondary">Unspecified</Text>,
    },
    {
      title: 'Closed at',
      dataIndex: 'closesAt',
      key: 'closesAt',
      width: 180,
      valueType: 'date',
      render: (_, row) => dayjs(row.closesAt).format('YYYY-MM-DD'),
    },
  ];

  return (
    <EthikosPageShell
      title="Impact · Outcomes"
      sectionLabel="Impact"
      subtitle="Aggregated decision outcomes, agreement levels and regional distribution across Ethikos debates."
    >
      <PageContainer ghost loading={loading}>
        <ProCard gutter={[16, 16]} wrap>
          <ProCard
            colSpan={{ xs: 24, xl: 8 }}
            title={
              <Space>
                <BarChartOutlined />
                <span>Impact · Outcomes</span>
              </Space>
            }
          >
            {kpis.length ? (
              <Space
                direction="vertical"
                style={{ width: '100%' }}
                size="large"
              >
                <Space size="large" wrap>
                  {kpis.map((kpi) => (
                    <StatisticCard
                      key={kpi.key}
                      statistic={{
                        title: kpi.label,
                        value: kpi.value,
                        suffix: kpi.key === 'agreement' ? '%' : undefined,
                        description:
                          typeof kpi.delta === 'number' ? (
                            <span
                              style={{
                                color:
                                  kpi.delta >= 0 ? '#3f8600' : '#cf1322',
                              }}
                            >
                              {kpi.delta >= 0 ? '▲' : '▼'}{' '}
                              {Math.abs(kpi.delta)}%
                            </span>
                          ) : null,
                      }}
                    />
                  ))}
                </Space>

                <Divider />

                <Space direction="vertical" size={8}>
                  <Text type="secondary">Highlights</Text>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    <li>
                      <Text>
                        <Text strong>
                          {kpis.find((k) => k.key === 'resolved')?.value ?? 0}
                        </Text>{' '}
                        decisions resolved overall.
                      </Text>
                    </li>
                    <li>
                      <Text>
                        Average agreement is{' '}
                        <Text strong>
                          {kpis.find((k) => k.key === 'agreement')?.value ?? 0}
                          %
                        </Text>
                        , combining stance direction and turnout.
                      </Text>
                    </li>
                    <li>
                      <Text>
                        Participation volume is{' '}
                        <Text strong>
                          {kpis.find((k) => k.key === 'participation')?.value ??
                            0}
                        </Text>{' '}
                        total stances across all debates.
                      </Text>
                    </li>
                  </ul>
                </Space>
              </Space>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No outcome metrics available yet"
              />
            )}
          </ProCard>

          <ProCard
            colSpan={{ xs: 24, xl: 8 }}
            title={
              <Space>
                <BarChartOutlined />
                <span>Outcome distribution</span>
              </Space>
            }
          >
            {charts.length ? (
              <Tabs
                items={charts.map((c) => ({
                  key: c.key,
                  label: c.title,
                  children: (
                    <ProCard ghost>
                      {c.type === 'line' && <Line {...c.config} />}
                      {c.type === 'bar' && <Bar {...c.config} />}
                    </ProCard>
                  ),
                }))}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No outcome charts available yet"
              />
            )}
          </ProCard>

          <ProCard
            colSpan={{ xs: 24, xl: 8 }}
            title="Closed decisions · outcomes vs engagement"
            extra={
              <Text type="secondary">
                {decisionRows.length
                  ? `${decisionRows.length} closed decisions`
                  : 'No closed decisions yet'}
              </Text>
            }
          >
            <ProCard split="horizontal" ghost>
              <ProCard title="Outcomes by region">
                {decisionOutcomeData.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No regional outcome data available"
                  />
                ) : (
                  <Bar {...decisionOutcomeConfig} />
                )}
              </ProCard>

              <ProCard title="Closed decisions">
                {decisionRows.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No closed decisions yet"
                  />
                ) : (
                  <ProTable<DecisionRow>
                    rowKey="key"
                    size="small"
                    columns={decisionsColumns}
                    dataSource={decisionRows}
                    pagination={{ pageSize: 8 }}
                    search={false}
                    options={false}
                    toolBarRender={false}
                  />
                )}
              </ProCard>
            </ProCard>
          </ProCard>
        </ProCard>
      </PageContainer>
    </EthikosPageShell>
  );
}