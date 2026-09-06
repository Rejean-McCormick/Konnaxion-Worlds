// FILE: frontend/api.ts
// C:\MyCode\Konnaxionv14\frontend\api.ts

// Keep all named exports from the generated axios request layer.
// Do not re-export duplicate get/post/put/patch/del names from this file.
export * from './services/_request';

import { assertCurrentWorldResponse, scopeApiPathForBrowser, scopeBrowserApiUrl } from './lib/worlds';

// ---- Minimal fetch-based client with cookies included ----

export type ApiQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type ApiQueryParams = Record<
  string,
  ApiQueryValue | ApiQueryValue[]
>;

export class ApiError extends Error {
  readonly status: number;
  readonly path: string;
  readonly url: string;
  readonly details: unknown;

  constructor(args: {
    path: string;
    url: string;
    status: number;
    message: string;
    details?: unknown;
  }) {
    super(args.message);
    this.name = 'ApiError';
    this.path = args.path;
    this.url = args.url;
    this.status = args.status;
    this.details = args.details;
  }
}

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? '/api';

/**
 * API base without trailing slash.
 *
 * Supports both:
 * - '/api' for Next proxy/local frontend routing
 * - 'http://localhost:8000/api' for direct Django access
 */
export const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isBodyInit(value: unknown): value is BodyInit {
  if (typeof value === 'string') return true;

  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return true;
  }

  if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) {
    return true;
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return true;
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return true;
  }

  if (ArrayBuffer.isView(value)) {
    return true;
  }

  return false;
}

function normalizeApiPath(path: string): string {
  const cleanPath = path.trim().replace(/^\/+/, '');

  // Prevent accidental /api/api/... when callers pass "/api/ethikos/..."
  // and API_BASE is already "/api" or ".../api".
  if (
    cleanPath.startsWith('api/') &&
    (API_BASE === '/api' || API_BASE.endsWith('/api'))
  ) {
    return cleanPath.slice('api/'.length);
  }

  return cleanPath;
}

function appendQueryValue(
  url: URL,
  key: string,
  value: ApiQueryValue,
): void {
  if (value === null || value === undefined || value === '') {
    return;
  }

  url.searchParams.append(key, String(value));
}

export function buildUrl(
  path: string,
  query?: ApiQueryParams,
): string {
  const cleanPath = scopeApiPathForBrowser(normalizeApiPath(path));
  const joined = `${API_BASE}/${cleanPath.replace(/^\/+/, '')}`;
  const absolute = isAbsoluteUrl(joined);

  const url = absolute
    ? new URL(joined)
    : new URL(joined, 'http://konnaxion.local');

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => appendQueryValue(url, key, item));
      } else {
        appendQueryValue(url, key, value);
      }
    });
  }

  if (absolute) {
    return url.toString();
  }

  return `${url.pathname}${url.search}`;
}

function mergeHeaders(
  initHeaders?: HeadersInit,
  defaultHeaders?: HeadersInit,
): Headers {
  const headers = new Headers(defaultHeaders);

  if (initHeaders) {
    new Headers(initHeaders).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function readBrowserCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const prefix = `${encodeURIComponent(name)}=`;
  const entry = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));

  if (!entry) return undefined;
  return decodeURIComponent(entry.slice(prefix.length));
}

function requestMethod(input: RequestInfo | URL, init: RequestInit): string {
  if (init.method) return init.method.toUpperCase();
  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.method.toUpperCase();
  }
  return 'GET';
}

function isUnsafeMethod(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method.toUpperCase());
}

function isTrustedApiRequest(input: RequestInfo | URL): boolean {
  if (typeof window === 'undefined') return false;

  const raw =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  try {
    const requestOrigin = new URL(raw, window.location.origin).origin;
    const trustedOrigins = new Set<string>([window.location.origin]);

    if (isAbsoluteUrl(API_BASE)) {
      trustedOrigins.add(new URL(API_BASE).origin);
    }

    return trustedOrigins.has(requestOrigin);
  } catch {
    return false;
  }
}

