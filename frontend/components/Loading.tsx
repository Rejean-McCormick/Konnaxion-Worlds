// FILE: frontend/components/Loading.tsx
// C:\MyCode\Konnaxionv14\frontend\components\Loading.tsx
'use client';

import { Spin } from 'antd';

export type LoadingProps = {
  /** If true, centers the spinner in the viewport for route-level usage */
  fullscreen?: boolean;
  /** Optional helper text shown under the spinner */
  message?: string;
};

export default function Loading({
  fullscreen = false,
  message,
}: LoadingProps) {
  const style = fullscreen
    ? {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
    : {
      padding: 24,
      textAlign: 'center' as const,
    };

  return (
    <div style={style} aria-busy="true" aria-live="polite">
      <Spin size={fullscreen ? 'large' : 'default'} />
      {message ? <div style={{ marginTop: 8 }}>{message}</div> : null}
    </div>
  );
}
