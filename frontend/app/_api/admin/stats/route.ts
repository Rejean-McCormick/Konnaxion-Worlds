// FILE: frontend/app/_api/admin/stats/route.ts
import { NextResponse } from 'next/server';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
}

interface UsageReport {
  labels: string[];
  mau: number[];
  projects?: number[];
  docs?: number[];
}

const FALLBACK_STATS: AdminStats = {
  totalUsers: 1234,
  activeUsers: 567,
  newUsers: 89,
};

// Same default window as the Insights "Usage" report.
const USAGE_QUERY = '?range=30d&grouping=day';

// Base URL for the backend (matches how the rest of the app calls it)
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

/**
 * Build the absolute URL for the usage report on the analytics backend.
 * This mirrors how the insights hooks call `/reports/usage`.
 */
function buildUsageUrl(): string {
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}/reports/usage${USAGE_QUERY}`;
}

/**
 * Fetches the usage report from the analytics backend.
 * If anything goes wrong, returns null so the caller can fall back
 * to static placeholder values.
 */
async function fetchUsageReport(): Promise<UsageReport | null> {
  try {
    const url = buildUsageUrl();

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      // This is an admin dashboard metric; we want fresh data.
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as UsageReport;

    if (!data || !Array.isArray(data.mau)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Derives simple admin-friendly stats from the usage report:
 * - totalUsers  = max MAU over the window (rough upper bound)
 * - activeUsers = last MAU point
 * - newUsers    = positive delta between last and previous MAU point
 */
function deriveAdminStats(report: UsageReport): AdminStats {
  const series = Array.isArray(report.mau) ? report.mau : [];

  if (series.length === 0) {
    // If the report is empty, keep the previous placeholder behavior.
    return { ...FALLBACK_STATS };
  }

  let totalUsers = 0;
  for (const value of series) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      if (value > totalUsers) {
        totalUsers = value;
      }
    }
  }

  const last = series[series.length - 1];
  const prev = series.length > 1 ? series[series.length - 2] : last;

  const activeUsers =
    typeof last === 'number' && Number.isFinite(last) ? last : 0;

  const prevValue =
    typeof prev === 'number' && Number.isFinite(prev) ? prev : activeUsers;

  const newUsers = Math.max(activeUsers - prevValue, 0);

  return { totalUsers, activeUsers, newUsers };
}

export async function GET() {
  const report = await fetchUsageReport();
  const stats = report ? deriveAdminStats(report) : FALLBACK_STATS;

  return NextResponse.json<AdminStats>(stats, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
