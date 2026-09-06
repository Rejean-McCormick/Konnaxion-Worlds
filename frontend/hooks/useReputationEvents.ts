// FILE: frontend/hooks/useReputationEvents.ts

import { useQuery } from '@tanstack/react-query';

import {
  type Badge,
  type EkohProfile,
  fetchCurrentUserEkohProfile,
  fetchUserBadges,
  fetchUserProfile,
  type ReputationProfile,
  type TrustBadgePayload,
} from '@/services/trust';

export interface ReputationEvent {
  id: string;
  when: string;
  title: string;
  detail: string;
}

export interface ReputationEventsResult {
  profile: ReputationProfile;
  ekohProfile: EkohProfile | null;
  badges: Badge[];
  timeline: ReputationEvent[];
}

/**
 * Composes current Ethikos activity with the canonical EkoH profile endpoint.
 * Activity history remains a UI aid; EkoH expertise itself comes from EkoH.
 */
async function loadReputationEvents(): Promise<ReputationEventsResult> {
  const [profile, ekohProfile, badgePayload]: [
    ReputationProfile,
    EkohProfile | null,
    TrustBadgePayload,
  ] = await Promise.all([
    fetchUserProfile(),
    fetchCurrentUserEkohProfile(),
    fetchUserBadges(),
  ]);

  const badges = badgePayload.earned ?? [];
  const timeline: ReputationEvent[] = [];

  for (const item of profile.recent ?? []) {
    const change = item.change ?? 0;
    timeline.push({
      id: `recent-${item.label.replace(/\s+/g, '-').toLowerCase()}`,
      when: new Date().toISOString(),
      title: item.label,
      detail:
        change === 0
          ? 'No significant change compared with the previous period.'
          : change > 0
            ? `Increased by ${change} compared with the previous period.`
            : `Decreased by ${Math.abs(change)} compared with the previous period.`,
    });
  }

  for (const badge of badges) {
    timeline.push({
      id: `badge-${badge.id}`,
      when: badge.earnedAt ?? new Date().toISOString(),
      title: `Badge earned · ${badge.label}`,
      detail: badge.description ?? 'Badge earned from Ethikos activity.',
    });
  }

  timeline.sort((a, b) => Date.parse(b.when) - Date.parse(a.when));

  return {
    profile,
    ekohProfile,
    badges,
    timeline,
  };
}

export default function useReputationEvents() {
  return useQuery<ReputationEventsResult, Error>({
    queryKey: ['reputation-events'],
    queryFn: loadReputationEvents,
    staleTime: 5 * 60_000,
  });
}
