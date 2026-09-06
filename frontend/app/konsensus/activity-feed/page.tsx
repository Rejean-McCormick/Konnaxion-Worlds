// FILE: frontend/app/konsensus/activity-feed/page.tsx
import React, { Suspense } from 'react';

import MainLayout from '@/components/layout-components/MainLayout';

import KonsensusActivityFeedClient from './ActivityFeedClient';

// Optional if you want to force dynamic rendering
// export const dynamic = 'force-dynamic';

export default function KonsensusActivityFeedPage() {
  return (
    <Suspense fallback={null}>
      <MainLayout>
        <KonsensusActivityFeedClient />
      </MainLayout>
    </Suspense>
  );
}
