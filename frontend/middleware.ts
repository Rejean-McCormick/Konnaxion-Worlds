import { type NextRequest, NextResponse } from 'next/server'

const WORLD_PAGE_RE = /^\/w\/([a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?)(\/.*)?$/i
const GLOBAL_API_PREFIXES = [
  '/api/w/',
  '/api/control/',
  '/api/users/',
  '/api/admin/',
  '/api/auth-token/',
  '/api/schema/',
  '/api/docs/',
  '/api/_api/',
]

function refererWorld(request: NextRequest): string | null {
  const raw = request.headers.get('referer')
  if (!raw) return null
  try {
    return WORLD_PAGE_RE.exec(new URL(raw).pathname)?.[1]?.toLowerCase() ?? null
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Safety net for legacy/raw fetch('/api/...') calls from a World page. The
  // typed API clients also scope their own requests, but this catches older
  // call sites that have not migrated yet.
  if (pathname.startsWith('/api/')) {
    if (GLOBAL_API_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
      return NextResponse.next()
    }
    const worldKey = refererWorld(request)
    if (!worldKey) return NextResponse.next()
    const url = request.nextUrl.clone()
    url.pathname = `/api/w/${worldKey}/${pathname.slice('/api/'.length)}`
    return NextResponse.rewrite(url)
  }

  const match = WORLD_PAGE_RE.exec(pathname)
  if (!match) return NextResponse.next()

  const appPath = match[2] || '/ethikos/insights'
  const url = request.nextUrl.clone()
  url.pathname = appPath
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
