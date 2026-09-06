// FILE: frontend/shared/services/search.ts
// File: shared/services/search.ts

import { scopeBrowserApiUrl } from "@/lib/worlds";

/**
 * Canonical global-search result shape used by the Next.js route and hooks.
 * Matches modules/global/hooks/useGlobalSearch.ts and app/_api/search/route.ts.
 */
export interface GlobalSearchResult {
  id: string;
  title: string;
  snippet: string;
  path: string;
}

/* ------------------------------------------------------------------ */
/*  Knowledge resources (KonnectED)                                   */
/* ------------------------------------------------------------------ */

type KnowledgeContentType = "article" | "video" | "lesson" | "quiz" | "dataset";

/**
 * Subset/superset of the KnowledgeResource DTO used across KonnectED pages.
 * We only rely on a few fields (id, title, description/subject/url).
 */
interface KnowledgeResource {
  id: number | string;
  title?: string;
  type?: KnowledgeContentType | string;
  url?: string | null;
  subject?: string | null;
  level?: string | null;
  language?: string | null;
  created_at?: string | null;
  tags?: string[] | null;
  // Some pages use description/summary; we support both.
  description?: string | null;
  summary?: string | null;
}

/**
 * The knowledge list endpoint appears under a few different paths in the app.
 * We try them in order and use the first one that responds successfully.
 */
const KNOWLEDGE_SEARCH_ENDPOINTS = [
  "/api/knowledge-resources/",
  "/api/knowledge/resources/",
  "/api/konnected/resources/",
] as const;

type RawKnowledgeSearchResponse =
  | KnowledgeResource[]
  | {
      results?: KnowledgeResource[];
      items?: KnowledgeResource[];
      count?: number;
      total?: number;
    };

function normalizeKnowledgeResponse(raw: RawKnowledgeSearchResponse): KnowledgeResource[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  const obj = raw ?? {};

  const results: KnowledgeResource[] =
    (Array.isArray(obj.results) && obj.results) ||
    (Array.isArray(obj.items) && obj.items) ||
    [];

  return results;
}

/**
 * Low-level helper that talks to the KnowledgeResource list endpoint(s).
 *
 * It:
 * - sends both `q` and `search` params to support v14 + DRF SearchFilter
 * - normalizes array vs {results/items/…} responses
 * - returns at most `limit` items
 */
async function fetchKnowledgeResults(q: string, limit = 10): Promise<KnowledgeResource[]> {
  const params = new URLSearchParams();

  const trimmed = q.trim();
  if (trimmed) {
    params.set("q", trimmed);
    params.set("search", trimmed);
  }

  params.set("page", "1");
  params.set("page_size", String(Math.max(1, limit)));

  const qs = params.toString();
  let lastError: unknown;

  for (const base of KNOWLEDGE_SEARCH_ENDPOINTS) {
    const rawUrl = qs ? `${base}?${qs}` : base;
    const url = scopeBrowserApiUrl(rawUrl);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      });

      // For 404/405 we silently try the next candidate; for other codes we surface the error.
      if (!res.ok) {
        if (res.status === 404 || res.status === 405) {
          lastError = new Error(
            `Knowledge search endpoint not available at ${base} (${res.status})`,
          );
          continue;
        }

        const body = await res.text().catch(() => "");
        throw new Error(body || `Knowledge search failed with status ${res.status}`);
      }

      const json = (await res.json()) as RawKnowledgeSearchResponse;
      const items = normalizeKnowledgeResponse(json);
      return items.slice(0, limit);
    } catch (err) {
      // Keep last error and try next endpoint.
      lastError = err;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Knowledge search failed; no endpoints responded successfully.");
}

/* ------------------------------------------------------------------ */
/*  Mapping helpers                                                   */
/* ------------------------------------------------------------------ */

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

/**
 * Pick a short snippet for display:
 * - prefer description/summary/subject fields that actually contain the query
 * - fall back to title
 */
function extractSnippet(resource: KnowledgeResource, q: string): string {
  const qLower = q.toLowerCase();

  const candidates: (string | null | undefined)[] = [
    resource.description,
    resource.summary,
    resource.subject,
    resource.title,
  ];

  let chosen = "";

  for (const value of candidates) {
    if (!value) continue;
    if (!chosen) chosen = value;
    if (value.toLowerCase().includes(qLower)) {
      chosen = value;
      break;
    }
  }

  return truncate(chosen || "", 160);
}

/**
 * Build a frontend path to open the resource.
 * - If backend provides an absolute URL, use it.
 * - If it is a relative path, keep it.
 * - Otherwise, fall back to the KonnectED resource-details route.
 */
function buildKnowledgePath(resource: KnowledgeResource): string {
  const url = resource.url ?? undefined;

  if (url && typeof url === "string") {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    if (url.startsWith("/")) {
      return url;
    }
  }

  return `/konnected/learning-library/resource/${encodeURIComponent(
    String(resource.id),
  )}`;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Global search entry point.
 *
 * v1 implementation:
 * - pulls from the KonnectED KnowledgeResource list endpoint
 * - returns a flat list of results matching the UI contract
 *
 * It is written so that additional sources (projects, forum, etc.) can be
 * added later by fetching them in parallel and concatenating the results.
 */
export async function runGlobalSearch(q: string): Promise<GlobalSearchResult[]> {
  const query = q?.trim();
  if (!query) return [];

  // For now, only Knowledge resources are indexed.
  const knowledge = await fetchKnowledgeResults(query, 10);

  const results: GlobalSearchResult[] = knowledge.map((res) => ({
    // Prefix with a source tag to avoid collisions once we add more sources.
    id: `knowledge:${String(res.id)}`,
    title: res.title || "(Untitled resource)",
    snippet: extractSnippet(res, query),
    path: buildKnowledgePath(res),
  }));

  return results;
}
