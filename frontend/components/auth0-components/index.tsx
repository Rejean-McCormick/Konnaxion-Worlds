'use client';

import React, { createContext, type ReactNode, useContext } from 'react';

export type WorldsIdentity = {
  sub: string;
  name?: string;
  email?: string;
};

type IdentityContextValue = {
  isAuthenticated: boolean;
  user: WorldsIdentity | null;
  loading: boolean;
};

const IdentityContext = createContext<IdentityContextValue>({
  isAuthenticated: false,
  user: null,
  loading: false,
});

/**
 * Compatibility surface kept at the old path while Konnaxion Worlds owns its
 * authentication boundary.  No Auth0 SDK or sibling-application helper is used.
 */
export const useAuth0 = () => useContext(IdentityContext);

export function Auth0Provider({
  children,
  user = null,
}: {
  children: ReactNode;
  user?: WorldsIdentity | null;
}) {
  return (
    <IdentityContext.Provider
      value={{ isAuthenticated: Boolean(user), user, loading: false }}
    >
      {children}
    </IdentityContext.Provider>
  );
}
