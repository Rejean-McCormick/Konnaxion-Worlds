// FILE: frontend/app/konnected/certifications/exam-preparation/page.tsx
﻿// app/konnected/certifications/exam-preparation/page.tsx
'use client';

import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleTwoTone,
  ClockCircleOutlined,
  FileSearchOutlined,
  FlagOutlined,
  PlayCircleOutlined,
  WarningTwoTone,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Col,
  List,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Steps,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo } from 'react';

import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';
import { get } from '@/services/_request';

const { Text } = Typography;
const { Step } = Steps;

const CERT_PASS_PERCENT = 80; // from CertifiKation spec
const QUIZ_RETRY_COOLDOWN_MIN = 30; // from CertifiKation spec

/**
 * Endpoint helper for the preparation plan of a given CertificationPath.
 * This is designed to be consistent with the other CertifiKation endpoints
 * used by exam registration and exam dashboard.
 *
 * IMPORTANT:
 * - we use a *relative* URL WITHOUT a leading "/" so that axios baseURL
 *   (NEXT_PUBLIC_API_BASE or "/api") is correctly applied.
 * - On the wire this becomes: /api/konnected/certifications/paths/:pathId/preparation-plan/
 */
const EXAM_PREPARATION_ENDPOINT = (pathId: string | number) =>
  `konnected/certifications/paths/${pathId}/preparation-plan/`;

type PrepModuleType = 'content' | 'practice_quiz' | 'project' | 'checkpoint';

type PrepModuleStatus = 'not_started' | 'in_progress' | 'completed';

interface PrepModule {
  id: string;
  title: string;
  type: PrepModuleType;
  status: PrepModuleStatus;
  progressPercent: number;
  estimatedMinutes?: number | null;
  lastTouchedAt?: string | null;
  isCriticalWeakness?: boolean;
}

interface FocusArea {
  id: string;
  label: string;
  description?: string | null;
  recommendedResourcesCount?: number | null;
}

interface ExamPreparationPathInfo {
  id: number | string;
  name: string;
  description?: string | null;
}

interface ExamPreparationExamInfo {
  targetDate?: string | null;
  recommendedStudyHours?: number | null;
  lastScorePercent?: number | null;
  lastResult?: 'pass' | 'fail' | null;
  lastAttemptAt?: string | null;
  attemptsUsed?: number | null;
  attemptsAllowed?: number | null;
  isCooldownActive?: boolean;
  cooldownEndsAt?: string | null;
  passPercent?: number | null;
  retryCooldownMinutes?: number | null;
}

interface ExamPreparationResponse {
  path?: ExamPreparationPathInfo | null;
  exam?: ExamPreparationExamInfo | null;
  overallProgressPercent?: number | null;
  modules?: PrepModule[] | null;
  focusAreas?: FocusArea[] | null;
}

function computeOverallProgress(modules: PrepModule[] | undefined | null): number {
  if (!modules || modules.length === 0) {
    return 0;
  }
  const sum = modules.reduce((acc, m) => acc + (m.progressPercent ?? 0), 0);
  return Math.round(sum / modules.length);
}

function computeStepIndex(progress: number): number {
  if (progress >= 90) return 3;
  if (progress >= 60) return 2;
  if (progress >= 30) return 1;
  return 0;
}

function getReadinessBadge(
  progress: number,
  lastScore: number | null | undefined,
  passPercent: number,
): { status: 'ready' | 'almost' | 'not_ready'; label: string; color: 'green' | 'gold' | 'red' } {
  if (lastScore != null && lastScore >= passPercent) {
    return { status: 'ready', label: 'Ready based on last score', color: 'green' };
  }
  if (progress >= passPercent - 10) {
    return { status: 'almost', label: 'Almost ready – focus on weak areas', color: 'gold' };
  }
  return { status: 'not_ready', label: 'Not ready yet – keep studying', color: 'red' };
}

