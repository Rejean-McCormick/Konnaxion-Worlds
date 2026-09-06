// FILE: frontend/app/konsensus/leaderboards/page.tsx
import React, { Suspense } from 'react';

import MainLayout from '@/components/layout-components/MainLayout';

import LeaderboardsClient from './LeaderboardsClient';

// Optional: if you want to force dynamic rendering (not strictly required)
// export const dynamic = 'force-dynamic';

export default function KonsensusLeaderboardsPage() {
  return (
    <Suspense fallback={null}>
      <MainLayout>
        <LeaderboardsClient />
      </MainLayout>
    </Suspense>
  );
}
