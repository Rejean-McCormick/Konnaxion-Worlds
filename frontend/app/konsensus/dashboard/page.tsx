// FILE: frontend/app/konsensus/dashboard/page.tsx
'use client';

import {
  BellOutlined,
  FireOutlined,
  RadarChartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Card,
  Col,
  List,
  Progress,
  Row,
  Statistic,
  Tag,
  Timeline,
} from 'antd';
import Head from 'next/head';
import React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import EkohPageShell from '@/app/ekoh/EkohPageShell';

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

type ConsensusPoint = {
  day: string;
  consensus: number;
  participation: number;
};

type Topic = {
  id: string;
  title: string;
  module: string;
  consensus: number; // percentage
  status: 'aligned' | 'contested';
};

type ModuleBreakdown = {
  module: string;
  primaryDomain: string;
  consensus: number;
  participation: number;
};

type EventItem = {
  id: string;
  label: string;
  ts: string;
  type: 'decision' | 'debate' | 'alert';
};

const consensusTrendData: ConsensusPoint[] = [
  { day: 'Mon', consensus: 64, participation: 48 },
  { day: 'Tue', consensus: 67, participation: 52 },
  { day: 'Wed', consensus: 69, participation: 55 },
  { day: 'Thu', consensus: 71, participation: 58 },
  { day: 'Fri', consensus: 73, participation: 60 },
  { day: 'Sat', consensus: 72, participation: 57 },
  { day: 'Sun', consensus: 75, participation: 62 },
];

const topTopics: Topic[] = [
  {
    id: 't1',
    title: 'Youth climate priorities for 2030',
    module: 'Ethikos',
    consensus: 82,
    status: 'aligned',
  },
  {
    id: 't2',
    title: 'Local mobility plan – car-free core',
    module: 'Ekoh',
    consensus: 68,
    status: 'contested',
  },
  {
    id: 't3',
    title: 'Community solar cooperative model',
    module: 'KeenKonnect',
    consensus: 77,
    status: 'aligned',
  },
];

const moduleBreakdown: ModuleBreakdown[] = [
  {
    module: 'Ekoh',
    primaryDomain: 'Collective reputation & Smart Vote',
    consensus: 74,
    participation: 63,
  },
  {
    module: 'Ethikos',
    primaryDomain: 'Ethical debates & norms',
    consensus: 79,
    participation: 58,
  },
  {
    module: 'KeenKonnect',
    primaryDomain: 'Projects & teams',
    consensus: 70,
    participation: 54,
  },
  {
    module: 'KonnectED',
    primaryDomain: 'Learning journeys',
    consensus: 66,
    participation: 49,
  },
  {
    module: 'Kreative',
    primaryDomain: 'Cultural projects',
    consensus: 72,
    participation: 51,
  },
];

const recentEvents: EventItem[] = [
  {
    id: 'e1',
    label: 'Consensus reached on “Youth climate priorities for 2030”',
    ts: 'Today · 14:23',
    type: 'decision',
  },
  {
    id: 'e2',
    label: 'New debate opened: “Circular economy hub for district 4”',
    ts: 'Today · 09:05',
    type: 'debate',
  },
  {
    id: 'e3',
    label: 'Alert: Participation drop in “Mobility plan – car-free core”',
    ts: 'Yesterday · 19:11',
    type: 'alert',
  },
  {
    id: 'e4',
    label: 'Cross-module poll synced from Ethikos Pulse',
    ts: 'Yesterday · 11:47',
    type: 'debate',
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function KonsensusDashboardPage(): JSX.Element {
  const activeDebates = 42;
  const todayVotes = 1180;
  const avgConsensus = 72;

  return (
    <>
      <Head>
        <title>Konsensus · Kollective Dashboard</title>
        <meta
          name="description"
          content="Cross-module Konsensus dashboard aggregating Smart Vote, debates and participation across Konnaxion."
        />
      </Head>

      <EkohPageShell
        title="Konsensus Dashboard"
        subtitle={
          <>
            Cross-module snapshot of collective decisions, Smart Vote signals and
            participation across all Konnaxion suites.
          </>
        }
      >
        {/* Top KPIs */}
        <Row gutter={16} className="mb-6">
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Active debates"
                value={activeDebates}
                suffix="ongoing"
                prefix={<FireOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Votes cast today"
                value={todayVotes}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Average consensus index"
                value={avgConsensus}
                suffix="%"
                prefix={<RadarChartOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Trend chart */}
        <Card className="mb-6" title="Consensus & participation (last 7 days)">
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <ReLineChart data={consensusTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <ReTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="consensus"
                  name="Consensus index"
                  stroke="#1677ff"
                />
                <Line
                  type="monotone"
                  dataKey="participation"
                  name="Participation"
                  stroke="#52c41a"
                />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top topics */}
        <Card className="mb-6" title="Top consensus topics">
          <List
            itemLayout="horizontal"
            dataSource={topTopics}
            renderItem={(topic) => {
              const color =
                topic.status === 'aligned' ? 'green' : 'orange';

              return (
                <List.Item key={topic.id}>
                  <List.Item.Meta
                    title={topic.title}
                    description={`${topic.module} · Consensus ${topic.consensus}%`}
                  />
                  <Tag color={color}>
                    {topic.status === 'aligned'
                      ? 'High alignment'
                      : 'Contested'}
                  </Tag>
                </List.Item>
              );
            }}
          />
        </Card>

        {/* Module breakdown + recent events */}
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Card title="Consensus by module" className="mb-6">
              <List
                itemLayout="horizontal"
                dataSource={moduleBreakdown}
                renderItem={(item) => (
                  <List.Item key={item.module}>
                    <List.Item.Meta
                      title={
                        <>
                          {item.module}{' '}
                          <Tag>{item.primaryDomain}</Tag>
                        </>
                      }
                      description={`Consensus ${item.consensus}% · Participation ${item.participation}%`}
                    />
                    <div style={{ minWidth: 160 }}>
                      <Progress
                        percent={item.consensus}
                        size="small"
                      />
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title="Recent Kollective events"
              className="mb-6"
              extra={<BellOutlined />}
            >
              <Timeline
                items={recentEvents.map((event) => {
                  const color =
                    event.type === 'alert'
                      ? 'red'
                      : event.type === 'decision'
                      ? 'green'
                      : 'blue';

                  return {
                    color,
                    children: (
                      <div key={event.id}>
                        <strong>{event.label}</strong>
                        <div className="text-xs text-gray-500">
                          {event.ts}
                        </div>
                      </div>
                    ),
                  };
                })}
              />
            </Card>
          </Col>
        </Row>
      </EkohPageShell>
    </>
  );
}
