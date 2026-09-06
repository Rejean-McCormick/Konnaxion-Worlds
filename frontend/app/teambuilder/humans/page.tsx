// frontend/app/teambuilder/humans/page.tsx
'use client';

import {
  AimOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  GlobalOutlined,
  ScheduleOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  List,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import React from 'react';

import TeamBuilderPageShell from '@/components/teambuilder/TeamBuilderPageShell';

const { Paragraph, Text } = Typography;

export default function HumansOverviewPage(): JSX.Element {
  // For now, static placeholder metrics. Wire to real data later.
  const totalPeople = 128;
  const withLanguage = 104;
  const withSchedule = 92;
  const withGeo = 88;

  const languageCoverage = Math.round((withLanguage / totalPeople) * 100);
  const scheduleCoverage = Math.round((withSchedule / totalPeople) * 100);
  const geoCoverage = Math.round((withGeo / totalPeople) * 100);

  const missingCritical = totalPeople - Math.min(withLanguage, withSchedule, withGeo);

  const recentChanges = [
    {
      id: 1,
      title: 'Updated languages for 12 people',
      description: 'Added FR/EN bilingual profile for Paris-based cohort.',
      type: 'language',
      ts: '2 hours ago',
    },
    {
      id: 2,
      title: 'New interpersonal conflict pair',
      description: 'Flagged conflict between A. Smith and J. Doe (Project Alpha).',
      type: 'conflict',
      ts: 'Yesterday',
    },
    {
      id: 3,
      title: 'Refined working hours',
      description: 'Adjusted schedules for APAC team to avoid 3 a.m. meetings.',
      type: 'schedule',
      ts: '2 days ago',
    },
    {
      id: 4,
      title: 'Geo boundaries for EU-only projects',
      description: 'Marked 34 people as “EU only” for data residency rules.',
      type: 'geo',
      ts: '3 days ago',
    },
  ];

  const renderStatusTag = () => {
    if (missingCritical === 0) {
      return (
        <Tag color="success" icon={<TeamOutlined />}>
          All profiles ready
        </Tag>
      );
    }

    if (missingCritical < totalPeople * 0.1) {
      return (
        <Tag color="processing" icon={<TeamOutlined />}>
          Mostly ready
        </Tag>
      );
    }

    return (
      <Tag color="warning" icon={<WarningOutlined />}>
        Needs attention
      </Tag>
    );
  };

  const secondaryActions = (
    <Space>
      <Button type="default" href="/teambuilder">
        Back to sessions
      </Button>
    </Space>
  );

  return (
    <TeamBuilderPageShell
      title="Humans · Constraints overview"
      subtitle={
        <Paragraph type="secondary">
          Configure how people can be grouped into teams: languages, geography, interpersonal
          conflicts, and schedules. These constraints are used by the engine to decide who can
          safely be matched together.
        </Paragraph>
      }
      metaTitle="Team Builder · Humans"
      sectionLabel="Humans"
      secondaryActions={secondaryActions}
      maxWidth={1200}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Top metrics summary */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card>
              <Space
                direction="vertical"
                size="small"
                style={{ width: '100%' }}
              >
                <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text strong>Population readiness</Text>
                  <Badge status={missingCritical === 0 ? 'success' : 'warning'} />
                </Space>
                <Statistic
                  title="People in scope"
                  value={totalPeople}
                  prefix={<TeamOutlined />}
                />
                <Space size="small" direction="vertical">
                  <Text type="secondary">
                    {withLanguage} with language profile · {withSchedule} with schedule ·{' '}
                    {withGeo} with geo limits
                  </Text>
                  {renderStatusTag()}
                </Space>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <Space
                direction="vertical"
                size="small"
                style={{ width: '100%' }}
              >
                <Space align="center">
                  <GlobalOutlined />
                  <Text strong>Language & geography</Text>
                </Space>
                <Statistic
                  title="Language coverage"
                  value={languageCoverage}
                  suffix="%"
                />
                <Progress
                  percent={languageCoverage}
                  size="small"
                  status={languageCoverage > 80 ? 'active' : 'exception'}
                />
                <Statistic
                  title="Geo coverage"
                  value={geoCoverage}
                  suffix="%"
                />
                <Progress
                  percent={geoCoverage}
                  size="small"
                  status={geoCoverage > 80 ? 'active' : 'exception'}
                />
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <Space
                direction="vertical"
                size="small"
                style={{ width: '100%' }}
              >
                <Space align="center">
                  <ScheduleOutlined />
                  <Text strong>Schedules & conflicts</Text>
                </Space>
                <Statistic
                  title="Schedule coverage"
                  value={scheduleCoverage}
                  suffix="%"
                />
                <Progress
                  percent={scheduleCoverage}
                  size="small"
                  status={scheduleCoverage > 80 ? 'active' : 'exception'}
                />
                <Space size="small">
                  <Tag color="default">Conflict pairs</Tag>
                  <Text type="secondary">Configured where needed.</Text>
                </Space>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* How this works */}
        <Alert
          type="info"
          showIcon
          message="How human constraints are applied"
          description={
            <Space direction="vertical" size={4}>
              <Text>
                These settings define <strong>who can be grouped together</strong> in the team
                builder. The engine will:
              </Text>
              <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                <li>
                  Respect <strong>language compatibility</strong> when forming elite or learning
                  teams.
                </li>
                <li>
                  Enforce <strong>geography / jurisdiction limits</strong> for sensitive projects.
                </li>
                <li>
                  Avoid <strong>hard conflict pairs</strong> in all modes.
                </li>
                <li>
                  Match <strong>overlapping schedules</strong> so teams can actually meet.
                </li>
              </ul>
            </Space>
          }
        />

        <Divider />

        {/* Sub-module navigation */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              title={
                <Space>
                  <GlobalOutlined />
                  <span>Languages & communication</span>
                </Space>
              }
              extra={
                <Button type="link" href="/teambuilder/humans/language">
                  Open
                </Button>
              }
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Define which languages each person can work in, and mark preferred communication
                  modes (async, synchronous, written, spoken).
                </Paragraph>
                <Space wrap>
                  <Tag>Language profiles</Tag>
                  <Tag>Preferred channels</Tag>
                  <Tag>Multi-lingual support</Tag>
                </Space>
                <Space split={<Divider type="vertical" />} wrap>
                  <Text type="secondary">
                    <Badge status={languageCoverage > 80 ? 'success' : 'warning'} />{' '}
                    {languageCoverage}% coverage
                  </Text>
                  <Text type="secondary">{withLanguage} / {totalPeople} people configured</Text>
                </Space>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title={
                <Space>
                  <EnvironmentOutlined />
                  <span>Geography & legal limits</span>
                </Space>
              }
              extra={
                <Button type="link" href="/teambuilder/humans/geo">
                  Open
                </Button>
              }
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Specify where each person can legally operate (regions, time zones, data
                  residency constraints) and which projects require strict geo limits.
                </Paragraph>
                <Space wrap>
                  <Tag>Time zones</Tag>
                  <Tag>Regions</Tag>
                  <Tag>Jurisdictions</Tag>
                  <Tag>Data residency</Tag>
                </Space>
                <Space split={<Divider type="vertical" />} wrap>
                  <Text type="secondary">
                    <Badge status={geoCoverage > 80 ? 'success' : 'warning'} />{' '}
                    {geoCoverage}% coverage
                  </Text>
                  <Text type="secondary">{withGeo} / {totalPeople} people with geo data</Text>
                </Space>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title={
                <Space>
                  <ScheduleOutlined />
                  <span>Schedules & availability</span>
                </Space>
              }
              extra={
                <Button type="link" href="/teambuilder/humans/schedules">
                  Open
                </Button>
              }
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Capture working hours, blackout periods, and preferred meeting windows so teams
                  share viable overlapping time.
                </Paragraph>
                <Space wrap>
                  <Tag>Working hours</Tag>
                  <Tag>Blackout periods</Tag>
                  <Tag>Preferred slots</Tag>
                </Space>
                <Space split={<Divider type="vertical" />} wrap>
                  <Text type="secondary">
                    <Badge status={scheduleCoverage > 80 ? 'success' : 'warning'} />{' '}
                    {scheduleCoverage}% coverage
                  </Text>
                  <Text type="secondary">{withSchedule} / {totalPeople} people with schedule</Text>
                </Space>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title={
                <Space>
                  <WarningOutlined />
                  <span>Interpersonal conflicts</span>
                </Space>
              }
              extra={
                <Button type="link" href="/teambuilder/humans/conflicts">
                  Open
                </Button>
              }
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Flag hard “do not pair” conflicts and higher-risk combinations so the builder
                  avoids unsafe team compositions by default.
                </Paragraph>
                <Space wrap>
                  <Tag color="red">Do-not-pair</Tag>
                  <Tag>Risky combinations</Tag>
                  <Tag>Leader safeguards</Tag>
                </Space>
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginTop: 4 }}
                  message="Conflicts are treated as hard constraints."
                  description="When set, these pairs will not appear in automatically generated teams, regardless of mode."
                />
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Recent activity / audit trail */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Card
              title={
                <Space>
                  <FlagOutlined />
                  <span>Recent configuration changes</span>
                </Space>
              }
            >
              <List
                itemLayout="horizontal"
                dataSource={recentChanges}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Badge
                          status={
                            item.type === 'conflict'
                              ? 'error'
                              : item.type === 'schedule'
                              ? 'processing'
                              : 'success'
                          }
                        />
                      }
                      title={
                        <Space>
                          <Text strong>{item.title}</Text>
                          <Tag
                            color={
                              item.type === 'language'
                                ? 'blue'
                                : item.type === 'geo'
                                ? 'purple'
                                : item.type === 'schedule'
                                ? 'gold'
                                : 'red'
                            }
                          >
                            {item.type}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text>{item.description}</Text>
                          <Text type="secondary">{item.ts}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              title={
                <Space>
                  <AimOutlined />
                  <span>Next recommended actions</span>
                </Space>
              }
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Button type="primary" block href="/teambuilder/humans/language">
                  Complete language profiles for missing people
                </Button>
                <Button block href="/teambuilder/humans/schedules">
                  Review schedules for night-heavy patterns
                </Button>
                <Button block href="/teambuilder/humans/conflicts">
                  Audit conflict list for outdated entries
                </Button>
                <Divider />
                <Text type="secondary">
                  Once coverage is above ~90% on all axes, elite and learning team modes can rely
                  almost entirely on these constraints.
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </TeamBuilderPageShell>
  );
}
