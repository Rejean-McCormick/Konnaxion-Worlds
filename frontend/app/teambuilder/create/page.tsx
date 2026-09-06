// frontend/app/teambuilder/create/page.tsx
import { Spin } from 'antd';
import React, { Suspense } from 'react';

import CreateSessionClient from './CreateSessionClient';

// Avoid static pre-render issues when using useSearchParams in the shell
export const dynamic = 'force-dynamic';

export default function CreateSessionPage() {
  return (
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
      <CreateSessionClient />
    </Suspense>
  );
}
