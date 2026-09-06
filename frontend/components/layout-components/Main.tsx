// FILE: frontend/components/layout-components/Main.tsx
// components/layout-components/Main.tsx
'use client'

import { Layout } from 'antd'
import type { ComponentProps, ReactNode } from 'react'
import styled, { css } from 'styled-components'

const StyledMain = styled(
  ({ collapsed: _c, ...rest }: { collapsed?: boolean } & ComponentProps<typeof Layout>) => (
    <Layout {...rest} />
  ),
)<{ collapsed: boolean }>`
  transition: 0.2s all;

  /* décalage = largeur réelle du sider (ouvert) */
  margin-left: 256px;

  background: var(--ant-color-bg-layout);

  /* décalage quand le sider est réduit */
  ${({ collapsed }) =>
    collapsed &&
    css`
      margin-left: 80px;
    `}

  @media (max-width: 575.98px) {
    margin-left: 0;
  }
`

export default function Main({
  children,
  collapsed,
}: {
  children: ReactNode
  collapsed: boolean
}) {
  return <StyledMain collapsed={collapsed}>{children}</StyledMain>
}
