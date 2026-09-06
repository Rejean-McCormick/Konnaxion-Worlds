// FILE: frontend/app/konnected/certifications/exam-registration/page.tsx
﻿// app/konnected/certifications/exam-registration/page.tsx
﻿'use client';

import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  Result,
  Select,
  Space,
  Spin,
  Steps,
  Typography,
} from 'antd';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { apiFetch } from '@/api';
import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';
import PageContainer from '@/components/PageContainer';

const { Step } = Steps;
const { Option } = Select;
const { Paragraph, Text } = Typography;

/**
 * NOTE ABOUT ENDPOINTS
 *
 * These constants are aligned with the v14 backend spec:
 * - Certification paths:   /api/konnected/certifications/paths/
 * - Exam registrations:    /api/konnected/certifications/evaluations/
 * - Eligibility / sessions:
 *     /api/konnected/certifications/paths/:id/eligibility/
 *     /api/konnected/certifications/paths/:id/sessions/
 */
const EXAM_PATHS_ENDPOINT = '/api/konnected/certifications/paths/';
const EXAM_SESSIONS_ENDPOINT = (pathId: number | string) =>
  `/api/konnected/certifications/paths/${pathId}/sessions/`;
const EXAM_REGISTRATION_ENDPOINT = '/api/konnected/certifications/evaluations/';
const EXAM_ELIGIBILITY_ENDPOINT = (pathId: number | string) =>
  `/api/konnected/certifications/paths/${pathId}/eligibility/`;

/**
 * Domain types derived from CertifiKation & Knowledge specs + API schema.
 * Adjust the shapes to match your generated types from schema-endpoints.json.
 */
type CertificationPath = {
  id: number;
  name: string;
  description?: string;
  level?: string;
  tags?: string[];
  // Optional, may be provided by backend via aggregate / annotated fields
  already_passed?: boolean;
  cooldown_remaining_minutes?: number | null;
};

type ExamSession = {
  id: number;
  start_at: string; // ISO datetime
  end_at?: string | null;
  timezone?: string | null;
  modality?: string | null; // e.g. 'online', 'remote_proctored', 'in_person'
  location?: string | null;
  capacity?: number | null;
  seats_remaining?: number | null;
  registration_deadline?: string | null;
};

type ExamEligibility = {
  already_passed: boolean;
  cooldown_remaining_minutes: number;
};

interface ExamRegistrationFormValues {
  examPathId?: number;
  sessionId?: number;
  fullName?: string;
  agreeTerms?: boolean;
}

type StepKey = 0 | 1 | 2;


type ErrorBody = { detail?: string; message?: string };

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function parseErrorBody(value: unknown): ErrorBody {
  if (!value || typeof value !== 'object') return {};
  const body = value as Record<string, unknown>;
  return {
    detail: typeof body.detail === 'string' ? body.detail : undefined,
    message: typeof body.message === 'string' ? body.message : undefined,
  };
}


const steps: { key: StepKey; title: string; description?: string }[] = [
  { key: 0, title: 'Choose exam', description: 'Select the certification you want to attempt.' },
  {
    key: 1,
    title: 'Schedule & details',
    description: 'Pick an exam session and confirm your details.',
  },
  { key: 2, title: 'Confirm', description: 'Review and submit your registration.' },
];

