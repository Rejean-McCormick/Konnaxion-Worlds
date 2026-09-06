// FILE: frontend/app/konnected/knowledge/contribute/page.tsx
// app/konnected/knowledge/contribute/page.tsx
'use client';

import {
  InboxOutlined,
  InfoCircleOutlined,
  PlusOutlined,
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
  Switch,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { UploadProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React from 'react';

import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';

const { Paragraph, Title } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

interface ContributeFormValues {
  title: string;
  subject?: string;
  level?: KnowledgeLevel;
  language?: string;
  resourceType?: string;
  estimatedMinutes?: number;
  tags?: string[];
  description?: string;
  url?: string;
  isOfflineAvailable?: boolean;
  allowReuse?: boolean;
  audience?: string;
  notesForReviewers?: string;
  fileList?: UploadFile[];
}

const SUBJECT_OPTIONS = [
  'Sustainability',
  'Civic engagement',
  'STEM',
  'Arts & culture',
  'Ethics & philosophy',
  'Digital skills',
];

const LANGUAGE_OPTIONS = ['English', 'French', 'Spanish', 'Other'];

const RESOURCE_TYPES = [
  'Article',
  'Video',
  'Lesson plan',
  'Worksheet',
  'Quiz',
  'Dataset',
  'Other',
];

const TAG_SUGGESTIONS = [
  'youth',
  'teacher-ready',
  'intro',
  'advanced',
  'group-activity',
  'self-paced',
];

const uploadProps: UploadProps = {
  name: 'file',
  multiple: false,
  maxCount: 1,
  beforeUpload: () => false, // prevent auto-upload; handled by form submit
};

function normFile(event: unknown): UploadFile[] {
  if (Array.isArray(event)) {
    return event as UploadFile[];
  }

  if (
    typeof event === 'object' &&
    event !== null &&
    'fileList' in event &&
    Array.isArray((event as { fileList?: unknown }).fileList)
  ) {
    return (event as { fileList: UploadFile[] }).fileList;
  }

  return [];
}

export default function KonnectedKnowledgeContributePage(): JSX.Element {
  const [form] = Form.useForm<ContributeFormValues>();

  const handleSubmit = (values: ContributeFormValues) => {
    // Placeholder: will later call the KonnectED knowledge contribution API
    // For now we just log and show a success toast.
     
    console.log('KonnectED knowledge contribution (local only):', values);
    message.success('Your contribution has been saved locally for review.');
  };

  const handleSaveDraft = () => {
    const values = form.getFieldsValue();
     
    console.log('Draft contribution (local only):', values);
    message.info('Draft saved locally in this session.');
  };

  return (
    <KonnectedPageShell
      title="Contribute knowledge"
      subtitle="Propose new learning resources to enrich the KonnectED library."
      primaryAction={
        <Button type="primary" onClick={() => form.submit()} icon={<PlusOutlined />}>
          Submit for review
        </Button>
      }
      secondaryActions={
        <Space>
          <Button onClick={handleSaveDraft}>Save draft</Button>
          <Button onClick={() => form.resetFields()}>Reset form</Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card>
            <Form<ContributeFormValues>
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                language: 'English',
                level: 'beginner',
                isOfflineAvailable: false,
                allowReuse: true,
              }}
            >
              <Title level={4} style={{ marginBottom: 16 }}>
                Resource details
              </Title>

              <Form.Item
                label="Title"
                name="title"
                rules={[
                  { required: true, message: 'Please enter a title for the resource.' },
                ]}
                tooltip={{
                  title: 'This is how the resource will appear in the KonnectED library.',
                  icon: <InfoCircleOutlined />,
                }}
              >
                <Input placeholder="Example: Introduction to community-led climate action" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Subject / theme"
                    name="subject"
                    rules={[
                      {
                        required: true,
                        message: 'Please select the main subject.',
                      },
                    ]}
                  >
                    <Select
                      placeholder="Choose a subject"
                      options={SUBJECT_OPTIONS.map((s) => ({ label: s, value: s }))}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Level"
                    name="level"
                    rules={[
                      {
                        required: true,
                        message: 'Please choose an approximate level.',
                      },
                    ]}
                  >
                    <Select<KnowledgeLevel>
                      placeholder="Select level"
                      options={[
                        { label: 'Beginner', value: 'beginner' },
                        { label: 'Intermediate', value: 'intermediate' },
                        { label: 'Advanced', value: 'advanced' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Language" name="language">
                    <Select
                      placeholder="Select language"
                      options={LANGUAGE_OPTIONS.map((l) => ({ label: l, value: l }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Resource type"
                    name="resourceType"
                    rules={[
                      {
                        required: true,
                        message: 'Please choose a resource type.',
                      },
                    ]}
                  >
                    <Select
                      placeholder="Article, video, lesson…"
                      options={RESOURCE_TYPES.map((t) => ({ label: t, value: t }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Estimated time (minutes)"
                    name="estimatedMinutes"
                    tooltip="Rough time a learner needs to complete this resource."
                  >
                    <InputNumber
                      min={5}
                      max={480}
                      style={{ width: '100%' }}
                      placeholder="e.g. 45"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Audience"
                    name="audience"
                    tooltip="Who is this primarily designed for? (e.g. Secondary students, adult learners, teachers)"
                  >
                    <Input placeholder="e.g. Secondary students, youth groups, teachers" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Short description"
                name="description"
                rules={[
                  {
                    required: true,
                    message: 'Please provide a short description.',
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Describe the resource, what learners will gain, and how it can be used."
                />
              </Form.Item>

              <Form.Item
                label="Tags"
                name="tags"
                tooltip="Add a few tags to help people discover this resource."
              >
                <Select
                  mode="tags"
                  placeholder="Add tags (press Enter to confirm)"
                  tokenSeparators={[',', ';']}
                >
                  {TAG_SUGGESTIONS.map((tag) => (
                    <Select.Option key={tag} value={tag}>
                      <Tag>{tag}</Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Divider />

              <Title level={4} style={{ marginBottom: 16 }}>
                Access & files
              </Title>

              <Form.Item
                label="Online link (optional)"
                name="url"
                tooltip="If this resource lives on the web (video, article, etc.), paste the link here."
              >
                <Input placeholder="https://…" />
              </Form.Item>

              <Form.Item
                label="Upload file (optional)"
                name="fileList"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                tooltip="Upload a PDF, slide deck or other material for offline use."
              >
                <Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag file to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Single file only. For large packages, you can also share a cloud
                    link in the Online link field above.
                  </p>
                </Dragger>
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Available offline"
                    name="isOfflineAvailable"
                    valuePropName="checked"
                    tooltip="Mark this if the resource can be safely bundled into offline packages."
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Allow re-use and adaptation"
                    name="allowReuse"
                    valuePropName="checked"
                    tooltip="If enabled, educators are allowed to adapt or remix this resource with attribution."
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Title level={4} style={{ marginBottom: 16 }}>
                Notes for reviewers
              </Title>

              <Form.Item
                label="Context or instructions (optional)"
                name="notesForReviewers"
                tooltip="Anything reviewers should know about how this was created or how it should be used."
              >
                <TextArea
                  rows={3}
                  placeholder="Add any context, citations, or instructions for the review team."
                />
              </Form.Item>

              {/* Hidden submit button so shell primaryAction can trigger form.submit() */}
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" style={{ display: 'none' }}>
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title="Contribution guidelines">
              <Alert
                type="info"
                showIcon
                message="Before you submit"
                description={
                  <div>
                    <Paragraph>
                      To keep the KonnectED library high-quality and inclusive:
                    </Paragraph>
                    <ul className="list-disc pl-5">
                      <li>Use respectful, inclusive language throughout.</li>
                      <li>
                        Make sure you own the rights to share any files, images or
                        videos you upload.
                      </li>
                      <li>
                        Cite your sources clearly in the description or notes for
                        reviewers.
                      </li>
                      <li>
                        Check that the level, subject and estimated time reflect the
                        reality for learners.
                      </li>
                    </ul>
                  </div>
                }
              />
            </Card>

            <Card title="How review works">
              <Paragraph>
                Once you submit, your resource will be queued for review by the
                KonnectED team or trusted community reviewers.
              </Paragraph>
              <Paragraph>
                They may:
              </Paragraph>
              <ul className="list-disc pl-5">
                <li>Suggest edits to title, description or tags.</li>
                <li>Group it into an existing learning path or collection.</li>
                <li>Flag issues around licensing, accuracy or inclusivity.</li>
              </ul>
              <Paragraph type="secondary">
                You will be able to track the status of your contributions from
                your KonnectED dashboard once the backend workflow is wired up.
              </Paragraph>
            </Card>
          </Space>
        </Col>
      </Row>
    </KonnectedPageShell>
  );
}
