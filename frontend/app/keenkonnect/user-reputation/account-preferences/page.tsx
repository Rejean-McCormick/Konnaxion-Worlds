'use client'

import { Alert, Button, Card, Form, Input, Space, Spin, Tabs, Typography } from 'antd'
import type { TabsProps } from 'antd'
import React, { useEffect, useState } from 'react'

import KeenPage from '@/app/keenkonnect/KeenPageShell'
import {
  fetchCurrentUser,
  resolveAvatarUrl,
  type CurrentUser,
  updateCurrentUserName,
} from '@/services/user'

const { Text, Paragraph } = Typography

type ProfileValues = { name: string }

export default function AccountPreferencesPage(): JSX.Element {
  const [form] = Form.useForm<ProfileValues>()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    void fetchCurrentUser()
      .then((current) => {
        if (!active) return
        setUser(current)
        form.setFieldsValue({ name: current.name ?? current.username })
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(cause instanceof Error ? cause.message : 'Unable to load account profile.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [form])

  const saveProfile = async ({ name }: ProfileValues): Promise<void> => {
    if (!user) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const updated = await updateCurrentUserName(user.username, name.trim())
      setUser(updated)
      setSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update profile name.')
    } finally {
      setSaving(false)
    }
  }

  const readOnlyPanel = (title: string, detail: string) => (
    <Alert
      type="info"
      showIcon
      message={`${title} is read-only in this build`}
      description={detail}
    />
  )

  const items: TabsProps['items'] = [
    {
      key: 'profile',
      label: 'Profile Info',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Only the canonical display name is writable"
            description="The current user serializer supports a real display-name update. Avatar, headline, biography and discoverability writes are not exposed, so they are not presented as successful mutations."
          />
          {error ? <Alert type="error" showIcon message="Profile operation failed" description={error} /> : null}
          {saved ? <Alert type="success" showIcon message="Display name saved" /> : null}
          <Spin spinning={loading}>
            <Card>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {user ? (
                  <img
                    src={resolveAvatarUrl(user)}
                    alt="Current profile"
                    style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : null}
                <Text type="secondary">Username: {user?.username ?? '—'}</Text>
                <Form<ProfileValues> form={form} layout="vertical" onFinish={saveProfile}>
                  <Form.Item
                    name="name"
                    label="Display name"
                    rules={[{ required: true, whitespace: true, message: 'Please enter a display name.' }]}
                  >
                    <Input disabled={!user || loading} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={saving} disabled={!user || loading}>
                    Save display name
                  </Button>
                </Form>
              </Space>
            </Card>
          </Spin>
        </Space>
      ),
    },
    {
      key: 'security',
      label: 'Security',
      children: readOnlyPanel(
        'Security preferences',
        'Password change, two-factor authentication and login-alert mutation contracts are not exposed by the current Konnaxion user API.',
      ),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      children: readOnlyPanel(
        'Notification preferences',
        'Notification preference persistence is a declared deferred surface until a dedicated user-preferences contract exists.',
      ),
    },
    {
      key: 'privacy',
      label: 'Privacy',
      children: readOnlyPanel(
        'Privacy preferences',
        'KeenKonnect-specific discoverability and sharing preferences are not persisted by the current user API.',
      ),
    },
    {
      key: 'danger',
      label: 'Danger Zone',
      children: (
        <Card>
          <Paragraph>
            Account deletion is intentionally unavailable from this surface because no supported account-deletion contract is exposed.
          </Paragraph>
          <Button danger disabled>Delete account unavailable</Button>
        </Card>
      ),
    },
  ]

  return (
    <KeenPage
      title="Account & Preferences"
      description="Manage the parts of your account that are backed by current Konnaxion contracts."
    >
      <Tabs defaultActiveKey="profile" items={items} />
    </KeenPage>
  )
}
