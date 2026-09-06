'use client'

import { Alert, Button, Form, Input, Select } from 'antd'
import { useRouter } from 'next/navigation'
import React from 'react'

import KreativePageShell from '@/app/kreative/kreativePageShell'

const { TextArea } = Input

type FormValues = {
  title: string
  category: string
  description: string
  link?: string
  tags?: string[]
}

export default function SubmitToShowcasePage(): JSX.Element {
  const [form] = Form.useForm<FormValues>()
  const router = useRouter()

  const categories = [
    { label: 'Art', value: 'art' },
    { label: 'Design', value: 'design' },
    { label: 'Photography', value: 'photography' },
    { label: 'Music', value: 'music' },
  ]

  return (
    <KreativePageShell
      title="Submit to Showcase"
      subtitle="Prepare a showcase submission without implying persistence that the backend does not expose yet."
    >
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="Showcase review submissions are not persisted in this build."
        description="Use Submit Creative Work for a real persisted artwork. This form remains available as a read-only product preview until a dedicated showcase-review contract exists."
      />

      <Form<FormValues>
        form={form}
        layout="vertical"
        name="submitToShowcaseForm"
        disabled
      >
        <Form.Item label="Project title" name="title">
          <Input placeholder="e.g. Konnaxion Visualizer" allowClear />
        </Form.Item>

        <Form.Item label="Category" name="category">
          <Select
            placeholder="Select a category"
            options={categories}
            showSearch
            filterOption={(input, option) =>
              (option?.label as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea
            rows={5}
            placeholder="What is this project about?"
            allowClear
          />
        </Form.Item>

        <Form.Item label="Reference link" name="link">
          <Input placeholder="https://…" allowClear type="url" />
        </Form.Item>

        <Form.Item label="Tags" name="tags">
          <Select
            mode="tags"
            placeholder="Add tags"
            tokenSeparators={[',']}
            options={[]}
          />
        </Form.Item>
      </Form>

      <Button onClick={() => router.back()}>Back</Button>
      <Button
        type="primary"
        style={{ marginLeft: 8 }}
        onClick={() => router.push('/kreative/creative-hub/submit-creative-work')}
      >
        Submit persisted creative work
      </Button>
    </KreativePageShell>
  )
}
