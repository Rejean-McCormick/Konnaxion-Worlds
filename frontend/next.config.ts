// next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

import { env } from './env.mjs';

const DEFAULT_API_PROXY_BASE =
  process.env.NODE_ENV === 'production'
    ? 'https://konnaxion.com/api'
    : 'http://localhost:8000/api';

const API_PROXY_BASE = (
  process.env.API_PROXY_BASE ??
  process.env.INTERNAL_API_BASE ??
  DEFAULT_API_PROXY_BASE
).replace(/\/+$/, '');

const baseConfig: NextConfig = {
  reactStrictMode: true,
  compiler: { styledComponents: true },
  logging: { fetches: { fullUrl: true } },

  // TEMP : ne bloque pas la build sur les erreurs ESLint
  // (remets à false quand le lint sera corrigé)
  eslint: { ignoreDuringBuilds: true },

  async rewrites() {
    return [
      { source: '/healthz', destination: '/_api/health' },
      { source: '/api/healthz', destination: '/_api/health' },
      { source: '/health', destination: '/_api/health' },
      { source: '/ping', destination: '/_api/health' },

      // Browser code should call /api/*.
      // Next rewrites /api/* to the server-only backend proxy base.
      //
      // Local:
      //   API_PROXY_BASE=http://localhost:8000/api
      //
      // Capsule/runtime:
      //   API_PROXY_BASE=http://django-api:8000/api
      //
      // Keep NEXT_PUBLIC_API_BASE for browser code only.
      { source: '/api/:path*', destination: `${API_PROXY_BASE}/:path*/` },
    ];
  },
};

const withAnalyzer = withBundleAnalyzer({ enabled: env.ANALYZE });

export default env.ANALYZE ? withAnalyzer(baseConfig) : baseConfig;