// FILE: frontend/app/search/page.tsx
import { Spin } from 'antd';
import React, { Suspense } from 'react';

import MainLayout from '@/components/layout-components/MainLayout';

import GlobalSearchClient from './GlobalSearchClient';

// Prevent static prerender issues for this page
export const dynamic = 'force-dynamic';

export default function GlobalSearchPage() {
  return (
    <MainLayout>
      {/* Suspense wraps the client component that uses useSearchParams */}
      <Suspense
        fallback={
          <div
            style={{
              padding: '40px 0',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Spin size="large" />
          </div>
        }
      >
        <GlobalSearchClient />
      </Suspense>
    </MainLayout>
  );
}
