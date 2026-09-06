'use client'

import { UploadOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Form,
  Input,
  Select,
  Upload,
  message as antdMessage,
} from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import KreativePageShell from '@/app/kreative/kreativePageShell'
import { createKreativeArtwork } from '@/services/kreative'

type CreativeWorkFormValues = {
  title: string
  description: string
  category: string
  credits?: string
  creativeFile: UploadFile[]
}

type UploadChangeParamLite = {
  fileList: UploadFile[]
}

function mediaTypeFromFile(file: File): 'image' | 'video' | 'audio' | 'other' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'other'
}

export default function SubmitCreativeWorkPage(): JSX.Element {
  const [form] = Form.useForm<CreativeWorkFormValues>()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [messageApi, messageContextHolder] = antdMessage.useMessage()
  const router = useRouter()

  const handleUploadChange = (info: UploadChangeParamLite) => {
    setFileList(info.fileList.slice(-1))
  }

  const normFile = (e: UploadChangeParamLite | UploadFile[]) => {
    if (Array.isArray(e)) return e.slice(-1)
    return e?.fileList?.slice(-1) ?? []
  }

  const onFinish = async (values: CreativeWorkFormValues) => {
    const upload = fileList[0]?.originFileObj
    if (!(upload instanceof File)) {
      messageApi.error('Please attach one file.')
      return
    }

    const description = values.credits?.trim()
      ? `${values.description}\n\nCredits: ${values.credits.trim()}`
      : values.description

    const payload = new FormData()
    payload.append('title', values.title)
    payload.append('description', description)
    payload.append('media_file', upload)
    payload.append('media_type', mediaTypeFromFile(upload))
    payload.append('medium', values.category)
    payload.append('year', String(new Date().getFullYear()))

    setSubmitting(true)
    try {
      await createKreativeArtwork(payload)
      messageApi.success('Creative work saved.')
      form.resetFields()
      setFileList([])
      router.push('/kreative/dashboard')
    } catch (error) {
      messageApi.error(
        error instanceof Error
          ? error.message
          : 'Unable to save the creative work.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KreativePageShell
      title="Submit Creative Work"
      subtitle="Share your creative work with the community."
    >
      {messageContextHolder}
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Submissions on this page are persisted through the Kreative artwork API."
      />

      <Form<CreativeWorkFormValues> layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: 'Please enter a title' }]}
        >
          <Input placeholder="e.g., Generative sculpture series" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: 'Please add a description' }]}
        >
          <Input.TextArea rows={4} placeholder="What did you make? How? Why?" />
        </Form.Item>

        <Form.Item
          label="Medium / category"
          name="category"
          rules={[{ required: true, message: 'Please pick a category' }]}
        >
          <Select
            placeholder="Choose one"
            options={[
              { value: 'Art', label: 'Art' },
              { value: 'Design', label: 'Design' },
              { value: 'Music', label: 'Music' },
              { value: 'Other', label: 'Other' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Upload"
          name="creativeFile"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          rules={[
            {
              validator: (_, value: UploadFile[]) =>
                value && value.length
                  ? Promise.resolve()
                  : Promise.reject(new Error('Please attach one file')),
            },
          ]}
        >
          <Upload
            beforeUpload={() => false}
            maxCount={1}
            onChange={handleUploadChange}
            fileList={fileList}
          >
            <Button icon={<UploadOutlined />}>Select file</Button>
          </Upload>
        </Form.Item>

        <Form.Item label="Credits" name="credits">
          <Input placeholder="Collaborators, references, tools…" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </KreativePageShell>
  )
}
