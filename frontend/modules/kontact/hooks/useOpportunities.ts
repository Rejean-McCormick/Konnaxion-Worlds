// FILE: frontend/modules/kontact/hooks/useOpportunities.ts
﻿// modules/kontact/hooks/useOpportunities.ts

import { useQuery } from '@tanstack/react-query';

export interface Opportunity {
  id: string;
  title: string;
  summary: string;
  organisation?: string;
  location?: string;
  commitment?: string;
  skills?: string[];
  tags?: string[];
  isRemote?: boolean;
  matchScore?: number;
  createdAt?: string;
  deadline?: string;
  url?: string;
  /** True when coming from the built‑in sample fallback rather than the API. */
  isSample?: boolean;
}

export interface OpportunityFilters {
  /** Free‑text search across title, summary, organisation, tags and skills. */
  search?: string;
  /** Filter by main location label (e.g. "Paris", "Remote", "EU"). */
  location?: string;
  /** If true, only return remote‑friendly opportunities. */
  remoteOnly?: boolean;
  /** All of these skills must be present in the opportunity’s skills/tags. */
  skills?: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers to normalize API responses                                */
/* ------------------------------------------------------------------ */

function normalizeList<T = unknown>(
  raw: unknown,
): { items: T[]; count?: number } {
  if (Array.isArray(raw)) {
    return { items: raw as T[] };
  }

  if (raw && typeof raw === 'object') {
    const obj = raw as { results?: unknown; items?: unknown; count?: number };
    const items =
      (Array.isArray(obj.results) && (obj.results as T[])) ||
      (Array.isArray(obj.items) && (obj.items as T[])) ||
      [];
    return {
      items,
      count: typeof obj.count === 'number' ? obj.count : undefined,
    };
  }

  return { items: [] };
}

interface OpportunityApiRecord {
  id?: string | number;
  pk?: string | number;
  title?: string;
  name?: string;
  summary?: string;
  teaser?: string;
  description?: string;
  short_description?: string;
  organisation?: string;
  organization?: string;
  org?: string;
  org_name?: string;
  company?: string;
  location?: string;
  city?: string;
  country?: string;
  commitment?: string;
  time_commitment?: string;
  time_required?: string;
  availability?: string;
  tags?: unknown;
  keywords?: unknown;
  labels?: unknown;
  skills?: unknown;
  skill_tags?: unknown;
  is_remote?: unknown;
  remote?: unknown;
  remote_friendly?: unknown;
  match_score?: number;
  score?: number;
  created_at?: string;
  createdAt?: string;
  published_at?: string;
  listed_at?: string;
  deadline?: string;
  closes_at?: string;
  apply_by?: string;
  application_deadline?: string;
  url?: string;
  link?: string;
  slug?: string;
  isSample?: unknown;
}

function normalizeOpportunities(raw: unknown): Opportunity[] {
  const { items } = normalizeList<OpportunityApiRecord>(raw);

  return items.map((row, index) => {
    const id = row.id ?? row.pk ?? index;

    const tagsSource = row.tags ?? row.keywords ?? row.labels ?? [];
    const skillsSource = row.skills ?? row.skill_tags ?? [];

    const tags = Array.isArray(tagsSource)
      ? tagsSource.map((t: unknown) => String(t))
      : undefined;

    const skills = Array.isArray(skillsSource)
      ? skillsSource.map((s: unknown) => String(s))
      : undefined;

    const isRemote = Boolean(
      row.is_remote ?? row.remote ?? row.remote_friendly ?? false,
    );

    const url =
      row.url ??
      row.link ??
      (typeof row.slug === 'string'
        ? `/kontact/opportunities/${encodeURIComponent(row.slug)}`
        : undefined);

    const organisation =
      row.organisation ??
      row.organization ??
      row.org ??
      row.org_name ??
      row.company ??
      undefined;

    const location =
      row.location ??
      row.city ??
      row.country ??
      (isRemote ? 'Remote' : undefined);

    const commitment =
      row.commitment ??
      row.time_commitment ??
      row.time_required ??
      row.availability ??
      undefined;

    const summary =
      row.summary ??
      row.teaser ??
      row.description ??
      row.short_description ??
      '';

    const matchScore =
      typeof row.match_score === 'number'
        ? row.match_score
        : typeof row.score === 'number'
        ? row.score
        : undefined;

    const createdAt =
      row.created_at ??
      row.createdAt ??
      row.published_at ??
      row.listed_at ??
      undefined;

    const deadline =
      row.deadline ??
      row.closes_at ??
      row.apply_by ??
      row.application_deadline ??
      undefined;

    return {
      id: String(id),
      title: row.title ?? row.name ?? 'Untitled opportunity',
      summary,
      organisation,
      location,
      commitment,
      skills,
      tags,
      isRemote,
      matchScore,
      createdAt,
      deadline,
      url,
      isSample: Boolean(row.isSample),
    };
  });
}

const sampleOpportunities: Opportunity[] = [
  {
    id: 'sample-1',
    title: 'Join a sustainability task‑force',
    summary:
      'Support a cross‑functional team designing and tracking sustainability KPIs for a pilot project.',
    organisation: 'KeenKonnect Community',
    location: 'Remote · EU‑friendly time zones',
    commitment: '2–4 hours per week',
    skills: ['Data analysis', 'Sustainability', 'Project coordination'],
    tags: ['climate', 'impact', 'volunteering'],
    isRemote: true,
    matchScore: 0.9,
    createdAt: new Date().toISOString(),
    url: '/keenkonnect/sustainability-impact/sustainability-dashboard',
    isSample: true,
  },
  {
    id: 'sample-2',
    title: 'UX partner for a civic‑tech app',
    summary:
      'Co‑design user journeys and low‑fidelity prototypes for a local participation and voting portal.',
    organisation: 'Civic Lab',
    location: 'Hybrid · Paris / Remote',
    commitment: '1–2 evenings per week',
    skills: ['UX research', 'Prototyping', 'Civic tech'],
    tags: ['civic‑tech', 'participation', 'design'],
    isRemote: true,
    matchScore: 0.82,
    createdAt: new Date().toISOString(),
    url: '/ethikos/deliberate/guidelines',
    isSample: true,
  },
  {
    id: 'sample-3',
    title: 'Community moderator for consultations',
    summary:
      'Help facilitate respectful and inclusive dialogue in Ethikos consultations and feedback spaces.',
    organisation: 'Ethikos',
    location: 'Remote',
    commitment: '3–5 hours per month',
    skills: ['Moderation', 'Conflict resolution', 'Community management'],
    tags: ['ethics', 'governance', 'community'],
    isRemote: true,
    matchScore: 0.76,
    createdAt: new Date().toISOString(),
    url: '/ethikos/admin/moderation',
    isSample: true,
  },
  {
    id: 'sample-4',
    title: 'Mentoring circle on AI & ethics',
    summary:
      'Small peer‑learning group for students and early‑career professionals exploring AI governance.',
    organisation: 'Ekoh / KonnectED',
    location: 'Online',
    commitment: 'Monthly 90‑minute sessions',
    skills: ['AI ethics', 'Facilitation', 'Research'],
    tags: ['AI', 'ethics', 'mentoring'],
    isRemote: true,
    matchScore: 0.88,
    createdAt: new Date().toISOString(),
    url: '/konnected/learning-library/browse-resources',
    isSample: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Local filtering for the sample / generic lists                     */
/* ------------------------------------------------------------------ */

function applyLocalFilters(
  items: Opportunity[],
  filters?: OpportunityFilters,
): Opportunity[] {
  if (!filters) return items;

  const { search, location, remoteOnly, skills } = filters;
  let result = items;

  if (search && search.trim()) {
    const needle = search.trim().toLowerCase();
    result = result.filter((item) => {
      const inTitle = item.title.toLowerCase().includes(needle);
      const inSummary = item.summary.toLowerCase().includes(needle);
      const inOrg = item.organisation
        ? item.organisation.toLowerCase().includes(needle)
        : false;
      const inTags = item.tags
        ? item.tags.some((tag) => tag.toLowerCase().includes(needle))
        : false;
      const inSkills = item.skills
        ? item.skills.some((skill) => skill.toLowerCase().includes(needle))
        : false;

      return inTitle || inSummary || inOrg || inTags || inSkills;
    });
  }

  if (location && location.trim()) {
    const locNeedle = location.trim().toLowerCase();
    result = result.filter((item) =>
      item.location ? item.location.toLowerCase().includes(locNeedle) : false,
    );
  }

  if (remoteOnly) {
    result = result.filter((item) => Boolean(item.isRemote));
  }

  if (skills && skills.length) {
    const wanted = skills.map((s) => s.toLowerCase());
    result = result.filter((item) => {
      const itemSkills =
        item.skills?.map((s) => s.toLowerCase()) ??
        item.tags?.map((t) => t.toLowerCase()) ??
        [];
      return wanted.every((skill) => itemSkills.includes(skill));
    });
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Wire to API with graceful fallbacks                               */
/* ------------------------------------------------------------------ */

async function fetchOpportunities(
  filters?: OpportunityFilters,
): Promise<Opportunity[]> {
  const params = new URLSearchParams();

  if (filters?.search?.trim()) {
    params.set('q', filters.search.trim());
  }
  if (filters?.location?.trim()) {
    params.set('location', filters.location.trim());
  }
  if (filters?.remoteOnly) {
    params.set('remote', 'true');
  }
  if (filters?.skills?.length) {
    params.set('skills', filters.skills.join(','));
  }

  const queryString = params.toString();
  const suffix = queryString ? `?${queryString}` : '';

  // Try a small set of likely endpoints. Only 404/501 are treated as "not wired".
  const endpoints = [
    '/api/kontact/opportunities/',
    '/api/opportunities/',
    '/api/keenkonnect/opportunities/',
  ];

  let hardError: Error | null = null;

  for (const base of endpoints) {
    try {
      const res = await fetch(`${base}${suffix}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        if (res.status === 404 || res.status === 501) {
          // Endpoint not available; try the next variant.
          continue;
        }

        const body = await res.text().catch(() => '');
        hardError = new Error(
          body || `Failed to load opportunities (${res.status})`,
        );
        // For "hard" API errors, stop trying alternates and let React Query surface the error.
        break;
      }

      const json = (await res.json()) as unknown;
      const items = normalizeOpportunities(json);
      return applyLocalFilters(items, filters);
    } catch {
      // Network / CORS / other fetch‑level issue → treat as "no live endpoint yet"
      // and try the next variant. We intentionally do not set hardError here.
      continue;
    }
  }

  if (hardError) {
    throw hardError;
  }

  // No live endpoint: fall back to in‑memory sample opportunities so the UI is usable.
   
  console.warn(
    'Kontact opportunities API not available; using sample opportunities instead.',
  );

  return applyLocalFilters(sampleOpportunities, filters);
}

/* ------------------------------------------------------------------ */
/*  Public hook                                                        */
/* ------------------------------------------------------------------ */

export default function useOpportunities(filters?: OpportunityFilters) {
  return useQuery<Opportunity[], Error>({
    queryKey: ['kontact', 'opportunities', filters ?? {}],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: () => fetchOpportunities(filters),
  });
}
