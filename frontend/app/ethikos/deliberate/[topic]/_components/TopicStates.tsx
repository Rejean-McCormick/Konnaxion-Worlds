'use client'

import { PageContainer } from '@ant-design/pro-components'
import { Card, Empty, Space, Spin, Typography } from 'antd'

const { Text } = Typography

export function TopicLoadingState(): JSX.Element {
  return (
    <PageContainer ghost>
      <Card>
        <Space>
          <Spin />
          <Text type="secondary">Loading deliberation thread…</Text>
        </Space>
      </Card>
    </PageContainer>
  )
}

export function TopicErrorState({
  description,
}: {
  description: string
}): JSX.Element {
  return (
    <PageContainer ghost>
      <Empty description={description} />
    </PageContainer>
  )
}
