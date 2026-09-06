// FILE: frontend/app/konnected/community-discussions/start-new-discussion/page.tsx
﻿// C:\MyCode\Konnaxionv14\frontend\app\konnected\community-discussions\start-new-discussion\page.tsx
'use client';


import { InfoCircleOutlined, MessageOutlined, QuestionCircleOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Alert,
  message as antdMessage,
  Button,
  Card,
  Col,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { FormProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { apiFetch } from '@/api';
import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';

const { TextArea } = Input;
const { Paragraph, Text } = Typography;

type ThreadType = 'question' | 'discussion';

type FormValues = {
  title: string;
  content?: string;
  category: string;
  threadType: ThreadType;
  tags?: string[];
  subscribeToReplies?: boolean;
  attachments?: UploadFile[];
};

type CreateBodies = {
  topic: {
    title: string;
    category: string;
  };
  initialPostContent?: string;
};

/**
 * Extracts a human-friendly error message from a DRF-style error response.
 */
async function extractBackendMessage(res: Response): Promise<string | undefined> {
  try {
    const data: unknown = await res.json();
    if (!data || typeof data !== 'object') return undefined;
    const payload = data as Record<string, unknown>;
    if (typeof payload.detail === 'string') return payload.detail;
    if (typeof payload.message === 'string') return payload.message;
    if (typeof payload.error === 'string') return payload.error;
  } catch {
    // ignore JSON parse errors
  }
  return undefined;
}

/**
 * Start New Discussion page for KonnectED → Community Discussions.
 * Creates a ForumTopic, then (optionally) an initial ForumPost
 * using the real backend endpoints /api/konnected/forum-topics/ and /api/konnected/forum-posts/.
 */
export default function StartNewDiscussionPage(): JSX.Element {
  const [form] = Form.useForm<FormValues>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const buildBodies = (values: FormValues): CreateBodies => {
    const trimmedTitle = values.title.trim();
    const trimmedContent = values.content?.trim();

    return {
      topic: {
        title: trimmedTitle,
        category: values.category,
      },
      initialPostContent: trimmedContent || undefined,
    };
  };

  const onFinish: FormProps<FormValues>['onFinish'] = async (values) => {
    setSubmitting(true);
    try {
      const { topic, initialPostContent } = buildBodies(values);

      // 1) Create the forum topic (thread) itself.
      const topicRes = await apiFetch('/api/konnected/forum-topics/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(topic),
      });

      if (!topicRes.ok) {
        const backendMessage =
          (await extractBackendMessage(topicRes)) ?? 'Unable to create discussion.';
        if (topicRes.status === 403) {
          antdMessage.error(
            backendMessage || 'You do not have permission to start a new discussion.',
          );
        } else if (topicRes.status === 429) {
          antdMessage.error(
            backendMessage ||
              'You have created too many discussions in a short time. Please try again later.',
          );
        } else {
          antdMessage.error(backendMessage);
        }
        return;
      }

      const createdTopic = (await topicRes.json()) as { id: number | string };

      // 2) Optionally create the initial post in the topic.
      if (initialPostContent) {
        const topicId = createdTopic?.id;
        if (topicId == null) {
          // Topic exists but we could not read its id – log and continue.
           
          console.warn('Created topic without id in response payload.', createdTopic);
        } else {
          const postBody = {
            topic: Number(topicId),
            content: initialPostContent,
          };

          const postRes = await apiFetch('/api/konnected/forum-posts/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(postBody),
          });

          if (!postRes.ok) {
            const backendMessage =
              (await extractBackendMessage(postRes)) ??
              'Your topic was created, but the initial post could not be saved.';
            antdMessage.warning(backendMessage);
          }
        }
      }

      antdMessage.success('Discussion created successfully.');
      router.push('/konnected/community-discussions/active-threads');
    } catch (error) {
      // Network or unexpected error
       
      console.error('Error creating discussion', error);
      antdMessage.error('Something went wrong while creating the discussion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onFinishFailed: FormProps<FormValues>['onFinishFailed'] = () => {
    antdMessage.error('Please fix the highlighted fields and try again.');
  };

  // Categories mapped to ForumTopic.category values. Adjust as needed.
  const CATEGORY_OPTIONS: { label: string; value: string }[] = [
    { label: 'Math', value: 'Math' },
    { label: 'Science', value: 'Science' },
    { label: 'General', value: 'General' },
  ];

  const TAG_SUGGESTIONS = ['Exam prep', 'Project help', 'Tips & tricks', 'Resources', 'Mentoring'];

  return (
    <KonnectedPageShell
      title="Start a New Discussion"
      subtitle={
        <span>
          Share a question or topic with the KonnectED community. Your post may be surfaced in learning
          paths and thematic forums.
        </span>
      }
    >
      <Row gutter={[24, 24]}>
        {/* Main form column */}
        <Col xs={24} md={16}>
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                message="Reminder: keep it constructive and on-topic"
                description={
                  <span>
                    Discussions are visible across teams. Content may be routed to moderators before
                    publication for low-trust accounts.
                  </span>
                }
              />

              <Form<FormValues>
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                initialValues={{
                  threadType: 'discussion',
                  subscribeToReplies: true,
                }}
              >
                {/* Title */}
                <Form.Item
                  label="Title"
                  name="title"
                  rules={[
                    { required: true, message: 'Please enter a title' },
                    { min: 10, message: 'The title should be at least 10 characters long.' },
                    { max: 150, message: 'The title should be at most 150 characters.' },
                    {
                      validator: (_, value) => {
                        if (typeof value === 'string' && !value.trim()) {
                          return Promise.reject(
                            new Error('The title cannot be empty or just spaces.'),
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input placeholder="e.g. How do we measure impact across teams in cross-faculty projects?" />
                </Form.Item>

                {/* Thread type */}
                <Form.Item
                  label="Type of thread"
                  name="threadType"
                  rules={[{ required: true, message: 'Please select the type of discussion.' }]}
                >
                  <Radio.Group>
                    <Radio.Button value="question">
                      <Space>
                        <QuestionCircleOutlined />
                        <span>Question (Q&amp;A)</span>
                      </Space>
                    </Radio.Button>
                    <Radio.Button value="discussion">
                      <Space>
                        <MessageOutlined />
                        <span>Open discussion</span>
                      </Space>
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>

                {/* Category */}
                <Form.Item
                  label="Category / subject area"
                  name="category"
                  rules={[{ required: true, message: 'Please select a category.' }]}
                >
                  <Select
                    placeholder="Select a category"
                    options={CATEGORY_OPTIONS}
                    allowClear
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>

                {/* Content */}
                <Form.Item
                  label="Content"
                  name="content"
                  rules={[
                    {
                      max: 5000,
                      message: 'The content is too long (max 5000 characters).',
                    },
                  ]}
                  extra="Provide enough context so that others can give meaningful answers or contributions."
                >
                  <TextArea
                    rows={6}
                    placeholder="Describe your question or topic. You can mention specific courses, projects, or resources…"
                    showCount
                    maxLength={5000}
                  />
                </Form.Item>

                {/* Tags */}
                <Form.Item
                  label="Tags"
                  name="tags"
                  tooltip="Use tags so your discussion can be surfaced in thematic forums and learning paths."
                >
                  <Select
                    mode="tags"
                    tokenSeparators={[',']}
                    placeholder="Add tags (press Enter to confirm)…"
                    options={TAG_SUGGESTIONS.map((t) => ({ label: t, value: t }))}
                  />
                </Form.Item>

                {/* Attachments */}
                <Form.Item
                  label="Attachments"
                  name="attachments"
                  valuePropName="fileList"
                  getValueFromEvent={(e: { fileList: UploadFile[] }) => e?.fileList}
                  extra="Attach optional supporting files (e.g. PDF instructions, slides)."
                >
                  <Upload.Dragger
                    multiple
                    beforeUpload={() => false} // prevent auto-upload; backend integration can be wired later
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag files to this area to attach</p>
                    <p className="ant-upload-hint">
                      Files will be included with your initial post when supported.
                    </p>
                  </Upload.Dragger>
                </Form.Item>

                {/* Notification / subscription */}
                <Form.Item
                  label="Notify me about replies"
                  name="subscribeToReplies"
                  valuePropName="checked"
                  tooltip="You will receive notifications when someone replies or your post is updated."
                >
                  <Switch />
                </Form.Item>

                {/* Submit button */}
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={submitting}>
                      Post discussion
                    </Button>
                    <Button
                      htmlType="button"
                      onClick={() =>
                        router.push('/konnected/community-discussions/active-threads')
                      }
                    >
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Space>
          </Card>
        </Col>

        {/* Right-hand guidance / meta column */}
        <Col xs={24} md={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="Good discussion practices">
              <Space direction="vertical">
                <Text>
                  <Tag color="blue">Be specific</Tag> Clearly describe the context (course, team,
                  project, tool).
                </Text>
                <Text>
                  <Tag color="green">Show your attempt</Tag> For questions, explain what you already
                  tried or understood.
                </Text>
                <Text>
                  <Tag color="gold">Respect privacy</Tag> Avoid sharing sensitive personal or
                  institutional data.
                </Text>
                <Text>
                  <Tag color="purple">Use tags</Tag> Tags help link the discussion to Knowledge units
                  and learning paths.
                </Text>
              </Space>
            </Card>

            <Card title="Moderation and visibility">
              <Paragraph>
                Posts may be queued for moderation based on your trust level or if they match
                sensitive topics.
              </Paragraph>
              <Paragraph>
                If moderation is required, you&apos;ll see your topic as{' '}
                <Text strong>“Pending review”</Text> until a moderator approves it.
              </Paragraph>
              <Paragraph>
                You can later edit your post, close a question, or mark an answer as accepted from
                the thread detail page (when implemented).
              </Paragraph>
            </Card>
          </Space>
        </Col>
      </Row>
    </KonnectedPageShell>
  );
}
