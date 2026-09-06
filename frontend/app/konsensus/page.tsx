// FILE: frontend/app/konsensus/page.tsx
// app/konsensus/page.tsx
import { Suspense } from 'react';

import MainLayout from '@/components/layout-components/MainLayout';
import { PollPage } from '@/modules/konsensus/pages';

/**
 * /konsensus – Konsensus Center entry route.
 * Wraps the Konsensus poll page in the global MainLayout and
 * provides a Suspense boundary for hooks like useSearchParams.
 */
export default function KonsensusPage() {
  return (
    <Suspense fallback={null}>
      <MainLayout>
        <PollPage />
      </MainLayout>
    </Suspense>
  );
}
