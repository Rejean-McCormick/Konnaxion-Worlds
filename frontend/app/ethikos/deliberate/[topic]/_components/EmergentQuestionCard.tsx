'use client'

import { ArrowRightOutlined, BulbOutlined } from '@ant-design/icons'
import { ProCard } from '@ant-design/pro-components'
import { useRequest } from 'ahooks'
import { Alert, Button, Space, Tag, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { fetchEliteTopics } from '@/services/deliberate'

const { Text } = Typography

function isEconomicAutonomyDemo(title: string): boolean {
  const value = title.toLowerCase()
  return (
    value.includes('[demo]') &&
    (
      value.includes('dépendance') ||
      value.includes('dependance') ||
      value.includes('dependence')
    ) &&
    (
      value.includes('états-unis') ||
      value.includes('etats-unis') ||
      value.includes('united states')
    )
  )
}

function isTrumpQuestion(title: string): boolean {
  return title.toLowerCase().includes('donald trump')
}

export default function EmergentQuestionCard({
  currentTitle,
}: {
  currentTitle: string
}): JSX.Element | null {
  const router = useRouter()
  const enabled = isEconomicAutonomyDemo(currentTitle)
  const { data, loading } = useRequest(fetchEliteTopics, { ready: enabled })

  const target = useMemo(
    () => data?.list.find((topic) => isTrumpQuestion(topic.title)),
    [data],
  )

  if (!enabled) return null

  return (
    <ProCard
      title={
        <Space>
          <BulbOutlined />
          <span>Question emerged from this deliberation</span>
        </Space>
      }
      data-testid="emergent-question-card"
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="The infrastructure proposal creates a new governance question"
          description="Ethikos can preserve the original discussion while opening a distinct question whose relevant expertise mix may be different."
        />

        {target ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space wrap>
              <Tag color="purple">DEMO FICTION</Tag>
              <Tag>New question</Tag>
            </Space>

            <Text strong>{target.title}</Text>

            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              data-testid="open-emergent-question"
              onClick={() => router.push(`/ethikos/deliberate/${target.id}`)}
            >
              Open question
            </Button>
          </Space>
        ) : (
          <Button loading={loading} disabled>
            Finding linked question…
          </Button>
        )}
      </Space>
    </ProCard>
  )
}