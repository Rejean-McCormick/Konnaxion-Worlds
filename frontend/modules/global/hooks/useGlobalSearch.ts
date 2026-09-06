// FILE: frontend/modules/global/hooks/useGlobalSearch.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { getWorldKeyFromPathname } from "@/lib/worlds";

export interface GlobalSearchResult {
  id: string;
  title: string;
  snippet: string;
  path: string;
}

interface SearchResponse {
  results?: GlobalSearchResult[];
}

const MIN_QUERY_LENGTH = 2;
const GLOBAL_SEARCH_ENABLED =
  (process.env.NEXT_PUBLIC_ENABLE_GLOBAL_SEARCH ?? "true").toLowerCase() !==
  "false";

function isGlobalSearchResult(value: unknown): value is GlobalSearchResult {
  if (!value || typeof value !== "object") return false;

  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.snippet === "string" &&
    typeof v.path === "string"
  );
}

function normalizeResults(payload: unknown): GlobalSearchResult[] {
  if (Array.isArray(payload)) {
    return payload.filter(isGlobalSearchResult);
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as SearchResponse).results)
  ) {
    return (payload as SearchResponse).results!.filter(isGlobalSearchResult);
  }

  return [];
}

/**
 * Client-side global search.
 *
 * Hits the Next.js route: GET /_api/search?q=…
 * - aligns with the server minimum query length
 * - supports a demo kill-switch via NEXT_PUBLIC_ENABLE_GLOBAL_SEARCH=false
 * - normalizes the `{ results: [...] }` response to `GlobalSearchResult[]`
 * - fails soft to `[]` when the route is unavailable or returns bad data
 */
export default function useGlobalSearch(query: string) {
  const q = query?.trim() ?? "";
  const pathname = usePathname();
  const worldKey = getWorldKeyFromPathname(pathname);

  return useQuery<GlobalSearchResult[], Error>({
    queryKey: ["global-search", worldKey ?? "global", q],
    enabled: GLOBAL_SEARCH_ENABLED && q.length >= MIN_QUERY_LENGTH,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      if (!GLOBAL_SEARCH_ENABLED || q.length < MIN_QUERY_LENGTH) {
        return [];
      }

      const params = new URLSearchParams({ q });
      if (worldKey) params.set("world", worldKey);

      let res: Response;
      try {
        res = await fetch(`/_api/search?${params.toString()}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
          signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error;
        }
        return [];
      }

      if (!res.ok) {
        return [];
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return [];
      }

      const json = (await res.json().catch(() => null)) as
        | SearchResponse
        | GlobalSearchResult[]
        | null;

      return normalizeResults(json);
    },
  });
}