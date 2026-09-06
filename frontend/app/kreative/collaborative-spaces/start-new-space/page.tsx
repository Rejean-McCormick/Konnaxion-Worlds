// FILE: frontend/app/kreative/collaborative-spaces/start-new-space/page.tsx
// app/kreative/collaborative-spaces/start-new-space/page.tsx
'use client';

import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React, { useState } from 'react';

import KreativePageShell from '@/app/kreative/kreativePageShell';
import PageContainer from '@/components/PageContainer';
import { createCollabSession } from '@/services/kreative';

const { TextArea } = Input;
const { Option } = Select;
const { Paragraph } = Typography;

type PrivacyOption = 'Public' | 'Private';

interface InvitedMemberField {
  email: string;
}

interface StartNewSpaceFormValues {
  name: string;
  description: string;
  category: string;
  privacy: PrivacyOption;
  invitedMembers?: InvitedMemberField[];
  banner?: UploadFile[];
}

// Minimal type for Upload onChange (keeps us away from implicit any)
type UploadChangeParamLite = {
  fileList: UploadFile[];
};

export default function StartNewSpacePage(): JSX.Element {
  const [form] = Form.useForm<StartNewSpaceFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (info: UploadChangeParamLite) => {
    setFileList(info.fileList);
  };

  const onFinish = async (values: StartNewSpaceFormValues) => {
    const sessionType =
      values.category === 'Music Jam Session'
        ? 'music'
        : values.category === 'Art Study Group'
          ? 'painting'
          : 'mixed';

    setSubmitting(true);
    try {
      const created = await createCollabSession({
        name: values.name,
        session_type: sessionType,
      });
      form.resetFields();
      setFileList([]);
      return created;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KreativePageShell
      title="Start a New Space"
      subtitle="Define your collaborative space so others can discover and join the right context."
    >
      <PageContainer title="Start a New Space">
        <Alert
          type="info"
          showIcon
          message="Core collaboration session is persisted"
          description="Name and session type are saved through the real Kreative CollabSession API. Description, privacy, invitations and banner remain declared preview fields until their backend contract exists."
          style={{ marginBottom: 16 }}
        />
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Define your collaborative space so others can discover and join the right context.
        </Paragraph>

        <Form<StartNewSpaceFormValues>
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ privacy: 'Public', category: 'Art Study Group' }}
        >
          {/* Space Name */}
          <Form.Item
            label="Space Name"
            name="name"
            rules={[{ required: true, message: 'Please enter a space name.' }]}
          >
            <Input placeholder="Enter the name of your space" />
          </Form.Item>

          {/* Description / Purpose */}
          <Form.Item
            label="Description / Purpose"
            name="description"
            rules={[
              {
                required: true,
                message: 'Please provide a description for your space.',
              },
            ]}
          >
            <TextArea
              rows={5}
              placeholder="Describe the purpose and vision of your space"
            />
          </Form.Item>

          {/* Category / Type */}
          <Form.Item
            label="Category / Type"
            name="category"
            rules={[{ required: true, message: 'Please select a category.' }]}
          >
            <Select placeholder="Select a category">
              <Option value="Art Study Group">Art Study Group</Option>
              <Option value="Music Jam Session">Music Jam Session</Option>
              <Option value="Creative Writing Circle">
                Creative Writing Circle
              </Option>
              <Option value="Digital Innovation Hub">
                Digital Innovation Hub
              </Option>
            </Select>
          </Form.Item>

          {/* Privacy Setting */}
          <Form.Item
            label="Privacy Setting"
            name="privacy"
            rules={[{ required: true, message: 'Please choose a privacy setting.' }]}
          >
            <Radio.Group>
              <Radio value="Public">Public (Anyone can join)</Radio>
              <Radio value="Private">Private (Invite Only)</Radio>
            </Radio.Group>
          </Form.Item>

          {/* Invite Initial Members (only when Private) */}
          <Form.Item shouldUpdate={(prev, cur) => prev.privacy !== cur.privacy}>
            {({ getFieldValue }) =>
              getFieldValue('privacy') === 'Private' ? (
                <Form.List name="invitedMembers">
                  {(fields, { add, remove }) => (
                    <Space
                      direction="vertical"
                      style={{ width: '100%' }}
                    >
                      {fields.map((field) => (
                        <Space key={field.key} align="baseline">
                          <Form.Item
                            {...field}
                            name={[field.name, 'email']}
                            rules={[
                              {
                                required: true,
                                message: 'Please enter an email address.',
                              },
                              {
                                type: 'email',
                                message: 'Please enter a valid email address.',
                              },
                            ]}
                          >
                            <Input placeholder="Enter member email" />
                          </Form.Item>
                          <Button
                            type="link"
                            onClick={() => remove(field.name)}
                          >
                            Remove
                          </Button>
                        </Space>
                      ))}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          icon={<PlusOutlined />}
                        >
                          Invite Member
                        </Button>
                      </Form.Item>
                    </Space>
                  )}
                </Form.List>
              ) : null
            }
          </Form.Item>

          {/* Space Banner or Icon Upload */}
          <Form.Item label="Space Icon / Banner Image" name="banner">
            <Upload
              beforeUpload={() => false} // prevent auto-upload
              fileList={fileList}
              onChange={handleFileChange}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Create Space
            </Button>
          </Form.Item>
        </Form>
      </PageContainer>
    </KreativePageShell>
  );
}