const ExamRegistrationPageInner: React.FC = () => {
  const { message: messageApi } = AntdApp.useApp();
  const searchParams = useSearchParams();
  const [form] = Form.useForm<ExamRegistrationFormValues>();

  const [currentStep, setCurrentStep] = useState<StepKey>(0);
  const [paths, setPaths] = useState<CertificationPath[]>([]);
  const [pathsLoading, setPathsLoading] = useState<boolean>(false);
  const [pathsError, setPathsError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [eligibility, setEligibility] = useState<ExamEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [registrationCompleted, setRegistrationCompleted] = useState<boolean>(false);

  /**
   * Load available certification paths (exams) on mount.
   */
  useEffect(() => {
    const fetchPaths = async () => {
      setPathsLoading(true);
      setPathsError(null);
      try {
        const res = await apiFetch(EXAM_PATHS_ENDPOINT, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Failed to load certification programs (${res.status})`);
        }

        const data = (await res.json()) as CertificationPath[];
        setPaths(data);
      } catch (err: unknown) {
        const msg = errorMessage(err, 'Failed to load certification programs.');
        setPathsError(msg);
        messageApi.error(msg);
      } finally {
        setPathsLoading(false);
      }
    };

    void fetchPaths();
  }, [messageApi]);

  // If the user came from the programs page with ?pathId=..., preselect it.
  const initialPathIdFromQuery = searchParams.get('pathId');
  useEffect(() => {
    if (!initialPathIdFromQuery) return;
    const numericId = Number(initialPathIdFromQuery);
    if (Number.isNaN(numericId)) return;
    if (!paths.length) return;

    const exists = paths.some((p) => p.id === numericId);
    if (!exists) return;

    const current = form.getFieldValue('examPathId');
    if (!current) {
      form.setFieldsValue({ examPathId: numericId });
    }
  }, [initialPathIdFromQuery, paths, form]);

  const selectedPathId = Form.useWatch('examPathId', form);
  const selectedSessionId = Form.useWatch('sessionId', form);
  const fullName = Form.useWatch('fullName', form);

  const selectedPath = useMemo(
    () => paths.find((p) => p.id === selectedPathId),
    [paths, selectedPathId],
  );
  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId),
    [sessions, selectedSessionId],
  );

  /**
   * When the selected path changes, load sessions and eligibility.
   * Both are optional server-side features; we treat 404 as "not implemented".
   * Also clear any previously selected session to avoid stale selections.
   */
  useEffect(() => {
    if (!selectedPathId) {
      setSessions([]);
      setEligibility(null);
      form.setFieldsValue({ sessionId: undefined });
      return;
    }

    // Reset session selection whenever the path changes.
    form.setFieldsValue({ sessionId: undefined });

    const fetchEligibility = async () => {
      setEligibilityLoading(true);
      try {
        const res = await apiFetch(EXAM_ELIGIBILITY_ENDPOINT(selectedPathId), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (res.ok) {
          const data = (await res.json()) as ExamEligibility;
          setEligibility(data);
        } else if (res.status === 404) {
          // Eligibility endpoint not implemented yet; fall back to path fields.
          setEligibility(null);
        } else {
          throw new Error(`Failed to load eligibility (${res.status})`);
        }
      } catch {
        // Non-fatal: we can still continue with path-level info
        setEligibility(null);
      } finally {
        setEligibilityLoading(false);
      }
    };

    const fetchSessions = async () => {
      setSessionsLoading(true);
      setSessionsError(null);
      try {
        const res = await apiFetch(EXAM_SESSIONS_ENDPOINT(selectedPathId), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Failed to load exam sessions (${res.status})`);
        }

        const data = (await res.json()) as ExamSession[];
        setSessions(data);
      } catch (err: unknown) {
        const msg = errorMessage(err, 'Failed to load exam sessions.');
        setSessionsError(msg);
        messageApi.error(msg);
      } finally {
        setSessionsLoading(false);
      }
    };

    void fetchEligibility();
    void fetchSessions();
  }, [selectedPathId, messageApi, form]);

  const isPathAlreadyPassed =
    eligibility?.already_passed ?? (selectedPath?.already_passed ?? false);
  const cooldownMinutes =
    eligibility?.cooldown_remaining_minutes ?? (selectedPath?.cooldown_remaining_minutes ?? 0);
  const isUnderCooldown = !!cooldownMinutes && cooldownMinutes > 0;

  const cannotRegisterForPath = isPathAlreadyPassed || isUnderCooldown;

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['examPathId']);
      } else if (currentStep === 1) {
        await form.validateFields(['sessionId', 'fullName', 'agreeTerms']);
      }
      setCurrentStep((prev) => (prev + 1) as StepKey);
    } catch {
      // errors are displayed by antd Form
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => (prev - 1) as StepKey);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }

    const values = form.getFieldsValue() as Required<ExamRegistrationFormValues>;

    if (!values.examPathId || !values.sessionId) {
      messageApi.error('Please select an exam and session before submitting.');
      return;
    }

    // Payload aligned with EvaluationViewSet.create:
    //   { path_id, session_id, full_name, agreed_terms }
    const payload = {
      path_id: values.examPathId,
      session_id: values.sessionId,
      full_name: values.fullName,
      agreed_terms: values.agreeTerms === true,
    };

    setSubmitting(true);
    try {
      const res = await apiFetch(EXAM_REGISTRATION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 201) {
        setRegistrationCompleted(true);
        messageApi.success('Exam registration completed successfully.');
        return;
      }

      if (res.status === 409) {
        // Conflict: cooldown, already passed, capacity reached, etc.
        const errorBody = parseErrorBody(await res.json().catch(() => null));
        const detail: string =
          errorBody?.detail ||
          errorBody?.message ||
          'You cannot register for this exam at the moment.';

        messageApi.error(detail);
        return;
      }

      const errorBody = parseErrorBody(await res.json().catch(() => null));
      const detail: string =
        errorBody?.detail || errorBody?.message || 'Failed to complete registration.';
      messageApi.error(detail);
    } catch (err: unknown) {
      const msg = errorMessage(err, 'Unexpected error while registering for the exam.');
      messageApi.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderExamChoiceStep = () => {
    if (pathsLoading) {
      return (
        <div className="flex justify-center py-8">
          <Space>
            <Spin />
            <Text>Loading certification programs...</Text>
          </Space>
        </div>
      );
    }

    if (pathsError) {
      return (
        <Alert
          type="error"
          message="Unable to load certification programs"
          description={pathsError}
          showIcon
        />
      );
    }

    if (!paths.length) {
      return (
        <Empty
          description="No certification programs are available for registration at this time."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <Space direction="vertical" size="large" className="w-full">
        <Form.Item
          name="examPathId"
          label="Certification exam"
          rules={[{ required: true, message: 'Please select a certification exam.' }]}
        >
          <Select
            placeholder="Select an exam to register for"
            optionFilterProp="children"
            showSearch
          >
            {paths.map((path) => (
              <Option key={path.id} value={path.id}>
                {path.name}
                {path.level ? ` · ${path.level}` : ''}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedPath && (
          <Card title={selectedPath.name}>
            {selectedPath.description && <Paragraph>{selectedPath.description}</Paragraph>}
            {selectedPath.tags && selectedPath.tags.length > 0 && (
              <Paragraph>
                {selectedPath.tags.map((tag) => (
                  <Text key={tag} code className="mr-2">
                    {tag}
                  </Text>
                ))}
              </Paragraph>
            )}

            <Space direction="vertical" size="small" style={{ marginTop: 8 }}>
              {isPathAlreadyPassed && (
                <Alert
                  type="success"
                  message="You are already certified for this path."
                  description="Creating new attempts is not allowed because you already hold this certification."
                  showIcon
                />
              )}

              {isUnderCooldown && (
                <Alert
                  type="warning"
                  message="Retry cooldown active"
                  description={`You must wait ${cooldownMinutes} more minutes before registering another attempt for this exam.`}
                  showIcon
                />
              )}
            </Space>
          </Card>
        )}
      </Space>
    );
  };

  const renderScheduleStep = () => {
    if (!selectedPathId) {
      return (
        <Alert
          type="info"
          message="Select an exam first"
          description="Choose a certification exam in the previous step before picking a session."
          showIcon
        />
      );
    }

    return (
      <Space direction="vertical" size="large" className="w-full">
        {sessionsLoading && (
          <div className="flex justify-center py-4">
            <Space>
              <Spin />
              <Text>Loading exam sessions...</Text>
            </Space>
          </div>
        )}

        {sessionsError && (
          <Alert
            type="error"
            message="Unable to load exam sessions"
            description={sessionsError}
            showIcon
          />
        )}

        {!sessionsLoading && !sessionsError && sessions.length === 0 && (
          <Alert
            type="warning"
            message="No sessions available"
            description="There are currently no upcoming sessions for this exam. Please check back later or contact your administrator."
            showIcon
          />
        )}

        <Form.Item
          name="sessionId"
          label="Exam session"
          rules={[{ required: true, message: 'Please select an exam session.' }]}
        >
          <Select placeholder="Select a session" disabled={sessions.length === 0}>
            {sessions.map((session) => {
              const start = new Date(session.start_at);
              const end = session.end_at ? new Date(session.end_at) : null;
              const timeLabel = `${start.toLocaleString()}${
                end ? ` – ${end.toLocaleTimeString()}` : ''
              }`;
              const seats =
                typeof session.seats_remaining === 'number'
                  ? `${session.seats_remaining} seats left`
                  : 'Capacity info unavailable';

              const labelParts = [
                timeLabel,
                session.modality ? ` · ${session.modality}` : '',
                session.location ? ` · ${session.location}` : '',
                ` · ${seats}`,
              ];

              return (
                <Option key={session.id} value={session.id}>
                  {labelParts.join('')}
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item
          name="fullName"
          label="Full name"
          rules={[{ required: true, message: 'Please enter your full name.' }]}
        >
          <Input placeholder="This will be used on your exam record and certificate" />
        </Form.Item>

        <Form.Item
          name="agreeTerms"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error('You must agree to the exam policies to continue.'),
                    ),
            },
          ]}
        >
          <Checkbox>
            I confirm that I have read and agree to the exam terms, proctoring rules, and
            integrity policies.
          </Checkbox>
        </Form.Item>

        <Alert
          type="info"
          showIcon
          message="Before you register"
          description={
            <span>
              You will be able to view this exam and its status in your Exam Dashboard after
              registration. You must achieve at least <b>80%</b> to pass, and there is a{' '}
              <b>30-minute retry cooldown</b> if you fail an attempt.
            </span>
          }
        />
      </Space>
    );
  };

  const renderConfirmStep = () => {
    // Also guard on selectedSession to avoid crashes if sessions changed.
    if (!selectedPath || !selectedSessionId || !selectedSession) {
      return (
        <Alert
          type="info"
          message="Incomplete registration"
          description="Please select an exam and session in the previous steps before confirming."
          showIcon
        />
      );
    }

    const session = selectedSession;
    const start = new Date(session.start_at);
    const end = session.end_at ? new Date(session.end_at) : null;

    return (
      <Space direction="vertical" size="large" className="w-full">
        <Card title="Review your registration">
          <Space direction="vertical" size="middle">
            <div>
              <Text type="secondary">Certification exam</Text>
              <br />
              <Text strong>{selectedPath.name}</Text>
              {selectedPath.level && (
                <>
                  {' '}
                  <Text type="secondary">· {selectedPath.level}</Text>
                </>
              )}
            </div>

            <div>
              <Text type="secondary">Session</Text>
              <br />
              <Text strong>
                {start.toLocaleString()}
                {end && <> – {end.toLocaleTimeString()}</>}
              </Text>
              {session.modality && (
                <>
                  <br />
                  <Text type="secondary">Mode: {session.modality}</Text>
                </>
              )}
              {session.location && (
                <>
                  <br />
                  <Text type="secondary">Location: {session.location}</Text>
                </>
              )}
            </div>

            <div>
              <Text type="secondary">Name on record</Text>
              <br />
              <Text strong>{fullName || 'Not provided'}</Text>
            </div>
          </Space>
        </Card>

        <Alert
          type="warning"
          showIcon
          message="Please confirm"
          description="Once you submit, this session will be reserved for you, subject to capacity and eligibility checks. You may need to contact support to change or cancel your booking."
        />
      </Space>
    );
  };

  const renderStepContent = () => {
    if (registrationCompleted) {
      return null;
    }

    switch (currentStep) {
      case 0:
        return renderExamChoiceStep();
      case 1:
        return renderScheduleStep();
      case 2:
        return renderConfirmStep();
      default:
        return null;
    }
  };

  const renderFooterButtons = () => {
    if (registrationCompleted) {
      return null;
    }

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    const nextDisabled =
      currentStep === 0
        ? !selectedPathId || cannotRegisterForPath
        : currentStep === 1
        ? !selectedSessionId
        : false;

    return (
      <Space style={{ marginTop: 24 }}>
        {!isFirstStep && (
          <Button onClick={handlePrev} disabled={submitting}>
            Back
          </Button>
        )}
        {!isLastStep && (
          <Button
            type="primary"
            onClick={handleNext}
            disabled={nextDisabled || (currentStep === 0 && cannotRegisterForPath)}
          >
            Next
          </Button>
        )}
        {isLastStep && (
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={cannotRegisterForPath}
          >
            Submit registration
          </Button>
        )}
      </Space>
    );
  };

  if (registrationCompleted) {
    return (
      <KonnectedPageShell
        title="Exam registration completed"
        subtitle="Your exam attempt has been scheduled. You can review your registrations and outcomes in the Exam Dashboard."
      >
        <PageContainer title="Exam registration completed">
          <Result
            status="success"
            title="Your exam registration is confirmed"
            subTitle="You will receive a confirmation with details by email. You can also review this exam under your Exam Dashboard."
            extra={
              <Space>
                <Button type="primary" href="/konnected/certifications/exam-dashboard-results">
                  Go to Exam Dashboard
                </Button>
                <Button href="/konnected/certifications/exam-preparation">
                  View preparation resources
                </Button>
              </Space>
            }
          />
        </PageContainer>
      </KonnectedPageShell>
    );
  }

  return (
    <KonnectedPageShell
      title="Register for an exam"
      subtitle="Choose a certification exam, pick a session, and confirm your registration."
    >
      <PageContainer title="Register for an exam">
        <Card>
          <Space direction="vertical" size="large" className="w-full">
            <div>
              <Steps current={currentStep} responsive>
                {steps.map((step) => (
                  <Step key={step.key} title={step.title} description={step.description} />
                ))}
              </Steps>
            </div>

            {(eligibilityLoading || pathsLoading) && (
              <Alert
                type="info"
                showIcon
                message="Loading exam options"
                description="We are loading the available certification programs and checking your eligibility."
              />
            )}

            <Form<ExamRegistrationFormValues> layout="vertical" form={form}>
              {renderStepContent()}
            </Form>

            {renderFooterButtons()}
          </Space>
        </Card>
      </PageContainer>
    </KonnectedPageShell>
  );
};

const ExamRegistrationPage: React.FC = () => (
  <AntdApp>
    <ExamRegistrationPageInner />
  </AntdApp>
);

export default ExamRegistrationPage;
