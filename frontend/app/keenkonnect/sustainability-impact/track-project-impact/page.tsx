// FILE: frontend/app/keenkonnect/sustainability-impact/track-project-impact/page.tsx
'use client';

import {
  Alert,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Row,
  Select,
  Spin,
  Tabs,
  Timeline,
} from 'antd';
import dayjs from 'dayjs';
import React, { Suspense, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import KeenPageShell from '@/app/keenkonnect/KeenPageShell';

const { RangePicker } = DatePicker;

type ImpactItem = {
  category: string;
  value: number;
};

const PREVIEW_IMPACT_DATA: ImpactItem[] = [
  { category: 'Community benefit', value: 72 },
  { category: 'Environmental stewardship', value: 61 },
  { category: 'Knowledge sharing', value: 84 },
];

type Filters = {
  from: string;
  to: string;
  team?: string;
};

const COLORS = ['#4e91ff', '#34c759', '#ff9f0a', '#ff375f', '#af52de'];

export default function TrackProjectImpactPage(): JSX.Element {
  return (
    <KeenPageShell
      title="Track Project Impact"
      description="Monitor sustainability impact across projects over time."
    >
      <Suspense fallback={<Spin style={{ marginTop: 40 }} />}>
        <Content />
      </Suspense>
    </KeenPageShell>
  );
}

function Content(): JSX.Element {
  const [filters, setFilters] = useState<Filters>({
    from: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD'),
    team: undefined,
  });
  const impactData = PREVIEW_IMPACT_DATA;


  const chartData = useMemo(
    () =>
      (impactData ?? []).map((item) => ({
        name: item.category,
        value: item.value,
      })),
    [impactData],
  );

  const totalImpact = useMemo(
    () => (impactData ?? []).reduce((sum, item) => sum + (item.value ?? 0), 0),
    [impactData],
  );

  const topCategory = useMemo(() => {
    if (!impactData || impactData.length === 0) return undefined;

    return impactData.reduce<ImpactItem>(
      (max, item) => (item.value > max.value ? item : max),
      impactData[0]!,
    );
  }, [impactData]);


  const hasData = chartData.length > 0;

  return (
    <>
      <Alert
        type="info"
        showIcon
        message="Impact analytics preview"
        description="No native KeenKonnect impact analytics contract is exposed in this build. The charts below use declared preview values; filters are illustrative only."
        style={{ marginBottom: 16 }}
      />
      {/* Main filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <RangePicker
              defaultValue={[dayjs(filters.from), dayjs(filters.to)]}
              style={{ width: '100%' }}
              onChange={(range) => {
                if (!range || !range[0] || !range[1]) return;
                const [start, end] = range;
                setFilters((f) => ({
                  ...f,
                  from: start.format('YYYY-MM-DD'),
                  to: end.format('YYYY-MM-DD'),
                }));
              }}
            />
          </Col>

          <Col xs={24} md={12}>
            <Select
              placeholder="Filter by team"
              style={{ width: '100%' }}
              allowClear
              value={filters.team}
              onChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  team: value || undefined,
                }))
              }
              options={[
                { label: 'Team A', value: 'team-a' },
                { label: 'Team B', value: 'team-b' },
                { label: 'Team C', value: 'team-c' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {!hasData ? (
        <Card>
          <Empty description="No impact data for the selected filters" />
        </Card>
      ) : (
        <Tabs
          defaultActiveKey="overview"
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: (
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={14}>
                    <Card title="Impact by Category">
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                          >
                            {chartData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <ReTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>

                  <Col xs={24} md={10}>
                    <Card title="Summary">
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Total impact value">
                          {totalImpact}
                        </Descriptions.Item>
                        <Descriptions.Item label="Number of categories">
                          {impactData.length}
                        </Descriptions.Item>
                        <Descriptions.Item label="Top category">
                          {topCategory?.category ?? '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Top category value">
                          {topCategory?.value ?? '—'}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'timeline',
              label: 'Timeline',
              children: (
                <Card title="Impact Timeline">
                  <Timeline
                    items={impactData.map((item) => ({
                      key: item.category,
                      children: (
                        <>
                          <div style={{ fontWeight: 500 }}>{item.category}</div>
                          <div style={{ color: '#666' }}>
                            Impact value: {item.value}
                          </div>
                        </>
                      ),
                    }))}
                  />
                </Card>
              ),
            },
            {
              key: 'breakdown',
              label: 'Category Breakdown',
              children: (
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={16}>
                    <Card title="Impact by Category (Bar Chart)">
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <ReTooltip />
                          <Bar dataKey="value">
                            {chartData.map((_, index) => (
                              <Cell
                                key={index}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>

                  <Col xs={24} md={8}>
                    <Card title="Category Details">
                      <Descriptions column={1} size="small" bordered>
                        {impactData.map((item, index) => (
                          <Descriptions.Item
                            key={`${item.category}-${index}`}
                            label={item.category}
                          >
                            {item.value}
                          </Descriptions.Item>
                        ))}
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      )}
    </>
  );
}
