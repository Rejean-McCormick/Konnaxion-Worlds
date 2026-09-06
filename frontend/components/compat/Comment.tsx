// FILE: frontend/components/compat/Comment.tsx
// components/compat/Comment.tsx
import { List, Typography } from 'antd'
import React from 'react'

type Props = {
  author?: React.ReactNode
  avatar?: React.ReactNode
  content?: React.ReactNode
  datetime?: React.ReactNode
  className?: string
  actions?: React.ReactNode[]
}

export default function Comment({ author, avatar, content, datetime, className, actions }: Props) {
  return (
    <List.Item className={className} actions={actions}>
      <List.Item.Meta
        avatar={avatar}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{author}</span>
            {datetime ? <Typography.Text type="secondary">{datetime}</Typography.Text> : null}
          </div>
        }
        description={content}
      />
    </List.Item>
  )
}
