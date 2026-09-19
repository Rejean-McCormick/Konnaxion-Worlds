'use client';

import React from 'react';

/** Standalone provider boundary for Konnaxion Worlds. */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
