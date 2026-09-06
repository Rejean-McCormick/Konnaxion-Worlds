// FILE: frontend/lib/api-client.ts
// lib/api-client.ts
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

const API_BASE = RAW_API_BASE.replace(/\/+$/, '/'); // ensure trailing slash

function buildUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  return `${API_BASE}${cleanPath}`;
}

/**
 * Simple GET helper that includes cookies for Django session auth.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'GET',
    credentials: 'include', // <-- IMPORTANT: send session cookie
  });

  if (!res.ok) {
    // For 401/403, throw so React Query treats as "not logged in"
    throw new Error(`GET ${path} failed with status ${res.status}`);
  }

  return (await res.json()) as T;
}
