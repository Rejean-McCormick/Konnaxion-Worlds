// frontend/app/teambuilder/humans/modes/page.tsx
'use client';

import {
  ExperimentOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Divider,
  Form,
  InputNumber,
  message,
  Progress,
  Row,
  Slider,
  Space,
  Statistic,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React, { useState } from 'react';

import TeamBuilderPageShell from '@/components/teambuilder/TeamBuilderPageShell';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

type ModeKey = 'elite' | 'balanced' | 'learning' | 'average_only' | 'rehab';

type RiskLevel = 'Low risk' | 'Medium risk' | 'High risk';

type ModeWeights = {
  skillFit: number;
  performance: number;
  learning: number;
  collaboration: number;
  difficultTolerance: number;
};

type ModeConstraints = {
  maxDifficultMembers: number;
  minSeniorsPerTeam: number;
};

type ModeConfig = {
  key: ModeKey;
  label: string;
  shortLabel: string;
  description: string;
  riskLevel: RiskLevel;
  riskColor: 'green' | 'blue' | 'gold' | 'red';
  weights: ModeWeights;
  constraints: ModeConstraints;
};

type ModeConfigs = Record<ModeKey, ModeConfig>;

function createDefaultModes(): ModeConfigs {
  return {
    elite: {
      key: 'elite',
      label: 'Elite / critical delivery',
      shortLabel: 'Elite',
      description:
        'Maximise performance and reliability for urgent, high-stakes delivery. Very strict on difficult members.',
      riskLevel: 'High risk',
      riskColor: 'red',
      weights: {
        skillFit: 90,
        performance: 90,
        learning: 20,
        collaboration: 70,
        difficultTolerance: 10,
      },
      constraints: {
        maxDifficultMembers: 0,
        minSeniorsPerTeam: 2,
      },
    },
    balanced: {
      key: 'balanced',
      label: 'Balanced performance & learning',
      shortLabel: 'Balanced',
      description:
        'Blend solid performance with some learning opportunity. Good default for important but non-critical work.',
      riskLevel: 'Medium risk',
      riskColor: 'blue',
      weights: {
        skillFit: 75,
        performance: 75,
        learning: 50,
        collaboration: 75,
        difficultTolerance: 30,
      },
      constraints: {
        maxDifficultMembers: 1,
        minSeniorsPerTeam: 1,
      },
    },
    learning: {
      key: 'learning',
      label: 'Learning-heavy / developmental',
      shortLabel: 'Learning',
      description:
        'Optimise for growth and experimentation. Favors juniors and mentoring, with softer constraints.',
      riskLevel: 'Low risk',
      riskColor: 'green',
      weights: {
        skillFit: 55,
        performance: 50,
        learning: 90,
        collaboration: 80,
        difficultTolerance: 40,
      },
      constraints: {
        maxDifficultMembers: 2,
        minSeniorsPerTeam: 1,
      },
    },
    average_only: {
      key: 'average_only',
      label: 'Average-only / stability test',
      shortLabel: 'Average-only',
      description:
        'Filter out extremes and test whether a “normal” group can perform reliably. Strong emphasis on structure.',
      riskLevel: 'Low risk',
      riskColor: 'gold',
      weights: {
        skillFit: 65,
        performance: 60,
        learning: 40,
        collaboration: 70,
        difficultTolerance: 20,
      },
      constraints: {
        maxDifficultMembers: 0,
        minSeniorsPerTeam: 0,
      },
    },
    rehab: {
      key: 'rehab',
      label: 'High-risk / rehabilitation teams',
      shortLabel: 'Rehab',
      description:
        'Deliberately include some difficult members around a strong leader and stabilisers. Use carefully.',
      riskLevel: 'High risk',
      riskColor: 'red',
      weights: {
        skillFit: 60,
        performance: 55,
        learning: 70,
        collaboration: 65,
        difficultTolerance: 70,
      },
      constraints: {
        maxDifficultMembers: 2,
        minSeniorsPerTeam: 1,
      },
    },
  };
}

function computeStrictnessScore(mode: ModeConfig): number {
  const { skillFit, performance, difficultTolerance } = mode.weights;
  const invertedTolerance = 100 - difficultTolerance;
  const avg = (skillFit + performance + invertedTolerance) / 3;
  return Math.round(avg);
}

export default function TeamModesPage(): JSX.Element {
  const [modes, setModes] = useState<ModeConfigs>(() => createDefaultModes());
  const [activeMode, setActiveMode] = useState<ModeKey>('elite');
  const [saving, setSaving] = useState(false);

  const handleWeightChange =
    (modeKey: ModeKey, field: keyof ModeWeights) =>
    (value: number | [number, number]) => {
      const numericValue = Array.isArray(value) ? value[0] ?? 0 : value ?? 0;
      setModes(prev => ({
        ...prev,
        [modeKey]: {
          ...prev[modeKey],
          weights: {
            ...prev[modeKey].weights,
            [field]: numericValue,
          },
        },
      }));
    };

  const handleConstraintChange =
    (modeKey: ModeKey, field: keyof ModeConstraints) =>
    (value: number | null) => {
      setModes(prev => ({
        ...prev,
        [modeKey]: {
          ...prev[modeKey],
          constraints: {
            ...prev[modeKey].constraints,
            [field]: value ?? 0,
          },
        },
      }));
    };

  const handleResetDefaults = () => {
    setModes(createDefaultModes());
    message.success('Team modes reset to defaults.');
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // TODO: wire to backend service when available
       
      console.log('Saving team modes (stub):', modes);
      message.success('Team modes saved (local stub).');
    } catch (err) {
       
      console.error(err);
      message.error('Failed to save modes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateMode = () => {
    const current = modes[activeMode];
    message.info(
      `Duplicate "${current.shortLabel}" is not implemented yet (stub button).`,
    );
  };

  const renderModeTab = (modeKey: ModeKey) => {
    const mode = modes[modeKey];
    const strictness = computeStrictnessScore(mode);

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          type={mode.riskLevel === 'High risk' ? 'warning' : 'info'}
          showIcon
          message={
            <Space align="center">
              <SafetyCertificateOutlined />
              <span>{mode.label}</span>
              <Tag color={mode.riskColor}>{mode.riskLevel}</Tag>
            </Space>
          }
          description={
            <Paragraph type="secondary" style={{ marginTop: 8 }}>
              {mode.description}
            </Paragraph>
          }
        />

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Card
              size="small"
              title="Scoring weights"
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  0 = ignored · 100 = dominant
                </Text>
              }
            >
              <Form layout="vertical">
                <Form.Item label="Skill fit">
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: 80, marginRight: 16 }}
                    value={mode.weights.skillFit}
                    onChange={v =>
                      handleWeightChange(modeKey, 'skillFit')(v ?? 0)
                    }
                  />
                  <span style={{ paddingRight: 16 }} />
                  <Row>
                    <Col span={24}>
                      <Slider
                        min={0}
                        max={100}
                        value={mode.weights.skillFit}
                        onChange={handleWeightChange(modeKey, 'skillFit')}
                      />
                    </Col>
                  </Row>
                </Form.Item>

                <Form.Item label="Past performance & reliability">
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: 80, marginRight: 16 }}
                    value={mode.weights.performance}
                    onChange={v =>
                      handleWeightChange(modeKey, 'performance')(v ?? 0)
                    }
                  />
                  <span style={{ paddingRight: 16 }} />
                  <Row>
                    <Col span={24}>
                      <Slider
                        min={0}
                        max={100}
                        value={mode.weights.performance}
                        onChange={handleWeightChange(modeKey, 'performance')}
                      />
                    </Col>
                  </Row>
                </Form.Item>

                <Form.Item label="Learning opportunity">
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: 80, marginRight: 16 }}
                    value={mode.weights.learning}
                    onChange={v =>
                      handleWeightChange(modeKey, 'learning')(v ?? 0)
                    }
                  />
                  <span style={{ paddingRight: 16 }} />
                  <Row>
                    <Col span={24}>
                      <Slider
                        min={0}
                        max={100}
                        value={mode.weights.learning}
                        onChange={handleWeightChange(modeKey, 'learning')}
                      />
                    </Col>
                  </Row>
                </Form.Item>

                <Form.Item label="Past collaboration history">
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: 80, marginRight: 16 }}
                    value={mode.weights.collaboration}
                    onChange={v =>
                      handleWeightChange(modeKey, 'collaboration')(v ?? 0)
                    }
                  />
                  <span style={{ paddingRight: 16 }} />
                  <Row>
                    <Col span={24}>
                      <Slider
                        min={0}
                        max={100}
                        value={mode.weights.collaboration}
                        onChange={handleWeightChange(
                          modeKey,
                          'collaboration',
                        )}
                      />
                    </Col>
                  </Row>
                </Form.Item>

                <Form.Item label="Tolerance for difficult members">
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: 80, marginRight: 16 }}
                    value={mode.weights.difficultTolerance}
                    onChange={v =>
                      handleWeightChange(modeKey, 'difficultTolerance')(
                        v ?? 0,
                      )
                    }
                  />
                  <span style={{ paddingRight: 16 }} />
                  <Row>
                    <Col span={24}>
                      <Slider
                        min={0}
                        max={100}
                        value={mode.weights.difficultTolerance}
                        onChange={handleWeightChange(
                          modeKey,
                          'difficultTolerance',
                        )}
                      />
                    </Col>
                  </Row>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Higher values allow more “difficult” members in the same
                    team before penalising the configuration.
                  </Text>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Space
              direction="vertical"
              size="middle"
              style={{ width: '100%' }}
            >
              <Card size="small">
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: '100%' }}
                >
                  <Space align="center">
                    <ThunderboltOutlined style={{ color: '#faad14' }} />
                    <Text strong>Strictness overview</Text>
                    <Tag color={mode.riskColor}>{mode.riskLevel}</Tag>
                  </Space>

                  <Divider style={{ margin: '8px 0' }} />

                  <Row gutter={16} align="middle">
                    <Col span={12}>
                      <Progress type="circle" percent={strictness} width={88} />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Strictness score"
                        value={strictness}
                        suffix="/ 100"
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Based on skill fit, performance, and tolerance for
                        difficult members.
                      </Text>
                    </Col>
                  </Row>
                </Space>
              </Card>

              <Card size="small" title="Summary">
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: '100%' }}
                >
                  <Row>
                    <Col span={12}>
                      <Text type="secondary">Skill fit weight</Text>
                      <div>{mode.weights.skillFit}/100</div>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Performance weight</Text>
                      <div>{mode.weights.performance}/100</div>
                    </Col>
                  </Row>
                  <Row style={{ marginTop: 8 }}>
                    <Col span={12}>
                      <Text type="secondary">Learning emphasis</Text>
                      <div>{mode.weights.learning}/100</div>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">Collaboration emphasis</Text>
                      <div>{mode.weights.collaboration}/100</div>
                    </Col>
                  </Row>
                </Space>
              </Card>

              <Collapse ghost>
                <Panel header="Advanced constraints" key="advanced">
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: '100%' }}
                  >
                    <Form layout="vertical">
                      <Form.Item label="Max difficult members per team">
                        <InputNumber
                          min={0}
                          max={10}
                          style={{ width: '100%' }}
                          value={mode.constraints.maxDifficultMembers}
                          onChange={handleConstraintChange(
                            modeKey,
                            'maxDifficultMembers',
                          )}
                        />
                      </Form.Item>

                      <Form.Item label="Minimum seniors per team">
                        <InputNumber
                          min={0}
                          max={10}
                          style={{ width: '100%' }}
                          value={mode.constraints.minSeniorsPerTeam}
                          onChange={handleConstraintChange(
                            modeKey,
                            'minSeniorsPerTeam',
                          )}
                        />
                      </Form.Item>
                    </Form>

                    <Alert
                      type="info"
                      showIcon
                      message="Guidance"
                      description={
                        <Text type="secondary">
                          Use these constraints to bound extreme proposals from
                          the algorithm, especially in Elite and Rehab modes.
                        </Text>
                      }
                    />
                  </Space>
                </Panel>
              </Collapse>
            </Space>
          </Col>
        </Row>
      </Space>
    );
  };

  const tabItems = (Object.keys(modes) as ModeKey[]).map(modeKey => ({
    key: modeKey,
    label: modes[modeKey].shortLabel,
    children: renderModeTab(modeKey),
  }));

  const primaryAction = (
    <Space>
      <Button onClick={handleDuplicateMode} icon={<ExperimentOutlined />}>
        Duplicate mode
      </Button>
      <Button onClick={handleResetDefaults}>Reset defaults</Button>
      <Button
        type="primary"
        onClick={handleSaveAll}
        loading={saving}
        icon={<SafetyCertificateOutlined />}
      >
        Save all modes
      </Button>
    </Space>
  );

  return (
    <TeamBuilderPageShell
      title="Team modes & presets"
      subtitle="Configure how the matching engine balances performance, learning, collaboration, and risk for different team contexts."
      sectionLabel="Humans"
      maxWidth={1200}
      primaryAction={primaryAction}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="Team modes control how the engine weighs signals"
          description={
            <Text type="secondary">
              Each mode corresponds to a different operating context (elite,
              balanced, learning, average-only, rehabilitation). Adjust the
              weights and constraints here once, and the engine will reuse these
              presets for all future sessions.
            </Text>
          }
        />

        <Card>
          <Tabs
            activeKey={activeMode}
            items={tabItems}
            onChange={key => setActiveMode(key as ModeKey)}
          />
        </Card>
      </Space>
    </TeamBuilderPageShell>
  );
}
