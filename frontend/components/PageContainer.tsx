// FILE: frontend/components/PageContainer.tsx
'use client'

import React, { ReactNode } from 'react'
import styled from 'styled-components'

interface PageContainerProps {
  title: string
  children: ReactNode
}

const Container = styled.div`
  padding: var(--ant-space-lg);
  background: var(--ant-color-bg-container);
  color: var(--ant-color-text);
`

const Header = styled.header`
  border-bottom: 1px solid var(--ant-color-split);
  margin-bottom: var(--ant-space-lg);
`

const Title = styled.h1`
  margin: 0;
  color: var(--ant-color-text);
`

export default function PageContainer({
  title,
  children,
}: PageContainerProps) {
  return (
    <Container>
      <Header>
        <Title>{title}</Title>
      </Header>
      <main>{children}</main>
    </Container>
  )
}
