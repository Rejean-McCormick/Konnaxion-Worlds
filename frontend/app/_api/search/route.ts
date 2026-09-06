import { NextRequest, NextResponse } from 'next/server'

import fs from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

export interface SearchResult {
  id: string
  title: string
  snippet: string
  path: string
}

interface RoutesJsonEntry {
  path: string
}

interface KnowledgeResource {
  id: string | number
  title: string
  description?: string | null
  subject?: string | null
  level?: string | null
  language?: string | null
  url?: string | null
  type?: string | null
  resource_type?: string | null
}

type RawKnowledgeSearchResponse =
  | KnowledgeResource[]
  | {
      results?: KnowledgeResource[]
      items?: KnowledgeResource[]
      count?: number
      total?: number
    }

interface SearchResponseBody {
  results: SearchResult[]
}

const ROUTES_JSON_CANDIDATES = [
  path.join(process.cwd(), 'routes.json'),
  path.join(process.cwd(), 'frontend', 'routes.json'),
] as const

const MAX_RESULTS_PER_SECTION = 5
const MIN_QUERY_LENGTH = 2

const KNOWLEDGE_SEARCH_ENDPOINTS = [
  '/konnected/resources/',
  '/knowledge-resources/',
  '/knowledge/resources/',
] as const

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/+$/, '')

const WORLD_KEY_RE = /^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$/

function resolveWorldKey(request: NextRequest): string | null {
  const explicit = request.nextUrl.searchParams.get('world')?.trim().toLowerCase() ?? ''
  return explicit && WORLD_KEY_RE.test(explicit) ? explicit : null
}

function scopeWorldEndpoint(endpoint: string, worldKey: string | null): string {
  if (!worldKey) return endpoint
  const clean = endpoint.replace(/^\/+/, '')
  return `/w/${worldKey}/${clean}`
}

function toTitleCase(segment: string): string {
  return segment
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function pathToTitle(p: string): string {
  if (p === '/') return 'Home'
  const segments = p.split('/').filter(Boolean)
  if (!segments.length) return 'Home'
  return segments.map(toTitleCase).join(' · ')
}

function buildBackendUrl(endpoint: string, request: NextRequest): string {
  const trimmed = endpoint.trim()
  if (!trimmed) return request.nextUrl.origin
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const base = API_BASE || `${request.nextUrl.origin}/api`
  const normalizedBase = base.replace(/\/+$/, '')
  const normalizedEndpoint = trimmed.startsWith('/') ? trimmed : `/${trimmed}`

  return `${normalizedBase}${normalizedEndpoint}`
}

function normalizeKnowledgeResults(
  raw: RawKnowledgeSearchResponse | null | undefined,
): KnowledgeResource[] {
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw
  }

  const obj = raw as { results?: unknown; items?: unknown }
  if (Array.isArray(obj.results)) return obj.results as KnowledgeResource[]
  if (Array.isArray(obj.items)) return obj.items as KnowledgeResource[]
  return []
}

function buildKnowledgeSnippet(resource: KnowledgeResource): string {
  const parts: string[] = []

  if (resource.subject) parts.push(resource.subject)
  if (resource.level) parts.push(resource.level)
  if (resource.language) parts.push(resource.language)

  if (parts.length > 0) {
    return parts.join(' · ')
  }

  const desc =
    typeof resource.description === 'string'
      ? resource.description.replace(/\s+/g, ' ').trim()
      : ''

  if (desc) {
    return desc.length > 120 ? `${desc.slice(0, 117)}…` : desc
  }

  return 'Learning resource'
}

async function loadRoutes(): Promise<RoutesJsonEntry[]> {
  for (const filePath of ROUTES_JSON_CANDIDATES) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const parsed = JSON.parse(content) as unknown

      if (!Array.isArray(parsed)) continue

      const urls = parsed.filter((value): value is string => typeof value === 'string')

      return urls.map((p) => ({ path: p }))
    } catch {
      continue
    }
  }

  return []
}

async function searchRoutes(q: string): Promise<SearchResult[]> {
  const routes = await loadRoutes()
  if (!routes.length) return []

  const needle = q.toLowerCase()
  type Scored = { entry: RoutesJsonEntry; score: number }

  const scored: Scored[] = []

  for (const entry of routes) {
    const p = entry.path
    if (!p) continue

    const title = pathToTitle(p)
    const haystack = `${p.toLowerCase()} ${title.toLowerCase()}`
    const idx = haystack.indexOf(needle)
    if (idx === -1) continue

    const score = (idx === 0 ? 2 : 1) + 1 / (p.length + 1)
    scored.push({ entry, score })
  }

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, MAX_RESULTS_PER_SECTION).map(({ entry }) => {
    const p = entry.path
    const title = pathToTitle(p)

    return {
      id: `route:${p}`,
      title,
      snippet: `Navigate to ${p}`,
      path: p,
    }
  })
}

async function searchKnowledge(q: string, request: NextRequest, worldKey: string | null): Promise<SearchResult[]> {
  const trimmed = q.trim()
  if (!trimmed) return []

  const params = new URLSearchParams()
  params.set('q', trimmed)
  params.set('page', '1')
  params.set('page_size', String(MAX_RESULTS_PER_SECTION))

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  const auth = request.headers.get('authorization')
  if (auth) headers.Authorization = auth

  const cookie = request.headers.get('cookie')
  if (cookie) headers.Cookie = cookie

  for (const endpoint of KNOWLEDGE_SEARCH_ENDPOINTS) {
    const url = new URL(buildBackendUrl(scopeWorldEndpoint(endpoint, worldKey), request))
    params.forEach((value, key) => {
      url.searchParams.set(key, value)
    })

    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers,
        cache: 'no-store',
      })

      if (!res.ok) {
        if (res.status === 404 || res.status === 405) continue
        continue
      }

      const raw = (await res.json()) as RawKnowledgeSearchResponse
      const resources = normalizeKnowledgeResults(raw)
      if (!resources.length) return []

      return resources.slice(0, MAX_RESULTS_PER_SECTION).map((r) => ({
        id: `knowledge:${String(r.id)}`,
        title: r.title,
        snippet: buildKnowledgeSnippet(r),
        path:
          r.url && typeof r.url === 'string'
            ? r.url
            : `/konnected/learning-library/browse-resources?resource=${encodeURIComponent(
                String(r.id),
              )}`,
      }))
    } catch {
      continue
    }
  }

  return []
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const worldKey = resolveWorldKey(request)

  if (!q) {
    return NextResponse.json(
      { error: 'Missing query parameter `q`' },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  }

  if (q.length < MIN_QUERY_LENGTH) {
    const body: SearchResponseBody = { results: [] }
    return NextResponse.json(body, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  try {
    const [routeResults, knowledgeResults] = await Promise.all([
      searchRoutes(q),
      searchKnowledge(q, request, worldKey),
    ])

    const scopedRouteResults = worldKey
      ? routeResults.map((item) => ({
          ...item,
          path: item.path.startsWith('/w/') ? item.path : `/w/${worldKey}${item.path === '/' ? '' : item.path}`,
        }))
      : routeResults

    const body: SearchResponseBody = {
      results: [...scopedRouteResults, ...knowledgeResults],
    }

    return NextResponse.json(body, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    const body: SearchResponseBody = { results: [] }

    return NextResponse.json(body, {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}