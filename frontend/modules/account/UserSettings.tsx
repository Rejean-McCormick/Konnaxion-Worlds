// FILE: frontend/modules/account/UserSettings.tsx
// frontend/modules/account/UserSettings.tsx
'use client';

import {
  LockOutlined,
  MailOutlined,
  NotificationOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Form,
  Input,
  Space,
  Switch,
  Tabs,
  Typography,
} from 'antd';
import type { TabsProps } from 'antd';
import React from 'react';

import usePageTitle from '@/hooks/usePageTitle';

const { Title, Paragraph, Text } = Typography;

type ProfileSettingsValues = {
  displayName: string;
  username: string;
  bio?: string;
};

type SecuritySettingsValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type NotificationSettingsValues = {
  emailActivity: boolean;
  emailDigest: boolean;
  pushImportant: boolean;
};

type PrivacySettingsValues = {
  publicProfile: boolean;
  showBadges: boolean;
  showActivity: boolean;
};

// Simple placeholder submit handler – wire to your API as needed.
function fakeSubmit(message: string) {
   
  console.log(`[UserSettings] ${message}`);
}

const ProfileSettingsTab: React.FC = () => {
  const [form] = Form.useForm<ProfileSettingsValues>();

  const onFinish = (values: ProfileSettingsValues) => {
    fakeSubmit(`Profile updated: ${JSON.stringify(values)}`);
  };

  return (
    <>
      <Title level={4}>Profile</Title>
      <Paragraph type="secondary">
        Update your basic account information. This is how other users will see you.
      </Paragraph>

      <Form<ProfileSettingsValues>
        form={form}
        layout="vertical"
        initialValues={{
          displayName: '',
          username: '',
          bio: '',
        }}
        onFinish={onFinish}
      >
        <Form.Item
          name="displayName"
          label="Display name"
          rules={[{ required: true, message: 'Please enter a display name' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Your name" />
        </Form.Item>

        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: 'Please enter a username' }]}
        >
          <Input addonBefore="@" placeholder="handle" />
        </Form.Item>

        <Form.Item name="bio" label="Bio">
          <Input.TextArea rows={3} placeholder="Short bio shown on your public profile" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Save changes
            </Button>
            <Text type="secondary">Changes may take a few seconds to propagate.</Text>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};

const SecuritySettingsTab: React.FC = () => {
  const [form] = Form.useForm<SecuritySettingsValues>();

  const onFinish = (values: SecuritySettingsValues) => {
    fakeSubmit(`Security updated: ${JSON.stringify(values)}`);
  };

  return (
    <>
      <Title level={4}>Security</Title>
      <Paragraph type="secondary">
        Change your password and review basic security settings.
      </Paragraph>

      <Form<SecuritySettingsValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="currentPassword"
          label="Current password"
          rules={[{ required: true, message: 'Please enter your current password' }]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="New password"
          rules={[{ required: true, message: 'Please enter a new password' }]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm new password"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Please confirm your new password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error('The two passwords do not match'),
                );
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Update password
            </Button>
          </Space>
        </Form.Item>

        <Alert
          type="info"
          showIcon
          message="Two-factor authentication"
          description="When ready, you can extend this section with 2FA / WebAuthn configuration."
        />
      </Form>
    </>
  );
};

const NotificationSettingsTab: React.FC = () => {
  const onFinish = (values: NotificationSettingsValues) => {
    fakeSubmit(`Notifications updated: ${JSON.stringify(values)}`);
  };

  return (
    <>
      <Title level={4}>Notifications</Title>
      <Paragraph type="secondary">
        Choose how you want to be notified about activity related to your account.
      </Paragraph>

      <Form<NotificationSettingsValues>
        layout="vertical"
        initialValues={{
          emailActivity: true,
          emailDigest: true,
          pushImportant: true,
        }}
        onFinish={onFinish}
      >
        <Form.Item
          name="emailActivity"
          valuePropName="checked"
          label="Email me about new activity"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="emailDigest"
          valuePropName="checked"
          label="Send a weekly summary digest"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="pushImportant"
          valuePropName="checked"
          label="Show in-app alerts for important events"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<NotificationOutlined />}>
            Save notification settings
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

const PrivacySettingsTab: React.FC = () => {
  const onFinish = (values: PrivacySettingsValues) => {
    fakeSubmit(`Privacy updated: ${JSON.stringify(values)}`);
  };

  return (
    <>
      <Title level={4}>Privacy</Title>
      <Paragraph type="secondary">
        Control how your profile and activity appear to other users.
      </Paragraph>

      <Form<PrivacySettingsValues>
        layout="vertical"
        initialValues={{
          publicProfile: true,
          showBadges: true,
          showActivity: true,
        }}
        onFinish={onFinish}
      >
        <Form.Item
          name="publicProfile"
          valuePropName="checked"
          label="Make my profile discoverable"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="showBadges"
          valuePropName="checked"
          label="Show my badges on my public profile"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="showActivity"
          valuePropName="checked"
          label="Show my recent activity on my profile"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Save privacy settings
            </Button>
            <Text type="secondary">
              These settings only affect what other users see in the product.
            </Text>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};

const UserSettings: React.FC = () => {
  usePageTitle('Account · Settings');

  const items: TabsProps['items'] = [
    {
      key: 'profile',
      label: (
        <Space>
          <UserOutlined />
          <span>Profile</span>
        </Space>
      ),
      children: <ProfileSettingsTab />,
    },
    {
      key: 'security',
      label: (
        <Space>
          <LockOutlined />
          <span>Security</span>
        </Space>
      ),
      children: <SecuritySettingsTab />,
    },
    {
      key: 'notifications',
      label: (
        <Space>
          <NotificationOutlined />
          <span>Notifications</span>
        </Space>
      ),
      children: <NotificationSettingsTab />,
    },
    {
      key: 'privacy',
      label: (
        <Space>
          <MailOutlined />
          <span>Privacy</span>
        </Space>
      ),
      children: <PrivacySettingsTab />,
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'User settings',
        subTitle: 'Manage your profile, security, notifications, and privacy preferences.',
      }}
    >
      <Tabs defaultActiveKey="profile" items={items} />
    </PageContainer>
  );
};

export default UserSettings;
