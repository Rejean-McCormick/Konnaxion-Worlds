// FILE: frontend/app/keenkonnect/sustainability-impact/sustainability-dashboard/page.tsx
'use client';

import { Area, Column, Line } from '@ant-design/plots';
import { Card, Col, Row, Select, Space, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';

import KeenPageShell from '@/app/keenkonnect/KeenPageShell';

type TimeRange = '3m' | '6m' | '12m';

type ProjectRow = {
  key: string;
  name: string;
  owner: string;
  co2SavedKg: number;
  energySavedKwh: number;
  impactScore: number;
  tags: string[];
};

// --- Données simulées (placeholder) ---

const overviewStats = {
  totalCo2SavedKg: 28450,
  totalEnergySavedKwh: 19320,
  wasteDivertedKg: 5270,
  activeProjects: 12,
};

const co2TrendBase = [
  { month: '2025-01', value: 1200 },
  { month: '2025-02', value: 1350 },
  { month: '2025-03', value: 1480 },
  { month: '2025-04', value: 1600 },
  { month: '2025-05', value: 1705 },
  { month: '2025-06', value: 1820 },
  { month: '2025-07', value: 1960 },
  { month: '2025-08', value: 2100 },
  { month: '2025-09', value: 2240 },
  { month: '2025-10', value: 2390 },
  { month: '2025-11', value: 2525 },
  { month: '2025-12', value: 2680 },
];

const energyTrendBase = [
  { month: '2025-01', value: 800 },
  { month: '2025-02', value: 950 },
  { month: '2025-03', value: 1020 },
  { month: '2025-04', value: 1100 },
  { month: '2025-05', value: 1200 },
  { month: '2025-06', value: 1300 },
  { month: '2025-07', value: 1380 },
  { month: '2025-08', value: 1450 },
  { month: '2025-09', value: 1525 },
  { month: '2025-10', value: 1600 },
  { month: '2025-11', value: 1680 },
  { month: '2025-12', value: 1760 },
];

const categoryDistribution = [
  { category: 'CO₂ reduction', value: 42 },
  { category: 'Energy efficiency', value: 28 },
  { category: 'Waste diversion', value: 18 },
  { category: 'Water savings', value: 12 },
];

const projectLeaderboard: ProjectRow[] = [
  {
    key: 'p1',
    name: 'Green Data Center Optimization',
    owner: 'IT & Infrastructure',
    co2SavedKg: 12000,
    energySavedKwh: 8300,
    impactScore: 96,
    tags: ['Scope 2', 'Cloud', 'Efficiency'],
  },
  {
    key: 'p2',
    name: 'Smart Building Automation',
    owner: 'Facilities',
    co2SavedKg: 7800,
    energySavedKwh: 6200,
    impactScore: 92,
    tags: ['Scope 1', 'IoT'],
  },
  {
    key: 'p3',
    name: 'Remote Work Program',
    owner: 'HR',
    co2SavedKg: 5400,
    energySavedKwh: 2300,
    impactScore: 88,
    tags: ['Commuting', 'Culture'],
  },
  {
    key: 'p4',
    name: 'Waste-to-Value Initiative',
    owner: 'Operations',
    co2SavedKg: 3250,
    energySavedKwh: 520,
    impactScore: 84,
    tags: ['Circularity', 'Waste'],
  },
];

export default function SustainabilityDashboardPage(): JSX.Element {
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');

  const filteredCo2Trend = useMemo(() => {
    if (timeRange === '3m') return co2TrendBase.slice(-3);
    if (timeRange === '6m') return co2TrendBase.slice(-6);
    return co2TrendBase;
  }, [timeRange]);

  const filteredEnergyTrend = useMemo(() => {
    if (timeRange === '3m') return energyTrendBase.slice(-3);
    if (timeRange === '6m') return energyTrendBase.slice(-6);
    return energyTrendBase;
  }, [timeRange]);

  // --- Configs graphiques @ant-design/plots ---

  const co2LineConfig = {
    data: filteredCo2Trend,
    xField: 'month',
    yField: 'value',
    height: 260,
    smooth: true,
    xAxis: {
      label: {
        formatter: (v: string) => v.slice(5), // Affiche seulement le mois
      },
    },
    yAxis: {
      label: {
        formatter: (v: number) => `${v} kg`,
      },
    },
    tooltip: {
      formatter: (datum: { month: string; value: number }) => ({
        name: 'CO₂ saved',
        value: `${datum.value.toLocaleString()} kg`,
      }),
    },
  };

  const energyAreaConfig = {
    data: filteredEnergyTrend,
    xField: 'month',
    yField: 'value',
    height: 260,
    smooth: true,
    xAxis: {
      label: {
        formatter: (v: string) => v.slice(5),
      },
    },
    yAxis: {
      label: {
        formatter: (v: number) => `${v} kWh`,
      },
    },
    areaStyle: {
      fillOpacity: 0.3,
    },
    tooltip: {
      formatter: (datum: { month: string; value: number }) => ({
        name: 'Energy saved',
        value: `${datum.value.toLocaleString()} kWh`,
      }),
    },
  };

  const categoryColumnConfig = {
    data: categoryDistribution,
    xField: 'category',
    yField: 'value',
    height: 260,
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    label: {
      position: 'middle' as const,
      formatter: (datum: { value: number }) => `${datum.value}%`,
    },
    tooltip: {
      formatter: (datum: { category: string; value: number }) => ({
        name: datum.category,
        value: `${datum.value}%`,
      }),
    },
  };

  // --- Tableau des projets ---

  const columns: ColumnsType<ProjectRow> = [
    {
      title: 'Project',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
    },
    {
      title: 'CO₂ saved (kg)',
      dataIndex: 'co2SavedKg',
      key: 'co2SavedKg',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Energy saved (kWh)',
      dataIndex: 'energySavedKwh',
      key: 'energySavedKwh',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Impact score',
      dataIndex: 'impactScore',
      key: 'impactScore',
      render: (value: number) => `${value}/100`,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </>
      ),
    },
  ];

  return (
    <KeenPageShell
      title="Sustainability Impact Dashboard"
      description="High-level dashboard aggregating sustainability impact across KeenKonnect projects."
      metaTitle="KeenKonnect · Sustainability Impact Dashboard"
      toolbar={
        <Space>
          <span>Time range:</span>
          <Select<TimeRange>
            size="small"
            value={timeRange}
            onChange={setTimeRange}
            options={[
              { label: 'Last 3 months', value: '3m' },
              { label: 'Last 6 months', value: '6m' },
              { label: 'Last 12 months', value: '12m' },
            ]}
            style={{ minWidth: 140 }}
          />
        </Space>
      }
    >
      {/* KPIs principaux (4 stats) */}
      <Card className="mb-4">
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Statistic
              title="Total CO₂ saved"
              value={overviewStats.totalCo2SavedKg}
              suffix="kg"
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Total energy saved"
              value={overviewStats.totalEnergySavedKwh}
              suffix="kWh"
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Waste diverted"
              value={overviewStats.wasteDivertedKg}
              suffix="kg"
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Active projects"
              value={overviewStats.activeProjects}
            />
          </Col>
        </Row>
      </Card>

      {/* Lignes / Colonnes principales */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} xl={16}>
          <Card title="Timeline of CO₂ saved (kg)">
            <Line {...co2LineConfig} />
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Impact category distribution">
            <Column {...categoryColumnConfig} />
          </Card>
        </Col>
      </Row>

      {/* Area + Leaderboard */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Energy savings trend (kWh)">
            <Area {...energyAreaConfig} />
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title="Top projects by impact">
            <Table<ProjectRow>
              size="small"
              rowKey="key"
              columns={columns}
              dataSource={projectLeaderboard}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </KeenPageShell>
  );
}
