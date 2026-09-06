// lib/auth0.ts
import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const AUTH0_ENABLED =
  (
    process.env.AUTH0_ENABLED ??
    process.env.NEXT_PUBLIC_AUTH0_ENABLED ??
    'false'
  ).toLowerCase() === 'true';

export const auth0 = AUTH0_ENABLED ? new Auth0Client() : null;