// FILE: frontend/app/keenkonnect/layout.tsx
// app/keenkonnect/layout.tsx
'use client'

import { Layout, Spin } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import React, { Suspense, useEffect } from 'react'

import MainLayout from '@/components/layout-components/MainLayout'

const { Content } = Layout

interface SegmentLayoutProps {
  children: ReactNode
}

/**
 * Inner shell that *defaults* the sidebar to "keenkonnect" via ?sidebar=keenkonnect
 * when the query param is missing.
 *
 * Important:
 * - If ?sidebar is already set (ekoh, ethikos, kreative, …), it is respected.
 *   This lets the module switcher (LogoTitle) change suites even while you are
 *   on a /keenkonnect/* URL.
 */
function KeenKonnectShell({ children }: SegmentLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const currentSidebar = searchParams.get('sidebar')

    // Only inject the default if the param is absent.
    // Do NOT override if the user explicitly chose another suite.
    if (currentSidebar !== null) return

    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('sidebar', 'keenkonnect')

    router.replace(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return <MainLayout>{children}</MainLayout>
}

/**
 * Segment layout for all /keenkonnect/* pages.
 * Reuses the global MainLayout (Ant Design Layout + navigation)
 * and provides an Ant Design–based Suspense fallback.
 */
export default function SegmentLayout({ children }: SegmentLayoutProps) {
  return (
    <Suspense
      fallback={
        <Layout style={{ minHeight: '100vh' }}>
          <Content
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Spin size="large" />
          </Content>
        </Layout>
      }
    >
      <KeenKonnectShell>{children}</KeenKonnectShell>
    </Suspense>
  )
}
