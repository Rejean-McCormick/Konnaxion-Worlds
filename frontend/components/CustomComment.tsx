// FILE: frontend/components/CustomComment.tsx
'use client'

import { Typography } from 'antd'

export default function CustomComment({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Typography.Text
      type="secondary"
      style={{ fontSize: 'var(--ant-font-size-sm)' }}
    >
      {children}
    </Typography.Text>
  )
}
