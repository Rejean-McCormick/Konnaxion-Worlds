export type WorldRouteContext = {
  key: string
  appPath: string
}

const WORLD_PATH_RE = /^\/w\/([a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?)(\/.*)?$/i

const GLOBAL_API_PREFIXES = [
  'control/',
  'users/',
  'admin/',
  'auth-token/',
  'schema/',
  'docs/',
  '_api/',
] as const

function trimApiPrefix(path: string): string {
  let clean = path.trim().replace(/^\/+/, '')
  if (clean.startsWith('api/')) clean = clean.slice(4)
  return clean
}

export function parseWorldPath(pathname: string | null | undefined): WorldRouteContext | null {
  const path = pathname || '/'
  const match = WORLD_PATH_RE.exec(path)
  if (!match) return null
  return {
    key: match[1].toLowerCase(),
    appPath: match[2] || '/',
  }
}

export function getWorldKeyFromPathname(pathname: string | null | undefined): string | null {
  return parseWorldPath(pathname)?.key ?? null
}

export function stripWorldPrefix(pathname: string | null | undefined): string {
  return parseWorldPath(pathname)?.appPath ?? pathname ?? '/'
}

export function withWorldPath(path: string, worldKey: string | null | undefined): string {
  if (!worldKey) return path || '/'
  const existing = parseWorldPath(path)
  const appPath = existing?.appPath ?? (path.startsWith('/') ? path : `/${path}`)
  return `/w/${worldKey}${appPath === '/' ? '' : appPath}`
}

export function switchWorldPath(
  currentPath: string,
  targetWorldKey: string,
  fallbackPath = '/ethikos/insights',
): string {
  const appPath = stripWorldPrefix(currentPath)
  const usefulPath = appPath === '/' ? fallbackPath : appPath
  return withWorldPath(usefulPath, targetWorldKey)
}

export function isGlobalApiPath(path: string): boolean {
  const clean = trimApiPrefix(path)
  if (clean.startsWith('w/')) return true
  return GLOBAL_API_PREFIXES.some(prefix => clean === prefix.slice(0, -1) || clean.startsWith(prefix))
}

export function scopeApiPath(path: string, worldKey: string | null | undefined): string {
  if (!worldKey || isGlobalApiPath(path)) return path
  const hadLeadingSlash = path.startsWith('/')
  const clean = trimApiPrefix(path)
  const scoped = `w/${worldKey}/${clean}`
  return hadLeadingSlash ? `/${scoped}` : scoped
}

export function scopeApiPathForBrowser(path: string): string {
  if (typeof window === 'undefined') return path
  return scopeApiPath(path, getWorldKeyFromPathname(window.location.pathname))
}

export class StaleWorldReleaseError extends Error {
  readonly world: string
  readonly responseReleaseId: string
  readonly expectedReleaseId: string

  constructor(world: string, responseReleaseId: string, expectedReleaseId: string) {
    super(
      `Discarded stale ${world} release ${responseReleaseId} response; expected release ${expectedReleaseId}.`,
    )
    this.name = 'StaleWorldReleaseError'
    this.world = world
    this.responseReleaseId = responseReleaseId
    this.expectedReleaseId = expectedReleaseId
  }
}

export class StaleWorldResponseError extends Error {
  readonly responseWorld: string
  readonly activeWorld: string

  constructor(responseWorld: string, activeWorld: string) {
    super(`Discarded response for World ${responseWorld}; active World is ${activeWorld}.`)
    this.name = 'StaleWorldResponseError'
    this.responseWorld = responseWorld
    this.activeWorld = activeWorld
  }
}

export function assertCurrentWorldResponse(
  responseWorld: string | null | undefined,
  responseReleaseId?: string | number | null,
): void {
  if (typeof window === 'undefined' || !responseWorld) return
  const activeWorld = getWorldKeyFromPathname(window.location.pathname)
  if (activeWorld && responseWorld.toLowerCase() !== activeWorld.toLowerCase()) {
    throw new StaleWorldResponseError(responseWorld, activeWorld)
  }

  const expectedRelease = document.documentElement.dataset.kxWorldReleaseId
  if (
    activeWorld &&
    expectedRelease &&
    responseReleaseId != null &&
    String(responseReleaseId) !== expectedRelease
  ) {
    const actual = String(responseReleaseId)
    window.dispatchEvent(
      new CustomEvent('konnaxion:world-release-changed', {
        detail: { world: activeWorld, expectedReleaseId: expectedRelease, responseReleaseId: actual },
      }),
    )
    throw new StaleWorldReleaseError(activeWorld, actual, expectedRelease)
  }
}

export function scopeBrowserApiUrl(value: string): string {
  if (typeof window === 'undefined') return value
  try {
    const absolute = /^https?:\/\//i.test(value)
    const url = new URL(value, window.location.origin)
    const marker = '/api/'
    const index = url.pathname.indexOf(marker)
    if (index < 0) return value
    const prefix = url.pathname.slice(0, index + marker.length)
    const apiPath = url.pathname.slice(index + marker.length)
    const scoped = scopeApiPathForBrowser(apiPath).replace(/^\/+/, '')
    url.pathname = `${prefix}${scoped}`
    return absolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`
  } catch {
    return value
  }
}
