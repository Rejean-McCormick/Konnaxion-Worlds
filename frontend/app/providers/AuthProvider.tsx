// FILE: frontend/app/providers/AuthProvider.tsx
// app/providers/AuthProvider.tsx
'use client';

import React from 'react';

/**
 * Auth provider wrapper for App Router.
 * No SDK import needed — Auth0 sessions are handled by middleware.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