async function fetchExamPreparation(pathId: string): Promise<ExamPreparationResponse> {
  return get<ExamPreparationResponse>(EXAM_PREPARATION_ENDPOINT(pathId));
}

export default function ExamPreparationPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pathId = searchParams.get('pathId');
  const pathNameFromUrl = searchParams.get('pathName') || undefined;

  const { data, isLoading, error } = useQuery<ExamPreparationResponse>({
    queryKey: ['certs', 'exam-preparation', pathId],
    queryFn: () => fetchExamPreparation(pathId as string),
    enabled: !!pathId,
  });

  const modules: PrepModule[] = data?.modules ?? [];
  const focusAreas: FocusArea[] = data?.focusAreas ?? [];

  const overallProgress = useMemo(() => {
    return data?.overallProgressPercent != null
      ? Math.round(data.overallProgressPercent)
      : computeOverallProgress(modules);
  }, [data?.overallProgressPercent, modules]);

  const passPercent = data?.exam?.passPercent ?? CERT_PASS_PERCENT;
  const retryCooldownMinutes =
    data?.exam?.retryCooldownMinutes ?? QUIZ_RETRY_COOLDOWN_MIN;

  const lastScore = data?.exam?.lastScorePercent ?? null;
  const targetDate = data?.exam?.targetDate ?? null;
  const isCooldownActive = data?.exam?.isCooldownActive ?? false;
  const cooldownEndsAt = data?.exam?.cooldownEndsAt ?? null;

  const readiness = getReadinessBadge(overallProgress, lastScore, passPercent);
  const currentStepIndex = computeStepIndex(overallProgress);

  const recommendedStudyHours = data?.exam?.recommendedStudyHours ?? null;

  const effectivePathName =
    data?.path?.name ?? pathNameFromUrl ?? 'Exam Preparation';

  const handleGoToExamRegistration = () => {
    router.push('/konnected/certifications/exam-registration');
  };

  const handleGoToExamDashboard = () => {
    router.push('/konnected/certifications/exam-dashboard-results');
  };

  const handleStartPracticeExam = () => {
    // Future: plug into automated_evaluation "practice mode" endpoint / route
    router.push('/konnected/certifications/exam-dashboard-results');
  };

  const subtitle = (
    <>
      Get an at-a-glance view of your preparation for this certification path:
      study modules, focus areas, readiness vs. the {passPercent}% pass threshold,
      and next steps.
    </>
  );

  const renderModulesList = () => {
    if (!isLoading && modules.length === 0) {
      return (
        <Alert
          type="info"
          showIcon
          message="No study modules are defined yet."
          description="Once your CertificationPath is configured with learning units, they will appear here as a guided preparation plan."
        />
      );
    }

    if (isLoading) {
      return <Skeleton active paragraph={{ rows: 4 }} />;
    }

    return (
      <List
        itemLayout="horizontal"
        dataSource={modules}
        renderItem={(module) => (
          <List.Item
            actions={[
              <Button
                type="link"
                key="view"
                icon={<ArrowRightOutlined />}
                // Future: route to the actual learning unit detail, once available
                onClick={() => {
                   
                  console.log('Open module', module.id);
                }}
              >
                View module
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space size="small">
                  <span>{module.title}</span>
                  {module.status === 'completed' && (
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                  )}
                  {module.isCriticalWeakness && (
                    <Tag color="volcano" icon={<WarningTwoTone twoToneColor="#fa541c" />}>
                      Focus area
                    </Tag>
                  )}
                </Space>
              }
              description={
                <Space direction="vertical" size={2}>
                  <Space size="small" wrap>
                    <Tag>
                      {module.type === 'content'
                        ? 'Content'
                        : module.type === 'practice_quiz'
                        ? 'Practice quiz'
                        : module.type === 'project'
                        ? 'Project'
                        : 'Checkpoint'}
                    </Tag>
                    <Text type="secondary">
                      {module.status === 'completed'
                        ? 'Completed'
                        : module.status === 'in_progress'
                        ? `In progress – ${module.progressPercent}%`
                        : 'Not started yet'}
                    </Text>
                    {module.estimatedMinutes != null && (
                      <Text type="secondary">
                        • ~{module.estimatedMinutes} min
                      </Text>
                    )}
                  </Space>
                  <Progress
                    percent={Math.round(module.progressPercent)}
                    size="small"
                    status={module.status === 'completed' ? 'success' : 'active'}
                  />
                  {module.lastTouchedAt && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Last worked on:{' '}
                      {dayjs(module.lastTouchedAt).format('MMM D, YYYY HH:mm')}
                    </Text>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  const renderFocusAreas = () => {
    if (!isLoading && focusAreas.length === 0) {
      return (
        <Alert
          type="info"
          showIcon
          message="No specific focus areas identified yet."
          description="Once you complete some evaluations, the system will highlight weak domains to prioritize in your study time."
        />
      );
    }

    if (isLoading) {
      return <Skeleton active paragraph={{ rows: 3 }} />;
    }

    return (
      <List
        dataSource={focusAreas}
        renderItem={(area) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space>
                  <FlagOutlined />
                  <span>{area.label}</span>
                </Space>
              }
              description={
                <>
                  {area.description && (
                    <Text type="secondary" style={{ display: 'block' }}>
                      {area.description}
                    </Text>
                  )}
                  {area.recommendedResourcesCount != null && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {area.recommendedResourcesCount} recommended resources
                      {area.recommendedResourcesCount === 1 ? '' : 's'} in Knowledge
                    </Text>
                  )}
                </>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  const mainTabsItems: TabsProps['items'] = [
    {
      key: 'plan',
      label: 'Study plan & progress',
      children: (
        <Card variant="borderless">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong>Your overall preparation progress</Text>
              <Progress
                percent={overallProgress}
                status={overallProgress >= passPercent ? 'success' : 'active'}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Based on all study modules in this CertificationPath.
              </Text>
            </div>

            <div>
              <Text strong>Recommended sequence</Text>
              <Steps
                direction="vertical"
                size="small"
                current={currentStepIndex}
                style={{ marginTop: 8 }}
              >
                <Step
                  title="Study core content"
                  description="Work through required modules and lessons."
                />
                <Step
                  title="Complete practice activities"
                  description="Interactive exercises, quizzes, and projects."
                />
                <Step
                  title="Attempt a practice evaluation"
                  description={`Use automated_evaluation in "practice mode" to benchmark against ${passPercent}%.`}
                />
                <Step
                  title="Review feedback & focus areas"
                  description="Revisit weak domains before booking the official exam."
                />
              </Steps>
            </div>

            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleStartPracticeExam}
              disabled={isCooldownActive}
            >
              Start practice exam
            </Button>

            {isCooldownActive && cooldownEndsAt && (
              <Alert
                type="warning"
                showIcon
                message="Practice exam on cooldown"
                description={
                  <>
                    You recently attempted a practice evaluation. You can try again after{' '}
                    {dayjs(cooldownEndsAt).format('MMM D, YYYY HH:mm')} (cooldown{' '}
                    {retryCooldownMinutes} minutes).
                  </>
                }
              />
            )}
          </Space>
        </Card>
      ),
    },
    {
      key: 'focus',
      label: 'Focus areas',
      children: <Card variant="borderless">{renderFocusAreas()}</Card>,
    },
  ];

  const noPathSelected = !pathId && !data;

  return (
    <KonnectedPageShell
      title={effectivePathName}
      subtitle={subtitle}
      primaryAction={
        <Button
          type="primary"
          icon={<CalendarOutlined />}
          onClick={handleGoToExamRegistration}
        >
          Exam registration
        </Button>
      }
      secondaryActions={
        <Button
          icon={<FileSearchOutlined />}
          onClick={handleGoToExamDashboard}
        >
          Exam dashboard
        </Button>
      }
    >
      {noPathSelected && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="No certification path selected"
          description="Open this page from a specific Certification Program (e.g. from the Programs list) to see a tailored preparation plan."
        />
      )}

      {error && !noPathSelected && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Unable to load your exam preparation data"
          description="Please try again in a moment. If the problem persists, contact an administrator."
        />
      )}

      <Row gutter={[24, 24]}>
        {/* Left: modules + plan */}
        <Col xs={24} lg={16}>
          <Card
            title={
              data?.path?.name
                ? `Study modules for: ${data.path.name}`
                : 'Study modules'
            }
            extra={
              <Tag color={readiness.color} icon={<FlagOutlined />}>
                {readiness.label}
              </Tag>
            }
            style={{ marginBottom: 24 }}
          >
            {renderModulesList()}
          </Card>

          <Tabs
            defaultActiveKey="plan"
            items={mainTabsItems}
            destroyInactiveTabPane={false}
          />
        </Col>

        {/* Right: metrics + focus summary */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
              {isLoading && pathId ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
                <>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="Overall progress"
                        value={overallProgress}
                        suffix="%"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Pass threshold"
                        value={passPercent}
                        suffix="%"
                      />
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col span={12}>
                      <Statistic
                        title="Recommended study time"
                        value={
                          recommendedStudyHours != null
                            ? recommendedStudyHours
                            : '—'
                        }
                        suffix={recommendedStudyHours != null ? 'hrs' : undefined}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Retry cooldown"
                        value={retryCooldownMinutes}
                        suffix="min"
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                  </Row>

                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary" style={{ display: 'block' }}>
                      Pass/fail uses a frozen threshold ({passPercent}%), and
                      failed attempts are throttled by a{' '}
                      {retryCooldownMinutes}-minute cooldown.
                    </Text>
                  </div>
                </>
              )}
            </Card>

            <Card title="Upcoming exam">
              {isLoading && pathId ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : targetDate ? (
                <>
                  <Space direction="vertical" size="small">
                    <Space>
                      <CalendarOutlined />
                      <Text strong>
                        {dayjs(targetDate).format('MMMM D, YYYY')}
                      </Text>
                    </Space>
                    <Text type="secondary">
                      Make sure your preparation progress and practice scores are
                      comfortably above {passPercent}% before this date.
                    </Text>
                  </Space>
                  <Button
                    type="link"
                    icon={<CalendarOutlined />}
                    style={{ marginTop: 12, paddingLeft: 0 }}
                    onClick={handleGoToExamRegistration}
                  >
                    Adjust exam session
                  </Button>
                </>
              ) : (
                <>
                  <Alert
                    type="info"
                    showIcon
                    message="No exam date scheduled"
                    description="Book a session to lock in your target exam date and align your study plan."
                  />
                  <Button
                    type="primary"
                    icon={<CalendarOutlined />}
                    style={{ marginTop: 12 }}
                    onClick={handleGoToExamRegistration}
                  >
                    Schedule exam
                  </Button>
                </>
              )}
            </Card>

            <Card title="Focus summary">
              {isLoading && pathId ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
                <>
                  {focusAreas.length > 0 ? (
                    <>
                      <Text>
                        You have {focusAreas.length} identified focus{' '}
                        {focusAreas.length === 1 ? 'area' : 'areas'} based on your
                        evaluations.
                      </Text>
                      <div style={{ marginTop: 12 }}>{renderFocusAreas()}</div>
                      <Button
                        type="link"
                        style={{ marginTop: 8, paddingLeft: 0 }}
                        onClick={handleGoToExamDashboard}
                      >
                        View detailed breakdown in Exam Dashboard
                      </Button>
                    </>
                  ) : (
                    <Text type="secondary">
                      Once you complete your first practice or official exam,
                      we will highlight weak domains and recommended topics
                      here.
                    </Text>
                  )}
                </>
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </KonnectedPageShell>
  );
}
