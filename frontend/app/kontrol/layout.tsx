// FILE: frontend/app/kontrol/layout.tsx
'use client';

import { Layout, Spin } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { Suspense, useEffect } from 'react';

import MainLayout from '@/components/layout-components/MainLayout';

const { Content } = Layout;

interface SegmentLayoutProps {
  children: ReactNode;
}

/**
 * Inner shell that *defaults* the sidebar to "kontrol" via ?sidebar=kontrol
 * when the query param is missing.
 *
 * Important:
 * - If ?sidebar is already set (ekoh, ethikos, keenkonnect, konnected, kreative, teambuilder, kontrol, …),
 *   it is respected. This lets the module switcher (LogoTitle) change suites even
 *   while you are on a /kontrol/* URL.
 * - Scope (platform vs module-specific) is handled at page level (KontrolPageShell),
 *   using the route metadata defined in routesKontrol.
 */
function KontrolShell({ children }: SegmentLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Normalise search params for a stable effect dependency
  const sidebarParam = searchParams.get('sidebar');
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    // Only inject the default if the param is absent.
    // Do NOT override if the user explicitly chose another suite.
    if (sidebarParam !== null) return;

    const params = new URLSearchParams(searchParamsString);
    params.set('sidebar', 'kontrol');

    const next = `${pathname}?${params.toString()}`;
    router.replace(next);
  }, [router, pathname, sidebarParam, searchParamsString]);

  return <MainLayout>{children}</MainLayout>;
}

/**
 * Segment layout for all /kontrol/* pages.
 *
 * - Wraps content in MainLayout (global Ant Design layout + navigation).
 * - Provides an Ant Design–based Suspense fallback while children load.
 * - Keeps page-level layout and scope display in KontrolPageShell
 *   (used by individual pages).
 */
export default function SegmentLayout({
  children,
}: SegmentLayoutProps): JSX.Element {
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
      <KontrolShell>{children}</KontrolShell>
    </Suspense>
  );
}
