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
 * Temporary sidebar target for /reports/*
 *
 * Current state:
 * - Docs treat Reports / Insights as its own module.
 * - MainLayout may still only know the existing suite keys.
 *
 * Strategy:
 * - If/when MainLayout supports "reports", set:
 *     NEXT_PUBLIC_REPORTS_SIDEBAR=reports
 * - Until then, fallback to "kontrol" so menus remain stable.
 */
const DEFAULT_REPORTS_SIDEBAR =
  process.env.NEXT_PUBLIC_REPORTS_SIDEBAR === 'reports'
    ? 'reports'
    : 'kontrol';

function ReportsShell({ children }: SegmentLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sidebarParam = searchParams.get('sidebar');
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    // Respect an explicit sidebar choice.
    if (sidebarParam !== null) return;

    const params = new URLSearchParams(searchParamsString);
    params.set('sidebar', DEFAULT_REPORTS_SIDEBAR);

    router.replace(`${pathname}?${params.toString()}`);
  }, [router, pathname, sidebarParam, searchParamsString]);

  return <MainLayout>{children}</MainLayout>;
}

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
      <ReportsShell>{children}</ReportsShell>
    </Suspense>
  );
}