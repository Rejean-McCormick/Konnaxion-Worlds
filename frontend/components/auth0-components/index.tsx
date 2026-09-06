// FILE: frontend/components/auth0-components/index.tsx
'use client';

/**
 * Description: Auth0 component which manages authentication and admin authorization
 * Author: Hieu Chu
 */

import * as Auth0 from '@auth0/auth0-spa-js';
import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { normalizeError } from '../../shared/errors';

const DEFAULT_REDIRECT_CALLBACK = () =>
  window.history.replaceState({}, document.title, window.location.pathname);

type Nullable<T> = T | null;

interface Auth0ContextValue {
  isAuthenticated: boolean;
  user: Nullable<Auth0.User>;
  loading: boolean;
  popupOpen: boolean;
  loginWithPopup: (params?: Auth0.PopupLoginOptions) => Promise<void>;
  handleRedirectCallback: () => Promise<void>;
  getIdTokenClaims: () => Promise<Auth0.IdToken | undefined>;
  loginWithRedirect: (p?: Auth0.RedirectLoginOptions) => Promise<void>;
  getTokenSilently: (p?: Auth0.GetTokenSilentlyOptions) => Promise<string>;
  getTokenWithPopup: (p?: Auth0.GetTokenWithPopupOptions) => Promise<string | undefined>;
  logout: (p?: Auth0.LogoutOptions) => void;
}

const Auth0Context = createContext<Auth0ContextValue | undefined>(undefined);

export const useAuth0 = (): Auth0ContextValue => {
  const ctx = useContext(Auth0Context);
  if (!ctx) throw new Error('useAuth0 must be used within <Auth0Provider>');
  return ctx;
};

type Auth0ProviderProps = {
  children: ReactNode;
  onRedirectCallback?: (appState?: unknown) => void;
} & Auth0.Auth0ClientOptions;

export const Auth0Provider: React.FC<Auth0ProviderProps> = ({
  children,
  onRedirectCallback = DEFAULT_REDIRECT_CALLBACK,
  ...initOptions
}) => {
  const [auth0Client, setAuth0Client] = useState<Auth0.Auth0Client | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<Auth0.User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [popupOpen, setPopupOpen] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const initAuth0 = async () => {
      try {
        const client = await Auth0.createAuth0Client({
          ...initOptions,
          // Ensure redirect_uri exists unless explicitly provided
          authorizationParams: {
            redirect_uri: window.location.origin,
            ...(initOptions.authorizationParams ?? {}),
          },
        });
        if (!mounted) return;
        setAuth0Client(client);

        // Handle redirect callback if returning from Auth0
        if (
          typeof window !== 'undefined' &&
          window.location.search.includes('code=') &&
          window.location.search.includes('state=')
        ) {
          const { appState } = await client.handleRedirectCallback();
          onRedirectCallback?.(appState);
        }

        const authenticated = await client.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const u = await client.getUser();
          setUser(u ?? null);
        }
      } catch (e: unknown) {
        const { message } = normalizeError(e);
        // Keep surface minimal; log for diagnostics
         
        console.error('[Auth0] init failed:', message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void initAuth0();
    return () => {
      mounted = false;
    };
    // initOptions is stable in practice; if it changes, re-init intentionally
     
  }, []);

  const loginWithPopup = useCallback(
    async (params?: Auth0.PopupLoginOptions) => {
      if (!auth0Client) return;
      setPopupOpen(true);
      try {
        await auth0Client.loginWithPopup(params);
        const u = await auth0Client.getUser();
        setUser(u ?? null);
        setIsAuthenticated(true);
      } catch (error: unknown) {
        const { message, statusCode } = normalizeError(error);
         
        console.error('[Auth0] loginWithPopup failed:', statusCode, message);
      } finally {
        setPopupOpen(false);
      }
    },
    [auth0Client]
  );

  const handleRedirectCallback = useCallback(async () => {
    if (!auth0Client) return;
    setLoading(true);
    try {
      await auth0Client.handleRedirectCallback();
      const u = await auth0Client.getUser();
      setIsAuthenticated(true);
      setUser(u ?? null);
    } finally {
      setLoading(false);
    }
  }, [auth0Client]);

  const getIdTokenClaims = useCallback(async () => {
    if (!auth0Client) throw new Error('Auth0 client not initialized');
    return auth0Client.getIdTokenClaims();
  }, [auth0Client]);

  const loginWithRedirect = useCallback(
    async (p?: Auth0.RedirectLoginOptions) => {
      if (!auth0Client) throw new Error('Auth0 client not initialized');
      await auth0Client.loginWithRedirect(p);
    },
    [auth0Client]
  );

  const getTokenSilently = useCallback(
    async (p?: Auth0.GetTokenSilentlyOptions) => {
      if (!auth0Client) throw new Error('Auth0 client not initialized');
      return auth0Client.getTokenSilently(p);
    },
    [auth0Client]
  );

  const getTokenWithPopup = useCallback(
    async (p?: Auth0.GetTokenWithPopupOptions) => {
      if (!auth0Client) throw new Error('Auth0 client not initialized');
      return auth0Client.getTokenWithPopup(p);
    },
    [auth0Client]
  );

  const logout = useCallback(
    (p?: Auth0.LogoutOptions) => {
      if (!auth0Client) return;
      auth0Client.logout({
        logoutParams: {
          returnTo: window.location.origin,
          ...(p?.logoutParams ?? {}),
        },
        ...p,
      });
    },
    [auth0Client]
  );

  const value: Auth0ContextValue = {
    isAuthenticated,
    user,
    loading,
    popupOpen,
    loginWithPopup,
    handleRedirectCallback,
    getIdTokenClaims,
    loginWithRedirect,
    getTokenSilently,
    getTokenWithPopup,
    logout,
  };

  return <Auth0Context.Provider value={value}>{children}</Auth0Context.Provider>;
};
