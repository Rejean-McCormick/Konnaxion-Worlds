// FILE: frontend/shared/services/admin.ts
// shared/services/admin.ts

import { HttpError } from "../errors";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
}

export interface ModerationItem {
  id: string;
  type: string;
  content: string;
  reason: string;
  userId: string;
  createdAt: string;
}

const ADMIN_API_BASE = "/_api/admin";

/**
 * Small helper to call the internal Next.js admin API and
 * normalize errors into HttpError for the UI layer.
 */
async function requestJson<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      // ignore JSON parse errors for non‑JSON responses
    }

    throw new HttpError("Admin service request failed", {
      statusCode: res.status,
      data,
    });
  }

  return (await res.json()) as T;
}

/**
 * Fetch high‑level user statistics for the global admin console.
 * Backed by GET /_api/admin/stats.
 */
export async function getAdminStats(): Promise<AdminStats> {
  return requestJson<AdminStats>(`${ADMIN_API_BASE}/stats`);
}

/**
 * Fetch the moderation queue for the global admin console.
 * Backed by GET /_api/admin/moderation.
 */
export async function getModerationQueue(): Promise<ModerationItem[]> {
  return requestJson<ModerationItem[]>(`${ADMIN_API_BASE}/moderation`);
}
