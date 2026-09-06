// frontend/app/teambuilder/problems/create/page.tsx
'use client';

import {
  ArrowLeftOutlined,
  CheckOutlined,
  DeploymentUnitOutlined,
  ExclamationCircleOutlined,
  ProfileOutlined,
  SaveOutlined,
  ScheduleOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Steps,
  Switch,
  Tag,
  TreeSelect,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import TeamBuilderPageShell from '@/components/teambuilder/TeamBuilderPageShell';
import { teambuilderService } from '@/services/teambuilder';
import type { ICreateProblemRequest } from '@/services/teambuilder/types';

const { TextArea } = Input;
const { Paragraph, Text } = Typography;

type ProblemFormValues = {
  title: string;
  statement: string;
  context?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  typicalModes: string[];
  taxonomyCodes: string[];
  requiredSkills: string[];
  minTeamSize?: number;
  maxTeamSize?: number;
  expectedDurationDays?: number;
  allowRehabMode: boolean;
  allowLearningMode: boolean;
};

const UNESCO_TREE_DATA = [
  {
    title: 'Natural sciences',
    value: 'ns',
    key: 'ns',
    children: [
      {
        title: 'Physics',
        value: 'ns.physics',
        key: 'ns.physics',
      },
      {
        title: 'Chemistry',
        value: 'ns.chemistry',
        key: 'ns.chemistry',
      },
      {
        title: 'Biology',
        value: 'ns.biology',
        key: 'ns.biology',
      },
    ],
  },
  {
    title: 'Engineering & technology',
    value: 'eng',
    key: 'eng',
    children: [
      {
        title: 'Computer science',
        value: 'eng.cs',
        key: 'eng.cs',
      },
      {
        title: 'Electrical engineering',
        value: 'eng.ee',
        key: 'eng.ee',
      },
    ],
  },
  {
    title: 'Medical & health sciences',
    value: 'med',
    key: 'med',
  },
  {
    title: 'Social sciences',
    value: 'soc',
    key: 'soc',
  },
];

const MODE_OPTIONS = [
  { label: 'Elite / critical', value: 'ELITE_CRITICAL' },
  { label: 'Balanced', value: 'BALANCED' },
  { label: 'Learning-heavy', value: 'LEARNING' },
  { label: 'Average-only', value: 'AVERAGE_ONLY' },
  { label: 'Rehab / high-risk', value: 'REHAB_HIGH_RISK' },
];

const RISK_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

export default function CreateProblemPage(): JSX.Element {
  const [form] = Form.useForm<ProblemFormValues>();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [submitting, setSubmitting] = useState<'draft' | 'publish' | null>(
    null,
  );

  const persistProblem = async (
    values: ProblemFormValues,
    submitMode: 'draft' | 'publish',
  ) => {
    const notes: string[] = [];

    if (values.context?.trim()) {
      notes.push(values.context.trim());
    }
    if (values.expectedDurationDays != null) {
      notes.push(`Expected duration: ${values.expectedDurationDays} day(s).`);
    }
    if (values.allowRehabMode) {
      notes.push('Rehab mode explicitly allowed.');
    }
    if (values.allowLearningMode) {
      notes.push('Learning mode explicitly allowed.');
    }

    const payload: ICreateProblemRequest = {
      name: values.title.trim(),
      description: values.statement.trim(),
      status: submitMode === 'publish' ? 'ACTIVE' : 'DRAFT',
      risk_level:
        values.riskLevel.toUpperCase() as ICreateProblemRequest['risk_level'],
      min_team_size: values.minTeamSize ?? null,
      max_team_size: values.maxTeamSize ?? null,
      unesco_codes: values.taxonomyCodes ?? [],
      categories: values.requiredSkills ?? [],
      recommended_modes: values.typicalModes ?? [],
      facilitator_notes: notes.join('\n'),
    };

    const created = await teambuilderService.createProblem(payload);
    const modeLabel = submitMode === 'publish' ? 'published' : 'saved as draft';

    message.success(`Problem ${modeLabel}.`);
    router.push(`/teambuilder/problems/${created.id}`);
  };

  const goNext = async () => {
    try {
      // Validate current step fields only
      let fieldsToValidate: (keyof ProblemFormValues)[] = [];
      if (currentStep === 0) {
        fieldsToValidate = ['title', 'statement', 'riskLevel', 'typicalModes'];
      } else if (currentStep === 1) {
        fieldsToValidate = ['taxonomyCodes', 'requiredSkills'];
      } else if (currentStep === 2) {
        fieldsToValidate = [
          'minTeamSize',
          'maxTeamSize',
          'expectedDurationDays',
        ];
      }

      if (fieldsToValidate.length > 0) {
        await form.validateFields(fieldsToValidate as string[]);
      }

      setCurrentStep((prev) => Math.min(prev + 1, 2));
    } catch {
      // validation error – do nothing
    }
  };

  const goPrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmitDraft = async () => {
    setSubmitting('draft');
    try {
      const values = await form.validateFields();
      await persistProblem(values, 'draft');
    } catch (error) {
      console.error('Failed to save TeamBuilder problem draft', error);
      message.error('Unable to save the problem.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleSubmitPublish = async () => {
    setSubmitting('publish');
    try {
      const values = await form.validateFields();
      await persistProblem(values, 'publish');
    } catch (error) {
      console.error('Failed to publish TeamBuilder problem', error);
      message.error('Unable to publish the problem.');
    } finally {
      setSubmitting(null);
    }
  };

  const selectedTaxonomyCodes: string[] =
    Form.useWatch('taxonomyCodes', form) || [];

  const requiredSkills: string[] =
    Form.useWatch('requiredSkills', form) || [];

  const shellSubtitle = (
    <Paragraph type="secondary">
      Define a reusable problem template: clear statement, UNESCO taxonomy
      classification, required skills and constraints. Sessions can then
      reuse this template to form teams tailored to this challenge.
    </Paragraph>
  );

  return (
    <TeamBuilderPageShell
      title="Create problem"
      subtitle={shellSubtitle}
      metaTitle="Team Builder · Problems · Create"
      sectionLabel="Problems"
      secondaryActions={
        <Button href="/teambuilder/problems" icon={<ArrowLeftOutlined />}>
          Back to problem library
        </Button>
      }
      maxWidth={960}
    >
      <Card>
        <Steps
          current={currentStep}
          style={{ marginBottom: 24 }}
          items={[
            {
              title: 'Basics',
              icon: <ProfileOutlined />,
            },
            {
              title: 'Taxonomy & skills',
              icon: <TagsOutlined />,
            },
            {
              title: 'Constraints',
              icon: <DeploymentUnitOutlined />,
            },
          ]}
        />

        <Form<ProblemFormValues>
          layout="vertical"
          form={form}
          onFinish={(values) => void persistProblem(values, 'draft')}
          initialValues={{
            riskLevel: 'medium',
            typicalModes: ['BALANCED', 'LEARNING'],
            taxonomyCodes: [],
            requiredSkills: [],
            minTeamSize: 3,
            maxTeamSize: 7,
            expectedDurationDays: 10,
            allowRehabMode: false,
            allowLearningMode: true,
          }}
        >
          {/* Step content */}
          {currentStep === 0 && (
            <Space
              direction="vertical"
              size="large"
              style={{ width: '100%' }}
            >
              <Alert
                type="info"
                showIcon
                message="Tip: make the problem clear and testable"
                description={
                  <span>
                    State the outcome you want, the constraints, and what
                    success looks like. Avoid vague prompts – these make it
                    harder to evaluate different teams fairly.
                  </span>
                }
              />

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Problem title"
                    name="title"
                    rules={[
                      {
                        required: true,
                        message: 'Please enter a title',
                      },
                    ]}
                  >
                    <Input placeholder="e.g. Cross-functional team for climate-risk dashboard" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Problem statement"
                    name="statement"
                    rules={[
                      {
                        required: true,
                        message: 'Please describe the problem',
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Describe the core challenge, key constraints, and desired outcome..."
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Context / background (optional)"
                    name="context"
                  >
                    <TextArea
                      rows={3}
                      placeholder="Add any background information, stakeholders, or previous attempts..."
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Risk / urgency level"
                    name="riskLevel"
                    rules={[
                      {
                        required: true,
                        message: 'Please select a risk/urgency level',
                      },
                    ]}
                  >
                    <Select
                      options={RISK_OPTIONS}
                      placeholder="Choose risk level"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Typical team modes for this problem"
                    name="typicalModes"
                    rules={[
                      {
                        required: true,
                        message: 'Please select at least one mode',
                      },
                    ]}
                  >
                    <Select
                      mode="multiple"
                      options={MODE_OPTIONS}
                      placeholder="e.g. Elite + Learning-heavy"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Space>
          )}

          {currentStep === 1 && (
            <Space
              direction="vertical"
              size="large"
              style={{ width: '100%' }}
            >
              <Alert
                type="info"
                showIcon
                message="UNESCO taxonomy & skills"
                description={
                  <span>
                    Use the UNESCO taxonomy to anchor this problem in a
                    recognised domain. Then list the skills or roles that
                    teams will likely need to cover.
                  </span>
                }
              />

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="UNESCO taxonomy classification"
                    name="taxonomyCodes"
                  >
                    <TreeSelect
                      treeData={UNESCO_TREE_DATA}
                      treeCheckable
                      showCheckedStrategy={TreeSelect.SHOW_PARENT}
                      placeholder="Select one or more taxonomy codes"
                      style={{ width: '100%' }}
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>

              {selectedTaxonomyCodes.length > 0 && (
                <Row>
                  <Col span={24}>
                    <Space
                      direction="vertical"
                      size={4}
                      style={{ width: '100%' }}
                    >
                      <Text type="secondary">
                        Selected taxonomy codes:
                      </Text>
                      <Space wrap>
                        {selectedTaxonomyCodes.map((code) => (
                          <Tag key={code}>{code}</Tag>
                        ))}
                      </Space>
                    </Space>
                  </Col>
                </Row>
              )}

              <Divider />

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Required skills / roles"
                    name="requiredSkills"
                    tooltip="You can type free-text tags (e.g. 'data scientist', 'facilitator', 'policy expert')."
                    rules={[
                      {
                        required: true,
                        message:
                          'Please specify at least one skill or role',
                      },
                    ]}
                  >
                    <Select
                      mode="tags"
                      placeholder="Type and press Enter to add tags..."
                    />
                  </Form.Item>
                </Col>
              </Row>

              {requiredSkills.length > 0 && (
                <Row>
                  <Col span={24}>
                    <Space
                      direction="vertical"
                      size={4}
                      style={{ width: '100%' }}
                    >
                      <Text type="secondary">
                        Skills/roles you entered:
                      </Text>
                      <Space wrap>
                        {requiredSkills.map((skill) => (
                          <Tag color="blue" key={skill}>
                            {skill}
                          </Tag>
                        ))}
                      </Space>
                    </Space>
                  </Col>
                </Row>
              )}
            </Space>
          )}

          {currentStep === 2 && (
            <Space
              direction="vertical"
              size="large"
              style={{ width: '100%' }}
            >
              <Alert
                type="warning"
                showIcon
                message="Constraints & safety"
                description={
                  <span>
                    These constraints keep teams realistic and safe. For
                    critical or high-risk problems, be conservative with team
                    size and allowed modes.
                  </span>
                }
                icon={<ExclamationCircleOutlined />}
              />

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Minimum team size"
                    name="minTeamSize"
                    rules={[
                      {
                        type: 'number',
                        min: 1,
                        message: 'Minimum team size must be at least 1',
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      placeholder="e.g. 3"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Maximum team size"
                    name="maxTeamSize"
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const min = getFieldValue('minTeamSize');
                          if (
                            value == null ||
                            min == null ||
                            value >= min
                          ) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error(
                              'Max team size must be greater than or equal to min team size',
                            ),
                          );
                        },
                      }),
                    ]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      placeholder="e.g. 7"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Expected duration (days)"
                    name="expectedDurationDays"
                    tooltip="Approximate duration of the project or sprint this team will work on."
                    rules={[
                      {
                        type: 'number',
                        min: 1,
                        message:
                          'Duration should be at least 1 day, or leave empty if unknown',
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      placeholder="e.g. 10"
                      addonAfter={<ScheduleOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Allow rehab / high-risk teams for this problem"
                    name="allowRehabMode"
                    valuePropName="checked"
                    tooltip="If enabled, the engine may create rehab/high-risk teams using difficult members with strong leaders, when the mode is selected."
                  >
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Allow learning-heavy teams for this problem"
                    name="allowLearningMode"
                    valuePropName="checked"
                    tooltip="If enabled, the engine can favor learning-heavy compositions (more juniors, experimental mixes) when the mode allows it."
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Space>
          )}

          <Divider />

          {/* Step navigation + submit actions */}
          <Space
            style={{ width: '100%', justifyContent: 'space-between' }}
            wrap
          >
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={goPrev}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button
                type="primary"
                onClick={goNext}
                disabled={currentStep === 2}
              >
                Next
              </Button>
            </Space>

            <Space wrap>
              <Button
                onClick={handleSubmitDraft}
                icon={<SaveOutlined />}
                loading={submitting === 'draft'}
              >
                Save draft
              </Button>
              <Button
                type="primary"
                onClick={handleSubmitPublish}
                icon={<CheckOutlined />}
                loading={submitting === 'publish'}
              >
                Publish problem
              </Button>
            </Space>
          </Space>

          {/* Hidden submit button for form API completeness */}
          <Form.Item style={{ display: 'none' }}>
            <Button htmlType="submit" />
          </Form.Item>
        </Form>
      </Card>
    </TeamBuilderPageShell>
  );
}
