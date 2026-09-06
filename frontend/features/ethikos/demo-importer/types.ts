// frontend/features/ethikos/demo-importer/types.ts

export const ETHIKOS_DEMO_SCHEMA_VERSION_V1 = "ethikos-demo-scenario/v1" as const;
export const ETHIKOS_DEMO_SCHEMA_VERSION_V2 = "ethikos-demo-scenario/v2" as const;
export const ETHIKOS_DEMO_SCHEMA_VERSION_V3 = "ethikos-demo-scenario/v3" as const;
export const ETHIKOS_DEMO_SCHEMA_VERSION = ETHIKOS_DEMO_SCHEMA_VERSION_V3;
export const ETHIKOS_DEMO_SCHEMA_VERSIONS = [
  ETHIKOS_DEMO_SCHEMA_VERSION_V1,
  ETHIKOS_DEMO_SCHEMA_VERSION_V2,
  ETHIKOS_DEMO_SCHEMA_VERSION_V3,
] as const;

export const ETHIKOS_DEMO_IMPORT_MODES = ["replace_scenario", "append_scenario"] as const;
export const ETHIKOS_DEMO_TOPIC_STATUSES = ["open", "closed", "archived"] as const;
export const ETHIKOS_DEMO_CONSULTATION_STATUSES = ["open", "closed", "archived"] as const;
export const ETHIKOS_DEMO_ARGUMENT_SIDES = ["pro", "con", "neutral"] as const;
export const ETHIKOS_DEMO_STANCE_MIN = -3 as const;
export const ETHIKOS_DEMO_STANCE_MAX = 3 as const;

export type EthikosDemoSchemaVersion = (typeof ETHIKOS_DEMO_SCHEMA_VERSIONS)[number];
export type EthikosDemoImportMode = (typeof ETHIKOS_DEMO_IMPORT_MODES)[number];
export type EthikosDemoTopicStatus = (typeof ETHIKOS_DEMO_TOPIC_STATUSES)[number];
export type EthikosDemoConsultationStatus = (typeof ETHIKOS_DEMO_CONSULTATION_STATUSES)[number];
export type EthikosDemoArgumentSide = (typeof ETHIKOS_DEMO_ARGUMENT_SIDES)[number] | null;

export type EthikosDemoScenario = {
  schema_version: EthikosDemoSchemaVersion;
  scenario_key: string;
  scenario_title: string;
  mode: EthikosDemoImportMode;
  metadata?: Record<string, unknown>;
  actors: EthikosDemoActor[];
  categories: EthikosDemoCategory[];
  topics: EthikosDemoTopic[];
  stances: EthikosDemoStance[];
  arguments: EthikosDemoArgument[];
  argument_sources?: EthikosDemoArgumentSource[];
  consultations: EthikosDemoConsultation[];
  consultation_votes: EthikosDemoConsultationVote[];
  impact_items: EthikosDemoImpactItem[];
  ekoh_profiles?: EthikosDemoEkohProfile[];
  consultation_relevance?: EthikosDemoConsultationRelevance[];
  topic_relevance?: EthikosDemoTopicRelevance[];
  reading_exclusions?: EthikosDemoReadingExclusion[];
};

export type EthikosDemoActor = {
  key: string;
  username: string;
  display_name: string;
  email?: string;
  role?: string;
  is_ethikos_elite?: boolean;
};

export type EthikosDemoCategory = { key: string; name: string; description?: string };
export type EthikosDemoTopic = {
  key: string;
  title: string;
  description?: string;
  status: EthikosDemoTopicStatus;
  category: string;
  start_date?: string;
  end_date?: string;
};
export type EthikosDemoStance = { topic: string; actor: string; value: number };
export type EthikosDemoArgument = {
  key: string;
  topic: string;
  actor: string;
  side?: EthikosDemoArgumentSide;
  parent?: string;
  content: string;
};
export type EthikosDemoArgumentSource = {
  key: string;
  argument: string;
  url?: string | null;
  title?: string;
  excerpt?: string;
  source_type?: string;
  citation_text?: string;
  quote?: string;
  note?: string;
};
export type EthikosDemoConsultation = {
  key: string;
  title: string;
  status: EthikosDemoConsultationStatus;
  open_date: string;
  close_date: string;
  options?: EthikosDemoConsultationOption[];
};
export type EthikosDemoConsultationOption = { key: string; label: string; description?: string };

/**
 * v3 source vote: weighted_value is intentionally absent.
 * v1/v2 payloads may still contain it for backward compatibility.
 */
