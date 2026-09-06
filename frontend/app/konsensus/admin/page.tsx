// FILE: frontend/app/konsensus/admin/page.tsx
import React, { Suspense } from 'react';

import MainLayout from '@/components/layout-components/MainLayout';

import KonsensusAdminClientPage from './AdminClient';

// Optional: if you want to force fully dynamic rendering
// export const dynamic = 'force-dynamic';

export default function KonsensusAdminPage() {
  return (
    <Suspense fallback={null}>
      <MainLayout>
        <KonsensusAdminClientPage />
      </MainLayout>
    </Suspense>
  );
}
