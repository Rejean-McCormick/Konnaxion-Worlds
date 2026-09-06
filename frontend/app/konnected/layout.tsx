// FILE: frontend/app/konnected/layout.tsx
// app/konnected/layout.tsx
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
 * Inner shell that *defaults* the sidebar to "konnected" via ?sidebar=konnected
 * when the query param is missing.
 *
 * Important:
 * - If ?sidebar is already set (ekoh, ethikos, kreative, …), it is respected.
 *   This lets the module switcher (LogoTitle) change suites even while you are
 *   on a /konnected/* URL.
 */
function KonnectedShell({ children }: SegmentLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const currentSidebar = searchParams.get('sidebar')

    // Only inject the default if the param is absent.
    // Do NOT override if the user explicitly chose another suite.
    if (currentSidebar !== null) return

    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('sidebar', 'konnected')

    router.replace(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return <MainLayout>{children}</MainLayout>
}

/**
 * Segment layout for all /konnected/* pages.
 *
 * - Wraps content in MainLayout (global Ant Design layout + navigation).
 * - Provides an Ant Design–based Suspense fallback while children load.
 * - Keeps page-level layout concerns in KonnectedPageShell (used by pages themselves).
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
      <KonnectedShell>{children}</KonnectedShell>
    </Suspense>
  )
}
