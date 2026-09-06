// FILE: frontend/modules/kontact/hooks/useProfiles.ts
﻿// modules/kontact/hooks/useProfiles.ts

import { useQuery } from '@tanstack/react-query';

import { fetchUserProfile, type ReputationProfile } from '@/services/trust';

export type ReputationLevel = ReputationProfile['level'];

export interface KontactProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  headline?: string;
  shortBio?: string;
  primaryDomain?: string;
  domains: string[];
  expertiseTags: string[];
  location?: string;
  availability?: string;
  reputationLevel: ReputationLevel;
  reputationScore: number;
  isYou?: boolean;
}

export interface ProfilesFilter {
  /**
   * Free‑text search applied to name, username, headline,
   * domains and expertise tags.
   */
  search?: string;

  /**
   * Filter by primary domain or any domain label.
   * Example: "Climate & Resilience", "AI Ethics".
   */
  domain?: string;

  /**
   * Minimum Ekoh reputation score (0–100).
   * Example: 40 → only Contributors and Stewards above that score.
   */
  minScore?: number;

  /**
   * Only keep Steward‑level profiles.
   */
  onlyStewards?: boolean;

  /**
   * When false, hides the current user from the result set.
   * Default: true (include).
   */
  includeSelf?: boolean;

  /**
   * Optional hard filter to retrieve a single profile by username.
   * Useful for the public profile page.
   */
  username?: string;
}

/**
 * Build a synthetic roster of collaboration profiles for the Connect Center.
 *
 * There is no dedicated "Kontact profiles" endpoint yet; instead we:
 * - derive the current user's identity + reputation from the Ekoh profile
 * - add a small set of curated example peers
 * - apply client‑side filters (search, domain, score, level)
 */
async function loadProfiles(filter: ProfilesFilter = {}): Promise<KontactProfile[]> {
  const me = await fetchUserProfile();

  const allProfiles = buildSampleProfiles(me);

  return applyFilter(allProfiles, filter);
}

