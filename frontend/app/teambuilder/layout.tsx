// FILE: frontend/app/teambuilder/layout.tsx
'use client';

import { Layout } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { type ReactNode, Suspense, useEffect } from 'react';

import MainLayout from '@/components/layout-components/MainLayout';
import Loading from '@/components/Loading';

const { Content } = Layout;

interface SegmentLayoutProps {
  children: ReactNode;
}

/**
 * Inner shell that *defaults* the sidebar to "teambuilder" via ?sidebar=teambuilder
 * when the query param is missing.
 *
 * Important:
 * - If ?sidebar is already set (ekoh, ethikos, …), it is respected.
 *   This lets the module switcher (LogoTitle) change suites even while you are
 *   on a /teambuilder/* URL.
 */
function TeamBuilderShell({ children }: SegmentLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const currentSidebar = searchParams.get('sidebar');

    // Only inject the default if the param is absent.
    // Do NOT override if the user explicitly chose another suite.
    if (currentSidebar !== null) return;

    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('sidebar', 'teambuilder');

    // Preserve current hash if present (client-only)
    const hash =
      typeof window !== 'undefined' && window.location?.hash
        ? window.location.hash
        : '';

    router.replace(`${pathname}?${params.toString()}${hash}`);
  }, [router, pathname, searchParams]);

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}

/**
 * Segment layout for all /teambuilder/* pages.
 *
 * - Wraps content in MainLayout (global Ant Design layout + navigation).
 * - Ensures the Team Builder suite is active by default in the sidebar.
 * - Provides an Ant Design–based Suspense fallback while children load.
 */
export default function SegmentLayout({ children }: SegmentLayoutProps) {
  return (
    <Suspense
      fallback={
        <Layout style={{ minHeight: '100vh' }}>
          <Content
            style={{
              padding: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loading fullscreen message="Loading Team Builder…" />
          </Content>
        </Layout>
      }
    >
      <TeamBuilderShell>{children}</TeamBuilderShell>
    </Suspense>
  );
}
