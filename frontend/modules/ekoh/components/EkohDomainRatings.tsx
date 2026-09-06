'use client'

import { Empty, List, Progress, Space, Tag, Typography } from 'antd'

import type { EkohExpertiseScore } from '@/services/ekoh'

const { Text } = Typography

function pct(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 100)))
}

export default function EkohDomainRatings({
  ratings,
  title = 'EkoH expertise by domain',
}: {
  ratings: EkohExpertiseScore[] | null
  title?: string
}): JSX.Element {
  if (ratings === null) {
    return <Empty description="Domain ratings are not available in your current access scope." />
  }

  return (
    <List
      header={<Text strong>{title}</Text>}
      dataSource={ratings}
      locale={{ emptyText: 'No EkoH domain rating is available.' }}
      renderItem={(item) => (
        <List.Item key={item.domainCode}>
          <div style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <Space wrap>
                <Text strong>{item.domainName}</Text>
                <Tag>{item.domainCode}</Tag>
              </Space>
              <Text>{pct(item.weightedScore)}%</Text>
            </Space>
            <Progress percent={pct(item.weightedScore)} showInfo={false} />
          </div>
        </List.Item>
      )}
    />
  )
}
