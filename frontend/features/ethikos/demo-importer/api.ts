// frontend/features/ethikos/demo-importer/api.ts

import {
  ETHIKOS_DEMO_SCHEMA_VERSION_V1,
  ETHIKOS_DEMO_SCHEMA_VERSION_V3,
  ETHIKOS_DEMO_SCHEMA_VERSIONS,
} from "./types";
import type {
  EthikosDemoImportResponse,
  EthikosDemoResetRequest,
  EthikosDemoScenario,
  EthikosDemoSchemaVersion,
} from "./types";

export const ETHIKOS_DEMO_IMPORTER_ROUTE = "/ethikos/admin/demo-importer";

export const ETHIKOS_DEMO_API_PATH = "/api/ethikos/demo-scenarios";

/**
 * Optional backend origin.
 *
 * Leave empty when the frontend already proxies /api/* to Django.
 *
 * Example:
 * NEXT_PUBLIC_KONNAXION_API_ORIGIN=http://127.0.0.1:8000
 */
export const ETHIKOS_DEMO_API_ORIGIN =
  process.env.NEXT_PUBLIC_KONNAXION_API_ORIGIN ?? "";

type EthikosDemoBackendResponse = Partial<EthikosDemoImportResponse> & {
  detail?: string;
};

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function ensureLeadingSlash(value: string): string {
  return value.startsWith("/") ? value : `/${value}`;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split("=");

    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

function buildEthikosDemoApiUrl(path: string): string {
  const normalizedOrigin = stripTrailingSlash(ETHIKOS_DEMO_API_ORIGIN);
  const normalizedPath = ensureLeadingSlash(path);

  if (!normalizedOrigin) {
    return normalizedPath;
  }

  return `${normalizedOrigin}${normalizedPath}`;
}

function buildEthikosDemoEndpoint(action: "preview" | "import" | "reset"): string {
  return ensureTrailingSlash(
    `${buildEthikosDemoApiUrl(ETHIKOS_DEMO_API_PATH)}/${action}`,
  );
}

export const ETHIKOS_DEMO_API_BASE =
  buildEthikosDemoApiUrl(ETHIKOS_DEMO_API_PATH);

export const ETHIKOS_DEMO_PREVIEW_ENDPOINT =
  buildEthikosDemoEndpoint("preview");

export const ETHIKOS_DEMO_IMPORT_ENDPOINT =
  buildEthikosDemoEndpoint("import");

export const ETHIKOS_DEMO_RESET_ENDPOINT =
  buildEthikosDemoEndpoint("reset");

function emptyResponse(
  message: string,
  path = "request",
): EthikosDemoImportResponse {
  return {
    ok: false,
    errors: [
      {
        path,
        message,
      },
    ],
    warnings: [],
    created: [],
    updated: [],
    deleted: [],
  };
}

function normalizeEthikosDemoResponse(
  data: EthikosDemoBackendResponse,
): EthikosDemoImportResponse {
  const errors = [...(data.errors ?? [])];

  if (!errors.length && data.detail) {
    errors.push({
      path: "detail",
      message: data.detail,
    });
  }

  return {
    ok: Boolean(data.ok),
    dry_run: data.dry_run,
    scenario_key: data.scenario_key,
    summary: data.summary,
    errors,
    warnings: data.warnings ?? [],
    created: data.created ?? [],
    updated: data.updated ?? [],
    deleted: data.deleted ?? [],
  };
}

async function readEthikosDemoResponse(
  response: Response,
): Promise<EthikosDemoImportResponse> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();

    return emptyResponse(
      text
        ? `The server returned a non-JSON response with status ${response.status}. Check the backend route, trailing slash, authentication, or CSRF.`
        : `The server returned an empty response with status ${response.status}.`,
      "response",
    );
  }

  try {
    const data = (await response.json()) as EthikosDemoBackendResponse;
    return normalizeEthikosDemoResponse(data);
  } catch {
    return emptyResponse(
      "The server returned an invalid JSON response.",
      "response",
    );
  }
}