function buildSampleProfiles(me: ReputationProfile): KontactProfile[] {
  const username = me.username ?? 'you';
  const displayName = me.displayName ?? username;

  const you: KontactProfile = {
    id: `user-${username}`,
    username,
    displayName,
    avatarUrl: me.avatarUrl ?? null,
    headline: `Ekoh ${me.level} · score ${Math.round(me.score)}/100`,
    shortBio:
      'Your orchestrator profile as seen across Ekoh & KeenKonnect. Used for matching, trust and collaboration signals.',
    primaryDomain: 'Cross‑ecosystem orchestration',
    domains: ['Ethikos debates', 'KeenKonnect workspaces'],
    expertiseTags: [
      'Deliberation quality',
      'Participation',
      'Influence (weighted votes)',
    ],
    location: undefined,
    availability: 'Open to selective collaborations',
    reputationLevel: me.level,
    reputationScore: me.score,
    isYou: true,
  };

  // Curated example peers – purely front‑end for now.
  // These give the Connect Center UI realistic data until a backend is wired.
  const peers: KontactProfile[] = [
    {
      id: 'user-aminata',
      username: 'aminata',
      displayName: 'Aminata N.',
      avatarUrl: null,
      headline: 'Climate policy researcher · Just transition facilitator',
      shortBio:
        'Works with cities and communities on climate resilience and inclusive transition roadmaps.',
      primaryDomain: 'Climate & resilience',
      domains: ['Climate & resilience', 'Urban policy'],
      expertiseTags: [
        'Participatory climate roadmapping',
        'Just transition',
        'Community engagement',
      ],
      location: 'Dakar · Remote‑friendly',
      availability: '3–5 h / week · Open to new projects',
      reputationLevel: 'Steward',
      reputationScore: 86,
    },
    {
      id: 'user-lucas',
      username: 'lucas',
      displayName: 'Lucas R.',
      avatarUrl: null,
      headline: 'AI ethics & product · Guardrails for applied ML',
      shortBio:
        'Helps product teams ship responsible ML features and align experiments with governance frameworks.',
      primaryDomain: 'AI ethics',
      domains: ['AI ethics', 'Product strategy'],
      expertiseTags: [
        'AI guardrails',
        'Fairness by design',
        'Experimentation & A/B testing',
      ],
      location: 'Montréal · Hybrid',
      availability: 'Evenings & week‑ends',
      reputationLevel: 'Contributor',
      reputationScore: 72,
    },
    {
      id: 'user-sofia',
      username: 'sofia',
      displayName: 'Sofia P.',
      avatarUrl: null,
      headline: 'Impact measurement · Learning ecosystems',
      shortBio:
        'Designs lightweight impact frameworks and runs sense‑making sessions with multi‑stakeholder teams.',
      primaryDomain: 'Impact & evaluation',
      domains: ['Impact & evaluation', 'Learning design'],
      expertiseTags: [
        'Outcome mapping',
        'Qualitative evaluation',
        'Learning loops',
      ],
      location: 'Lisbon · Remote',
      availability: '5–8 h / month · Advisory',
      reputationLevel: 'Contributor',
      reputationScore: 64,
    },
    {
      id: 'user-raj',
      username: 'raj',
      displayName: 'Raj K.',
      avatarUrl: null,
      headline: 'Systems design · Collaborative governance',
      shortBio:
        'Supports networks of cities and labs to co‑design governance experiments and decision protocols.',
      primaryDomain: 'Systems & governance',
      domains: ['Systems & governance', 'Civic tech'],
      expertiseTags: [
        'Multi‑stakeholder facilitation',
        'Governance pilots',
        'Decision protocols',
      ],
      location: 'Bengaluru · Remote‑first',
      availability: 'Open to new collaborations',
      reputationLevel: 'Steward',
      reputationScore: 91,
    },
    {
      id: 'user-ines',
      username: 'ines',
      displayName: 'Inès L.',
      avatarUrl: null,
      headline: 'Community builder · Practice‑based cohorts',
      shortBio:
        'Designs peer learning cohorts for practitioners working on climate, AI and social innovation.',
      primaryDomain: 'Communities & learning',
      domains: ['Communities & learning', 'Facilitation'],
      expertiseTags: [
        'Cohort design',
        'Online facilitation',
        'Community health',
      ],
      location: 'Paris · Hybrid',
      availability: 'Side‑project friendly',
      reputationLevel: 'Contributor',
      reputationScore: 58,
    },
  ];

  return [you, ...peers];
}

function applyFilter(
  profiles: KontactProfile[],
  filter: ProfilesFilter,
): KontactProfile[] {
  const {
    search,
    domain,
    minScore,
    onlyStewards,
    includeSelf = true,
    username,
  } = filter;

  let result = [...profiles];

  // Hard filter by username (e.g. public profile view)
  if (username && username.trim()) {
    const target = username.trim().toLowerCase();
    result = result.filter(
      (p) => p.username.toLowerCase() === target || p.id.toLowerCase() === target,
    );
  }

  if (!includeSelf) {
    result = result.filter((p) => !p.isYou);
  }

  if (onlyStewards) {
    result = result.filter((p) => p.reputationLevel === 'Steward');
  }

  if (typeof minScore === 'number') {
    result = result.filter((p) => p.reputationScore >= minScore);
  }

  if (domain && domain.trim() && domain !== 'all') {
    const d = domain.trim().toLowerCase();
    result = result.filter(
      (p) =>
        p.primaryDomain?.toLowerCase() === d ||
        p.domains.some((dom) => dom.toLowerCase() === d),
    );
  }

  const q = search?.trim().toLowerCase();
  if (q) {
    result = result.filter((p) => {
      const haystack = [
        p.displayName,
        p.username,
        p.headline ?? '',
        p.shortBio ?? '',
        p.primaryDomain ?? '',
        ...p.domains,
        ...p.expertiseTags,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }

  return result;
}

export default function useProfiles(filter: ProfilesFilter = {}) {
  return useQuery<KontactProfile[], Error>({
    queryKey: ['kontact-profiles', filter],
    queryFn: () => loadProfiles(filter),
    staleTime: 5 * 60_000, // 5 minutes
  });
}
