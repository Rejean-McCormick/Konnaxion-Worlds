// FILE: frontend/services/user.ts
// frontend/services/user.ts
// Wrapper around /api/users/me/ + helpers for avatar_url

import { get, patch } from './_request';

/**
 * Shape returned by /api/users/me/.
 * Backend will be extended to include avatar_url.
 */
export interface CurrentUser {
  username: string;
  name: string | null;
  /** Optional, depending on how the backend serializer is configured */
  email?: string | null;
  url: string;
  /** Absolute or relative URL to the user’s avatar image */
  avatar_url?: string | null;
}

/**
 * Resolve the backend base the same way the rest of the app does.
 *
 * Cases we want to support:
 * - NEXT_PUBLIC_API_BASE = undefined           → use `/api` (Next proxy)
 * - NEXT_PUBLIC_API_BASE = http://:8000       → direct backend origin
 * - NEXT_PUBLIC_API_BASE = http://:8000/api   → API under /api, media under /media
 */
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

let MEDIA_BASE: string;
if (API_BASE === '/api') {
  // Dev: we go through Next proxy, so /api/media → http://localhost:8000/media
  MEDIA_BASE = '/api';
} else if (API_BASE.endsWith('/api')) {
  // Typical Django: API at /api/*, media at /media/*
  MEDIA_BASE = API_BASE.slice(0, -4); // drop trailing "/api"
} else {
  // Backend already points at the site root (media also lives there)
  MEDIA_BASE = API_BASE;
}

/**
 * Default avatar used when no avatar_url is provided by the backend.
 * File path on the backend:
 *   /media/kreative/artworks/default_profile.png
 */
export const DEFAULT_AVATAR_URL = `${MEDIA_BASE}/media/kreative/artworks/default_profile.png`;

/**
 * Fetch the authenticated user via /api/users/me/.
 * This uses the global NEXT_PUBLIC_API_BASE from services/_request.
 */
export async function fetchCurrentUser(): Promise<CurrentUser> {
  return get<CurrentUser>('users/me/');
}

/**
 * Normalize anything the backend sends in avatar_url into a URL
 * that the browser can actually load.
 */
function normalizeAvatarUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const src = raw.trim();
  if (!src) return null;

  // Already absolute (http/https) or data/blob URLs → use as‑is
  if (
    /^(https?:)?\/\//i.test(src) ||
    /^data:/i.test(src) ||
    /^blob:/i.test(src)
  ) {
    return src;
  }

  // Special‑case: backend (or old frontend) already prefixed with /api/media/…
  if (src.startsWith('/api/media/')) {
    const rest = src.slice('/api'.length); // "/media/…"
    return `${MEDIA_BASE}${rest}`;
  }

  // Generic /api/... path: if we have a real host in API_BASE, attach it
  if (src.startsWith('/api/')) {
    if (API_BASE === '/api') {
      // Still using Next proxy → keep as‑is
      return src;
    }
    const rest = src.slice('/api'.length); // "/something"
    return `${API_BASE}${rest}`;
  }

  // Root‑relative path from the backend (e.g. "/media/…")
  if (src.startsWith('/')) {
    return `${MEDIA_BASE}${src}`;
  }

  // Fallback: treat as relative to the media root (e.g. "kreative/…")
  return `${MEDIA_BASE}/${src}`;
}

/**
 * Helper that always returns a usable avatar URL.
 * If the user has no avatar_url yet, we fall back to DEFAULT_AVATAR_URL.
 */
export function resolveAvatarUrl(
  user: Pick<CurrentUser, 'avatar_url'> | null | undefined,
): string {
  const normalized = normalizeAvatarUrl(user?.avatar_url);
  return normalized ?? DEFAULT_AVATAR_URL;
}

/**
 * Update the writable display name through the canonical user detail endpoint.
 * The current serializer does not expose avatar/security/preferences writes.
 */
export async function updateCurrentUserName(
  username: string,
  name: string,
): Promise<CurrentUser> {
  return patch<CurrentUser, { name: string }>(
    `users/${encodeURIComponent(username)}/`,
    { name },
  );
}