export type EthikosDemoConsultationVote = {
  consultation: string;
  actor: string;
  option?: string;
  raw_value: number;
  weighted_value?: number;
};

export type EthikosDemoImpactItem = {
  consultation: string;
  action: string;
  status: string;
  date: string;
};

export type EthikosDemoEkohExpertise = {
  domain_code: string;
  weighted_score: number; // normalized 0..1
  raw_score?: number; // normalized 0..1
};

export type EthikosDemoEkohProfile = {
  actor: string;
  ethics_score?: number;
  rating_visibility?: 'public' | 'scoped' | 'private';
  publication_basis?: string;
  expertise: EthikosDemoEkohExpertise[];
};

export type EthikosDemoConsultationRelevance = {
  consultation: string;
  domain_code: string;
  weight: number; // 0..1; rows for a consultation sum to 1
  criteria?: string | Record<string, unknown>;
};

export type EthikosDemoTopicRelevance = {
  topic: string;
  domain_code: string;
  weight: number; // 0..1; rows for a topic sum to 1
  criteria?: string | Record<string, unknown>;
};

export type EthikosDemoReadingExclusion = {
  topic: string;
  actor: string;
  reason: string;
};

export type EthikosDemoImportSummary = {
  actors: number;
  categories: number;
  topics: number;
  stances: number;
  arguments: number;
  argument_sources?: number;
  consultations: number;
  consultation_votes: number;
  impact_items: number;
  ekoh_profiles?: number;
  consultation_relevance?: number;
  topic_relevance?: number;
  reading_exclusions?: number;
};

export type EthikosDemoImportError = { path: string; message: string };
export type EthikosDemoImportObjectRecord = {
  object_type: string;
  object_id: number | string;
  object_label?: string;
};
export type EthikosDemoImportWarning = { path?: string; message: string };
export type EthikosDemoImportResponse = {
  ok: boolean;
  dry_run?: boolean;
  scenario_key?: string;
  summary?: EthikosDemoImportSummary;
  errors?: EthikosDemoImportError[];
  warnings?: EthikosDemoImportWarning[];
  created?: EthikosDemoImportObjectRecord[];
  updated?: EthikosDemoImportObjectRecord[];
  deleted?: EthikosDemoImportObjectRecord[];
};
export type EthikosDemoResetRequest = { scenario_key: string };

export type EthikosDemoJsonParseResult =
  | { ok: true; scenario: EthikosDemoScenario; error: null }
  | { ok: false; scenario: null; error: string };

export function parseEthikosDemoScenarioJson(jsonText: string): EthikosDemoJsonParseResult {
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    if (!isEthikosDemoScenario(parsed)) {
      return { ok: false, scenario: null, error: "JSON does not match the ethiKos demo scenario contract." };
    }
    return { ok: true, scenario: parsed, error: null };
  } catch {
    return { ok: false, scenario: null, error: "Invalid JSON." };
  }
}

export function isEthikosDemoScenario(value: unknown): value is EthikosDemoScenario {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<EthikosDemoScenario>;
  const version = candidate.schema_version as EthikosDemoSchemaVersion;

  if (!ETHIKOS_DEMO_SCHEMA_VERSIONS.includes(version)) return false;
  if (!Array.isArray(candidate.consultation_votes)) return false;

  const voteContractIsValid = candidate.consultation_votes.every((vote) => {
    if (!vote || typeof vote !== "object") return false;
    if (version === ETHIKOS_DEMO_SCHEMA_VERSION_V3) {
      return !("weighted_value" in vote);
    }
    return typeof vote.weighted_value === "number";
  });

  return (
    typeof candidate.scenario_key === "string" &&
    typeof candidate.scenario_title === "string" &&
    (candidate.mode == null || ETHIKOS_DEMO_IMPORT_MODES.includes(candidate.mode as EthikosDemoImportMode)) &&
    Array.isArray(candidate.actors) &&
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.topics) &&
    Array.isArray(candidate.stances) &&
    Array.isArray(candidate.arguments) &&
    Array.isArray(candidate.consultations) &&
    Array.isArray(candidate.impact_items) &&
    voteContractIsValid &&
    (version !== ETHIKOS_DEMO_SCHEMA_VERSION_V1 || !candidate.argument_sources?.length) &&
    (version === ETHIKOS_DEMO_SCHEMA_VERSION_V3 ||
      (!candidate.ekoh_profiles?.length &&
        !candidate.consultation_relevance?.length &&
        !candidate.topic_relevance?.length &&
        !candidate.reading_exclusions?.length))
  );
}