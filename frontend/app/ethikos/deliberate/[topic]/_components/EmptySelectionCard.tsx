'use client'

import { Card, Empty } from 'antd'

export default function EmptySelectionCard({
  title,
  description,
}: {
  title: string
  description: string
}): JSX.Element {
  return (
    <Card size="small" title={title}>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
    </Card>
  )
}
