// FILE: frontend/app/ekoh/layout.tsx
import React, { Suspense } from 'react'

import MainLayout from '@/components/layout-components/MainLayout'

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <MainLayout>{children}</MainLayout>
    </Suspense>
  )
}