// FILE: frontend/app/_api/admin/moderation/route.ts
import { NextResponse } from 'next/server'

type ReportType = 'Spam' | 'Harassment' | 'Misinformation'
type ReportStatus = 'Pending' | 'Resolved'

export interface Report {
  id: string
  content: string
  reporter: string
  type: ReportType
  status: ReportStatus
}

export interface ModerationPayload {
  items: Report[]
}

function hasReportItems(value: unknown): value is { items: Report[] } {
  if (typeof value !== 'object' || value === null || !('items' in value)) {
    return false
  }

  return Array.isArray((value as { items?: unknown }).items)
}

/**
 * Resolve the backend base URL in the same spirit as services/_request.ts.
 * In practice, NEXT_PUBLIC_API_BASE should be something like
 *   http://localhost:8000/api
 * or the public API root for your Django backend.
 */
function resolveApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
  // Normalize to avoid trailing slash issues when concatenating paths
  return raw.replace(/\/+$/, '')
}

export async function GET() {
  const apiBase = resolveApiBase()
  const url = `${apiBase}/admin/moderation`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      // Ensure we always hit the live queue, not a cached copy
      cache: 'no-store',
    })

    if (res.ok) {
      const raw = await res.json()

      // Normalise shape to ModerationPayload:
      // - if backend already returns { items: [...] }, use it as‑is
      // - if backend returns a bare array, wrap it
      let payload: ModerationPayload

      if (Array.isArray(raw)) {
        payload = { items: raw as Report[] }
      } else if (hasReportItems(raw)) {
        payload = { items: raw.items }
      } else {
        payload = { items: [] }
      }

      return NextResponse.json<ModerationPayload>(payload, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    // Backend responded but with an error status
    return NextResponse.json(
      {
        error: 'Failed to fetch moderation queue from backend.',
        statusCode: res.status,
      },
      {
        status: res.status,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch {
    // Fallback: deterministic stub, matching ModerationPayload
    const fallback: ModerationPayload = {
      items: [
        {
          id: 'stub-1',
          content: 'Example content flagged for potential harassment.',
          reporter: 'alice@example.com',
          type: 'Harassment',
          status: 'Pending',
        },
        {
          id: 'stub-2',
          content: 'Example spam message that has already been resolved.',
          reporter: 'moderation-bot',
          type: 'Spam',
          status: 'Resolved',
        },
      ],
    }

    return NextResponse.json<ModerationPayload>(fallback, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Konnaxion-Moderation-Mode': 'mock',
      },
    })
  }
}