async function postEthikosDemoJson<TPayload>(
  endpoint: string,
  payload: TPayload,
): Promise<EthikosDemoImportResponse> {
  const normalizedEndpoint = ensureTrailingSlash(endpoint);
  const csrfToken = getCookie("csrftoken");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }

  let response: Response;

  try {
    response = await fetch(normalizedEndpoint, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });
  } catch {
    return emptyResponse(
      "Could not connect to the ethiKos Demo Importer API.",
      "network",
    );
  }

  const normalized = await readEthikosDemoResponse(response);

  if (!response.ok) {
    const errors = normalized.errors ?? [];

    return {
      ...normalized,
      ok: false,
      errors: errors.length
        ? errors
        : [
            {
              path: "request",
              message: `Request failed with status ${response.status}.`,
            },
          ],
    };
  }

  return normalized;
}

export async function previewEthikosDemoScenario(
  scenario: EthikosDemoScenario,
): Promise<EthikosDemoImportResponse> {
  return postEthikosDemoJson(ETHIKOS_DEMO_PREVIEW_ENDPOINT, scenario);
}

export async function importEthikosDemoScenario(
  scenario: EthikosDemoScenario,
): Promise<EthikosDemoImportResponse> {
  return postEthikosDemoJson(ETHIKOS_DEMO_IMPORT_ENDPOINT, scenario);
}

export async function resetEthikosDemoScenario(
  request: EthikosDemoResetRequest,
): Promise<EthikosDemoImportResponse> {
  return postEthikosDemoJson(ETHIKOS_DEMO_RESET_ENDPOINT, request);
}

export function parseEthikosDemoScenarioJson(jsonText: string): {
  scenario: EthikosDemoScenario | null;
  errorMessage: string | null;
} {
  try {
    const parsed = JSON.parse(jsonText) as Partial<EthikosDemoScenario>;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        scenario: null,
        errorMessage: "JSON must be an object.",
      };
    }

    if (
      !ETHIKOS_DEMO_SCHEMA_VERSIONS.includes(
        parsed.schema_version as (typeof ETHIKOS_DEMO_SCHEMA_VERSIONS)[number],
      )
    ) {
      return {
        scenario: null,
        errorMessage:
          "Invalid schema_version. Expected ethikos-demo-scenario/v1, v2, or v3.",
      };
    }

    // Runtime-validated above. Array.includes() does not narrow an optional
    // object property, so keep the validated value in a non-optional local.
    const schemaVersion = parsed.schema_version as EthikosDemoSchemaVersion;

    if (
      schemaVersion === ETHIKOS_DEMO_SCHEMA_VERSION_V1 &&
      Array.isArray(parsed.argument_sources) &&
      parsed.argument_sources.length > 0
    ) {
      return {
        scenario: null,
        errorMessage:
          "argument_sources requires ethikos-demo-scenario/v2.",
      };
    }

    if (!parsed.scenario_key || typeof parsed.scenario_key !== "string") {
      return {
        scenario: null,
        errorMessage: "scenario_key is required.",
      };
    }

    if (!parsed.scenario_title || typeof parsed.scenario_title !== "string") {
      return {
        scenario: null,
        errorMessage: "scenario_title is required.",
      };
    }

    if (
      schemaVersion === ETHIKOS_DEMO_SCHEMA_VERSION_V3 &&
      (parsed.consultation_votes ?? []).some(
        (vote) => vote != null && typeof vote === "object" && "weighted_value" in vote,
      )
    ) {
      return {
        scenario: null,
        errorMessage:
          "v3 consultation_votes must contain source raw_value only; weighted_value belongs to a derived Smart Vote reading.",
      };
    }

    const scenario: EthikosDemoScenario = {
      schema_version: schemaVersion,
      scenario_key: parsed.scenario_key,
      scenario_title: parsed.scenario_title,
      mode: parsed.mode ?? "replace_scenario",
      metadata: parsed.metadata ?? {},
      actors: parsed.actors ?? [],
      categories: parsed.categories ?? [],
      topics: parsed.topics ?? [],
      stances: parsed.stances ?? [],
      arguments: parsed.arguments ?? [],
      argument_sources: parsed.argument_sources ?? [],
      consultations: parsed.consultations ?? [],
      consultation_votes: parsed.consultation_votes ?? [],
      impact_items: parsed.impact_items ?? [],
      ekoh_profiles: parsed.ekoh_profiles ?? [],
      consultation_relevance: parsed.consultation_relevance ?? [],
      topic_relevance: parsed.topic_relevance ?? [],
      reading_exclusions: parsed.reading_exclusions ?? [],
    };

    return {
      scenario,
      errorMessage: null,
    };
  } catch {
    return {
      scenario: null,
      errorMessage: "Invalid JSON syntax.",
    };
  }
}