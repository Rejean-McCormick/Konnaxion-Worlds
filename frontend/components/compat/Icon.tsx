// FILE: frontend/components/compat/Icon.tsx
// components/compat/Icon.tsx
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  LikeOutlined,
  LoadingOutlined,
  MessageOutlined,
  PlusOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import React from 'react'

const MAP: Record<string, React.ElementType> = {
  delete: DeleteOutlined,
  edit: EditOutlined,
  like: LikeOutlined,
  message: MessageOutlined,
  loading: LoadingOutlined,
  plus: PlusOutlined,
  'info-circle': InfoCircleOutlined,
  warning: WarningOutlined,
  'arrow-right': ArrowRightOutlined,
  'arrow-left': ArrowLeftOutlined,
}

type Props = { type: string } & React.HTMLAttributes<HTMLSpanElement>

export default function Icon({ type, ...rest }: Props) {
  const C = MAP[type] ?? InfoCircleOutlined
  return <C {...rest} />
}
