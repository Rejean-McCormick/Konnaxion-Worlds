'use client';

import { Alert, Button, Form, Input, Select } from 'antd';
import React from 'react';

import KreativePageShell from '@/app/kreative/kreativePageShell';

const { TextArea } = Input;
const { Option } = Select;

type IdeaFormValues = {
  title: string;
  description: string;
  category: string;
};

export default function CreateNewIdea(): JSX.Element {
  const [form] = Form.useForm<IdeaFormValues>();

  return (
    <KreativePageShell
      title="Create New Idea"
      subtitle="Preview the intended idea-incubator intake model."
    >
      <Alert
        type="info"
        showIcon
        message="Idea creation is a declared preview"
        description="Kreative does not expose an idea-incubator persistence contract in this build. The form remains visible for product review, but submission is disabled."
        style={{ marginBottom: 16 }}
      />
      <Form<IdeaFormValues> form={form} layout="vertical">
        <Form.Item label="Title of Idea" name="title">
          <Input placeholder="Enter title of your idea" />
        </Form.Item>
        <Form.Item label="Detailed Description" name="description">
          <TextArea rows={6} placeholder="Explain your idea and the problem it addresses" />
        </Form.Item>
        <Form.Item label="Category / Field" name="category">
          <Select placeholder="Select a category">
            <Option value="Technology">Technology</Option>
            <Option value="Art">Art</Option>
            <Option value="Education">Education</Option>
            <Option value="Health">Health</Option>
            <Option value="Environment">Environment</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" disabled>
            Submit unavailable
          </Button>
        </Form.Item>
      </Form>
    </KreativePageShell>
  );
}