/**
 * Fetch wrapper for Konnaxion browser calls.
 *
 * - always carries same-site cookies unless explicitly overridden;
 * - injects Django's X-CSRFToken header for same-origin mutation requests;
 * - preserves the native Response contract so existing call sites can migrate
 *   from fetch(...) to apiFetch(...) without changing response handling.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const scopedInput: RequestInfo | URL =
    typeof input === 'string'
      ? scopeBrowserApiUrl(input)
      : input instanceof URL
        ? new URL(scopeBrowserApiUrl(input.toString()))
        : input;
  const inheritedHeaders =
    typeof Request !== 'undefined' && scopedInput instanceof Request
      ? scopedInput.headers
      : undefined;
  const headers = mergeHeaders(init.headers, inheritedHeaders);
  const method = requestMethod(scopedInput, init);

  if (
    isUnsafeMethod(method) &&
    isTrustedApiRequest(scopedInput) &&
    !headers.has('X-CSRFToken')
  ) {
    const csrfToken = readBrowserCookie('csrftoken');
    if (csrfToken) headers.set('X-CSRFToken', csrfToken);
  }

  const response = await fetch(scopedInput, {
    ...init,
    credentials: init.credentials ?? 'include',
    headers,
  });

  assertCurrentWorldResponse(
    response.headers.get('X-Konnaxion-World'),
    response.headers.get('X-Konnaxion-World-Release-Id'),
  );
  return response;
}

function hasBody(init: RequestInit): boolean {
  return init.body !== undefined && init.body !== null;
}

function prepareBody(body?: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (isBodyInit(body)) {
    return body;
  }

  return JSON.stringify(body);
}

function shouldSetJsonContentType(body?: unknown): boolean {
  if (body === undefined || body === null) {
    return false;
  }

  return !isBodyInit(body);
}

async function parseResponseBody(res: Response): Promise<unknown> {
  if (res.status === 204 || res.status === 205) {
    return undefined;
  }

  const contentType = res.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  return text.length > 0 ? text : undefined;
}

function errorMessageFromBody(
  path: string,
  status: number,
  body: unknown,
): string {
  if (typeof body === 'object' && body !== null) {
    if ('detail' in body) {
      return String((body as { detail: unknown }).detail);
    }

    if ('error' in body) {
      return String((body as { error: unknown }).error);
    }

    if ('message' in body) {
      return String((body as { message: unknown }).message);
    }
  }

  return `Request to ${path} failed with status ${status}`;
}

export async function apiRequestJson<T>(
  path: string,
  init: RequestInit = {},
  query?: ApiQueryParams,
): Promise<T> {
  const url = buildUrl(path, query);

  const res = await apiFetch(url, {
    ...init,
    headers: mergeHeaders(init.headers),
  });

  const body = await parseResponseBody(res);

  if (!res.ok) {
    throw new ApiError({
      path,
      url,
      status: res.status,
      message: errorMessageFromBody(path, res.status, body),
      details: body,
    });
  }

  return body as T;
}

export async function apiGet<T>(
  path: string,
  init: RequestInit = {},
  query?: ApiQueryParams,
): Promise<T> {
  return apiRequestJson<T>(
    path,
    {
      ...init,
      method: 'GET',
    },
    query,
  );
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init: RequestInit = {},
): Promise<T> {
  const requestInit: RequestInit = {
    ...init,
    method: 'POST',
    body: prepareBody(body) ?? init.body,
  };

  return apiRequestJson<T>(path, {
    ...requestInit,
    headers: mergeHeaders(
      init.headers,
      hasBody(requestInit) && shouldSetJsonContentType(body)
        ? { 'Content-Type': 'application/json' }
        : undefined,
    ),
  });
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  init: RequestInit = {},
): Promise<T> {
  const requestInit: RequestInit = {
    ...init,
    method: 'PUT',
    body: prepareBody(body) ?? init.body,
  };

  return apiRequestJson<T>(path, {
    ...requestInit,
    headers: mergeHeaders(
      init.headers,
      hasBody(requestInit) && shouldSetJsonContentType(body)
        ? { 'Content-Type': 'application/json' }
        : undefined,
    ),
  });
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  init: RequestInit = {},
): Promise<T> {
  const requestInit: RequestInit = {
    ...init,
    method: 'PATCH',
    body: prepareBody(body) ?? init.body,
  };

  return apiRequestJson<T>(path, {
    ...requestInit,
    headers: mergeHeaders(
      init.headers,
      hasBody(requestInit) && shouldSetJsonContentType(body)
        ? { 'Content-Type': 'application/json' }
        : undefined,
    ),
  });
}

export async function apiDelete<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  return apiRequestJson<T>(path, {
    ...init,
    method: 'DELETE',
  });
}

const api = {
  baseUrl: API_BASE,
  buildUrl,
  requestJson: apiRequestJson,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
  del: apiDelete,
};

export default api;