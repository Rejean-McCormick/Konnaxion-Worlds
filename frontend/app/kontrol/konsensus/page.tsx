// FILE: frontend/app/kontrol/konsensus/page.tsx
'use client';


import {
  ExperimentOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  ProCard,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSlider,
  ProFormSwitch,
} from '@ant-design/pro-components';
import {
  Alert,
  Col,
  List,
  message,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import React, { useState } from 'react';

import { apiFetch } from '@/api';
import KontrolPageShell from '@/app/kontrol/KontrolPageShell';

const { Text } = Typography;

// ---- Types for backend config so `data` is not `unknown` ----

type KonsensusConfigExtraSettings = {
  algorithm?: string;
  allow_delegation?: boolean;
  network?: string;
  auto_execute?: boolean;
  [key: string]: unknown;
};

interface KonsensusConfigRecord {
  quorum_percentage: number | string;
  passing_threshold: number | string;
  default_voting_duration_days: number;
  allow_anonymous_voting: boolean;
  auto_close_votes?: boolean;
  extra_settings?: KonsensusConfigExtraSettings;
  [key: string]: unknown;
}

/**
 * Normalise any backend response shape into "latest config or null".
 * Handles:
 *  - { results: [...] }
 *  - [...]
 *  - single object
 */
function extractLatestConfig(
  data: unknown,
): KonsensusConfigRecord | null {
  if (!data) return null;

  // Case 1: list response { results: [...] }
  if (
    typeof data === 'object' &&
    data !== null &&
    'results' in data &&
    Array.isArray((data as { results?: unknown }).results)
  ) {
    const arr = (data as { results: unknown[] }).results;
    if (arr.length > 0) return arr[0] as KonsensusConfigRecord;
  }

  // Case 2: bare list response [...]
  if (Array.isArray(data) && data.length > 0) {
    return data[0] as KonsensusConfigRecord;
  }

  // Case 3: single object
  if (typeof data === 'object' && data !== null) {
    return data as KonsensusConfigRecord;
  }

  return null;
}

export default function KonsensusSettingsPage(): JSX.Element {
  // State for live simulation feedback
  const [simulation, setSimulation] = useState({
    stiffness: 45,
    riskLabel: 'Balanced',
    riskColor: 'green',
    retroFailures: 2,
  });

  // Calculate simulation metrics based on form values
  const runSimulation = (quorum: number, threshold: number) => {
    // Higher quorum + higher threshold = harder to pass votes
    const score = Math.min(
      100,
      Math.round(quorum * 1.2 + threshold * 0.5),
    );

    let label = 'Fluid';
    let color = 'cyan';
    let fails = 0;

    if (score > 40) {
      label = 'Balanced';
      color = 'green';
      fails = 2;
    }
    if (score > 65) {
      label = 'Rigid';
      color = 'orange';
      fails = 5;
    }
    if (score > 85) {
      label = 'Gridlock Risk';
      color = 'red';
      fails = 12;
    }

    setSimulation({
      stiffness: score,
      riskLabel: label,
      riskColor: color,
      retroFailures: fails,
    });
  };

  const handleValuesChange = (_changedValues: unknown, values: unknown) => {
    const formValues =
      values && typeof values === 'object'
        ? (values as { quorum?: unknown; pass_threshold?: unknown })
        : {};

    if (
      formValues.quorum !== undefined ||
      formValues.pass_threshold !== undefined
    ) {
      const q = formValues.quorum ?? 15;
      const t = formValues.pass_threshold ?? 66;
      runSimulation(Number(q), Number(t));
    }
  };

  const title = 'Konsensus configuration';
  const subtitle = (
    <>
      Manage global consensus algorithms, voting thresholds, and
      governance parameters for the whole platform.
    </>
  );

  return (
    <KontrolPageShell
      title={title}
      subtitle={subtitle}
      scope="platform"
      metaTitle="Kontrol · Platform · Konsensus configuration"
      maxWidth={1200}
    >
      <Row gutter={24}>
        {/* LEFT COLUMN: The Configuration Form */}
        <Col xs={24} lg={16}>
          {/* Informational Banner */}
          <Alert
            message="Critical configuration"
            description="Changes made here affect the active voting logic for the entire platform immediately. Proceed with caution."
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <ProForm
            onValuesChange={handleValuesChange}
            // 1. FETCH INITIAL CONFIGURATION (GET)
            request={async () => {
              try {
                const res = await apiFetch(
                  '/api/admin/konsensus-config/',
                );
                if (!res.ok) return {};

                const data: unknown = await res.json();
                const latest = extractLatestConfig(data);

                if (latest) {
                  const quorumNum = Number(
                    latest.quorum_percentage,
                  );
                  const thresholdNum = Number(
                    latest.passing_threshold,
                  );

                  if (
                    Number.isFinite(quorumNum) &&
                    Number.isFinite(thresholdNum)
                  ) {
                    runSimulation(quorumNum, thresholdNum);
                  }

                  // Map Backend Model -> Frontend Form
                  return {
                    quorum: Number.isFinite(quorumNum)
                      ? quorumNum
                      : 15,
                    pass_threshold: Number.isFinite(
                      thresholdNum,
                    )
                      ? thresholdNum
                      : 66,
                    min_duration_days:
                      latest.default_voting_duration_days ?? 3,
                    anonymous_voting:
                      latest.allow_anonymous_voting ?? false,
                    // Map generic fields from extra_settings JSON
                    algorithm:
                      latest.extra_settings?.algorithm ??
                      'weighted',
                    allow_delegation:
                      latest.extra_settings
                        ?.allow_delegation ?? true,
                    network:
                      latest.extra_settings?.network ??
                      'local_ganache',
                    auto_execute:
                      latest.extra_settings?.auto_execute ??
                      false,
                  };
                }

                // Defaults if no DB record exists yet
                return {
                  quorum: 15,
                  pass_threshold: 66,
                  min_duration_days: 3,
                  algorithm: 'weighted',
                };
              } catch (error) {
                 
                console.error(
                  'Failed to load config',
                  error,
                );
                message.error(
                  'Could not load current configuration',
                );
                return {};
              }
            }}
            // 2. SAVE CONFIGURATION (POST)
            onFinish={async (values) => {
              try {
                message.loading(
                  'Applying consensus parameters...',
                  0.5,
                );

                const payload = {
                  quorum_percentage: values.quorum,
                  passing_threshold: values.pass_threshold,
                  default_voting_duration_days:
                    values.min_duration_days,
                  allow_anonymous_voting:
                    values.anonymous_voting,
                  auto_close_votes: true,
                  extra_settings: {
                    algorithm: values.algorithm,
                    allow_delegation:
                      values.allow_delegation,
                    network: values.network,
                    auto_execute:
                      values.auto_execute,
                  },
                };

                const res = await apiFetch(
                  '/api/admin/konsensus-config/',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type':
                        'application/json',
                    },
                    body: JSON.stringify(payload),
                  },
                );

                if (!res.ok)
                  throw new Error('Failed to save');

                message.success(
                  'Configuration updated successfully',
                );
                return true;
              } catch (error) {
                 
                console.error(error);
                message.error(
                  'Failed to save configuration',
                );
                return false;
              }
            }}
            submitter={{
              searchConfig: {
                submitText: 'Save configuration',
              },
              render: (_props, doms) => {
                return (
                  <ProCard
                    bordered
                    style={{ marginTop: 16 }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 16,
                      }}
                    >
                      {doms}
                    </div>
                  </ProCard>
                );
              },
            }}
          >
            <Space
              direction="vertical"
              size="large"
              style={{ width: '100%' }}
            >
              {/* Section 1: Voting Thresholds */}
              <ProCard
                title="Global thresholds"
                headerBordered
                collapsible
                defaultCollapsed={false}
                extra={
                  <SafetyCertificateOutlined
                    style={{ color: '#52c41a' }}
                  />
                }
              >
                <ProFormSlider
                  name="quorum"
                  label="Quorum requirement (%)"
                  width="lg"
                  min={0}
                  max={100}
                  step={1}
                  initialValue={15}
                  marks={{
                    0: '0%',
                    15: '15%',
                    50: '50%',
                    100: '100%',
                  }}
                  help="Minimum percentage of eligible voters required for a vote to be valid."
                />

                <ProFormSlider
                  name="pass_threshold"
                  label="Pass threshold (%)"
                  width="lg"
                  min={50}
                  max={100}
                  step={1}
                  initialValue={66}
                  marks={{
                    50: 'Majority',
                    66: 'Super',
                    100: 'Unanimous',
                  }}
                  help="Percentage of 'For' votes required to pass a proposal."
                />

                <ProFormDigit
                  name="min_duration_days"
                  label="Minimum voting duration (days)"
                  width="sm"
                  min={1}
                  max={30}
                  initialValue={3}
                  tooltip="Proposals cannot close before this duration elapses."
                />
              </ProCard>

              {/* Section 2: Algorithm & Logic */}
              <ProCard
                title="Consensus algorithm"
                headerBordered
                collapsible
                extra={
                  <ExperimentOutlined
                    style={{ color: '#1890ff' }}
                  />
                }
              >
                <ProFormSelect
                  name="algorithm"
                  label="Active calculation method"
                  width="md"
                  options={[
                    {
                      value: 'quadratic',
                      label:
                        'Quadratic voting (cost = votes²)',
                    },
                    {
                      value: 'linear',
                      label:
                        'Linear (1 person = 1 vote)',
                    },
                    {
                      value: 'weighted',
                      label:
                        'Weighted (reputation based)',
                    },
                    {
                      value: 'hybrid',
                      label:
                        'Hybrid (linear + reputation boost)',
                    },
                  ]}
                  initialValue="weighted"
                  tooltip="Quadratic voting helps protect minorities; weighted empowers experts."
                />

                <ProCard split="vertical" bordered>
                  <ProCard>
                    <ProFormSwitch
                      name="allow_delegation"
                      label="Allow vote delegation"
                      initialValue
                      tooltip="Users can delegate their voting power to trusted experts."
                    />
                    <Text
                      type="secondary"
                      style={{ fontSize: 12 }}
                    >
                      Liquid democracy features will be
                      enabled if checked.
                    </Text>
                  </ProCard>
                  <ProCard>
                    <ProFormSwitch
                      name="anonymous_voting"
                      label="Force anonymous voting"
                      initialValue={false}
                      tooltip="Hides voter identities on the blockchain/public record."
                    />
                    <Text
                      type="secondary"
                      style={{ fontSize: 12 }}
                    >
                      Prevents social pressure but limits
                      accountability.
                    </Text>
                  </ProCard>
                </ProCard>
              </ProCard>

              {/* Section 3: Smart Contract Sync */}
              <ProCard
                title="Blockchain synchronization"
                headerBordered
                collapsible
                defaultCollapsed
              >
                <ProFormSelect
                  name="network"
                  label="Target network"
                  width="md"
                  options={[
                    {
                      value: 'eth_mainnet',
                      label: 'Ethereum Mainnet',
                    },
                    {
                      value: 'polygon',
                      label: 'Polygon (Matic)',
                    },
                    {
                      value: 'local_ganache',
                      label: 'Local Ganache (dev)',
                    },
                  ]}
                  initialValue="local_ganache"
                />
                <ProFormSwitch
                  name="auto_execute"
                  label="Auto-execute passed proposals"
                  initialValue={false}
                  tooltip="If enabled, the system will attempt to call the smart contract immediately upon vote closure."
                />
              </ProCard>
            </Space>
          </ProForm>
        </Col>

        {/* RIGHT COLUMN: Live Simulation & Feedback */}
        <Col xs={24} lg={8}>
          <Space
            direction="vertical"
            size="large"
            style={{ width: '100%' }}
          >
            {/* Simulation Card */}
            <ProCard
              title={
                <Space>
                  <ThunderboltOutlined /> Live impact
                  analysis
                </Space>
              }
              headerBordered
              style={{ background: '#fafafa' }}
            >
              <Space
                direction="vertical"
                style={{ width: '100%' }}
                size="middle"
              >
                <div>
                  <Text type="secondary">
                    Governance stiffness
                  </Text>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <Statistic
                      value={simulation.stiffness}
                      suffix="/ 100"
                      valueStyle={{ fontSize: 24 }}
                    />
                    <Tag color={simulation.riskColor}>
                      {simulation.riskLabel}
                    </Tag>
                  </div>
                  <Progress
                    percent={simulation.stiffness}
                    showInfo={false}
                    strokeColor={
                      simulation.riskColor === 'red'
                        ? '#ff4d4f'
                        : simulation.riskColor === 'orange'
                        ? '#faad14'
                        : '#52c41a'
                    }
                  />
                </div>

                <Alert
                  message="Historical replay"
                  description={`Under these rules, ${simulation.retroFailures} passed proposals from last year would have failed.`}
                  type="info"
                  showIcon
                  icon={<HistoryOutlined />}
                />
              </Space>
            </ProCard>

            {/* Quick Tips */}
            <ProCard
              title="Governance tips"
              headerBordered
              collapsible
            >
              <List size="small" split={false}>
                <List.Item>
                  <Text type="secondary">
                    <WarningOutlined />{' '}
                    <strong>Quorum {'>'} 30%</strong> often
                    leads to gridlock in decentralized
                    communities.
                  </Text>
                </List.Item>
                <List.Item>
                  <Text type="secondary">
                    <SafetyCertificateOutlined />{' '}
                    <strong>Quadratic voting</strong> is best
                    used for resource allocation, not binary
                    decisions.
                  </Text>
                </List.Item>
              </List>
            </ProCard>
          </Space>
        </Col>
      </Row>
    </KontrolPageShell>
  );
}
