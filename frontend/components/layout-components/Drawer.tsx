// FILE: frontend/components/layout-components/Drawer.tsx
// C:\MyCode\Konnaxionv14\frontend\components\layout-components\Drawer.tsx
'use client'

import { Drawer } from 'antd'
import React from 'react'
import styled from 'styled-components'

/* ------------------------------------------------------------------ */
/*  Themed layout drawer: respects CSS vars and prevents body scroll  */
/* ------------------------------------------------------------------ */
const StyledDrawer = styled(Drawer)`
  .ant-drawer-wrapper-body {
    overflow: hidden !important;
  }

  .ant-drawer-content {
    background: var(--ant-color-bg-container) !important;
    color: var(--ant-color-text);
  }
`

interface Props {
  drawerVisible: boolean
  closeDrawer: () => void
  children: React.ReactNode
  /** Optional placement override; defaults to left to match existing layout */
  placement?: 'left' | 'right' | 'top' | 'bottom'
  /** Optional width override; falls back to Ant Design default when omitted */
  width?: number | string
}

export default function LayoutDrawer({
  drawerVisible,
  closeDrawer,
  children,
  placement = 'left',
  width,
}: Props) {
  return (
    <StyledDrawer
      placement={placement}
      closable={false}
      onClose={closeDrawer}
      open={drawerVisible}
      width={width}
      styles={{
        body: {
          margin: 0,
          padding: 0,
          background: 'var(--ant-color-bg-container)',
        },
      }}
    >
      {children}
    </StyledDrawer>
  )
}
