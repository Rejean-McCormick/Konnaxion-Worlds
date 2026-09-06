
// FILE: frontend/app/ethikos/layout.tsx
// app/ethikos/layout.tsx
'use client'

import { App as AntdApp } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import React, { Suspense, useEffect, useMemo } from 'react'

import MainLayout from '@/components/layout-components/MainLayout'
import Loading from '@/components/Loading'

interface SegmentLayoutProps {
  children: ReactNode
}

/**
 * Inner shell that defaults the active suite to Ethikos via ?sidebar=ethikos
 * only when the query param is absent.
 *
 * Important:
 * - If ?sidebar is already set, it is respected.
 * - The current URL hash is preserved.
 * - The Ant Design <App /> provider is mounted here so page-level
 *   App.useApp() hooks can safely use message / modal / notification.
 */
function EthikosShell({ children }: SegmentLayoutProps): JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const searchString = searchParams.toString()
  const currentSidebar = searchParams.get('sidebar')

  const nextUrl = useMemo(() => {
    if (currentSidebar !== null) return null

    const params = new URLSearchParams(searchString)
    params.set('sidebar', 'ethikos')

    const query = params.toString()
    const hash =
      typeof window !== 'undefined' && window.location.hash
        ? window.location.hash
        : ''

    return query ? `${pathname}?${query}${hash}` : `${pathname}${hash}`
  }, [currentSidebar, pathname, searchString])

  useEffect(() => {
    if (!nextUrl) return
    router.replace(nextUrl)
  }, [nextUrl, router])

  return (
    <MainLayout>
      <AntdApp>{children}</AntdApp>
    </MainLayout>
  )
}

/**
 * Segment layout for all /ethikos/* pages.
 *
 * - Wraps content in MainLayout (global shell + navigation)
 * - Defaults the Ethikos suite in the sidebar when missing
 * - Provides Ant Design App context for message/modal/notification APIs
 * - Uses a lightweight fullscreen Suspense fallback
 */
export default function SegmentLayout({
  children,
}: SegmentLayoutProps): JSX.Element {
  return (
    <Suspense fallback={<Loading fullscreen message="Loading ethiKos…" />}>
      <EthikosShell>{children}</EthikosShell>
    </Suspense>
  )
}
