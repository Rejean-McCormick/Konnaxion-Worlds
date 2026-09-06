// FILE: frontend/services/trust.ts
import dayjs from 'dayjs';

import { get, post } from './_request';
import { fetchEkohProfile } from './ekoh';
import type { EkohProfile } from './ekoh';
import { resolveAvatarUrl } from './user';

export { fetchEkohProfile } from './ekoh';
export type {
  EkohExpertiseScore,
  EkohProfile,
  EkohRatingAccess,
  EkohRatingAccessLevel,
  EkohRatingVisibility,
  EkohScoreHistoryEntry,
} from './ekoh';

type EthikosId = string | number;
type UnknownRecord = Record<string, unknown>;

export interface ReputationDimension {
  key: string;
  label: string;
  score: number;
  weight: number;
}

export interface TrustActivity {
  id: string;
  label: string;
  value?: string | number;
  createdAt?: string;
}

export type TrustLevel = 'Visitor' | 'Contributor' | 'Steward';

export interface TrustProfile {
  id: string;
  name: string;
  avatar?: string | null;
  joined?: string;
  score: number;
  activity: TrustActivity[];
  level: TrustLevel;
  dimensions: ReputationDimension[];
  recent: { label: string; change: number }[];
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
}

/** Backward-compatible name used by older trust screens. */
export type ReputationProfile = TrustProfile;

export interface TrustBadge {
  id: string;
  title: string;
  label: string;
  description: string;
  earned: boolean;
  progress: number;
  earnedAt?: string;
  createdAt?: string;
}
export type Badge = TrustBadge;

export interface TrustBadgePayload {
  earned: TrustBadge[];
  progress: TrustBadge[];
}

export interface Credential {
  id: string;
  title: string;
  issuer: string;
  issuedAt: string;
  url?: string;
}

export interface UploadCredentialInput {
  title?: string;
  issuer?: string;
  issuedAt?: string | Date | null;
}

interface UserMeApi {
  id?: EthikosId;
  name?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  username?: string;
  email?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  picture?: string | null;
  date_joined?: string | null;
  created_at?: string | null;
  joined?: string | null;
}

interface EthikosStanceApi {
  id: EthikosId;
  user?: EthikosId | null;
  user_id?: EthikosId | null;
  value?: number;
  timestamp?: string;
  created_at?: string;
}

interface EthikosArgumentApi {
  id: EthikosId;
  user?: EthikosId | null;
  user_id?: EthikosId | null;
  content?: string;
  created_at?: string;
}


function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function unwrapPayload(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  return raw.data ?? raw;
}

function readString(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}


function normalizeList<T>(
  raw: unknown,
  guard: (value: unknown) => value is T,
): T[] {
  const payload = unwrapPayload(raw);
  if (Array.isArray(payload)) return payload.filter(guard);
  if (!isRecord(payload)) return [];
  if (Array.isArray(payload.results)) return payload.results.filter(guard);
  if (Array.isArray(payload.items)) return payload.items.filter(guard);
  if (Array.isArray(payload.data)) return payload.data.filter(guard);
  return [];
}

function isUserMeApi(value: unknown): value is UserMeApi {
  return isRecord(value);
}
function isStanceApi(value: unknown): value is EthikosStanceApi {
  return isRecord(value) && 'id' in value;
}
function isArgumentApi(value: unknown): value is EthikosArgumentApi {
  return isRecord(value) && 'id' in value;
}

function getCurrentUserIdentity(me: UserMeApi) {
  const record = me as UnknownRecord;
  const id = readString(record, ['id']);
  const username =
    readString(record, ['username', 'email', 'name']) ?? 'current-user';
  const displayName =
    readString(record, ['name', 'display_name', 'full_name', 'username', 'email']) ??
    username;
  const joined = readString(record, ['joined', 'date_joined', 'created_at']);
  const rawAvatar = readString(record, ['avatar_url', 'picture', 'avatar']) ?? null;

  return {
    id,
    username,
    displayName,
    joined,
    avatarUrl: resolveAvatarUrl({ avatar_url: rawAvatar }),
  };
}

function matchesCurrentUser(
  value: EthikosId | null | undefined,
  user: { id?: string; username: string },
): boolean {
  if (value == null) return false;
  const normalized = String(value);
  return normalized === user.username || normalized === user.id;
}

function countLastDays(dates: string[], days: number): number {
  const cutoff = dayjs().subtract(days, 'day');
  return dates.filter((date) => dayjs(date).isAfter(cutoff)).length;
}

function makeBadge(params: {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progress: number;
  earnedAt?: string;
}): TrustBadge {
  return {
    id: params.id,
    title: params.title,
    label: params.title,
    description: params.description,
    earned: params.earned,
    progress: Math.max(0, Math.min(100, params.progress)),
    earnedAt: params.earnedAt,
    createdAt: params.earnedAt,
  };
}

async function fetchTrustInputs(): Promise<{
  me: UserMeApi;
  stances: EthikosStanceApi[];
  arguments: EthikosArgumentApi[];
}> {
  const [rawMe, rawStances, rawArguments] = await Promise.all([
    get<unknown>('users/me/'),
    get<unknown>('ethikos/stances/'),
    get<unknown>('ethikos/arguments/'),
  ]);

  const mePayload = unwrapPayload(rawMe);
  return {
    me: isUserMeApi(mePayload) ? mePayload : {},
    stances: normalizeList(rawStances, isStanceApi),
    arguments: normalizeList(rawArguments, isArgumentApi),
  };
}

function filterForCurrentUser<
  T extends { user?: EthikosId | null; user_id?: EthikosId | null },
>(items: T[], user: { id?: string; username: string }): T[] {
  return items.filter(
    (item) =>
      matchesCurrentUser(item.user, user) ||
      matchesCurrentUser(item.user_id, user),
  );
}

/**
 * Legacy activity profile kept for screens outside the EkoH domain model.
 * It deliberately does not derive "influence" from weighted votes.
 */
function buildTrustProfile(args: {
  user: ReturnType<typeof getCurrentUserIdentity>;
  stances: EthikosStanceApi[];
  arguments: EthikosArgumentApi[];
}): TrustProfile {
  const { user, stances, arguments: argumentsList } = args;
  const myStances = filterForCurrentUser(stances, user);
  const myArguments = filterForCurrentUser(argumentsList, user);

  const stanceDates = myStances
    .map((item) => item.timestamp ?? item.created_at)
    .filter((date): date is string => Boolean(date));
  const argumentDates = myArguments
    .map((item) => item.created_at)
    .filter((date): date is string => Boolean(date));

  const recentStances = countLastDays(stanceDates, 30);
  const previousStances = countLastDays(stanceDates, 60) - recentStances;

  const dimensions: ReputationDimension[] = [
    {
      key: 'deliberation',
      label: 'Arguments contributed',
      score: Math.min(100, myArguments.length * 5),
      weight: 0.5,
    },
    {
      key: 'participation',
      label: 'Stances recorded',
      score: Math.min(100, myStances.length * 4),
      weight: 0.5,
    },
  ];

  const score = Math.round(
    dimensions.reduce((sum, dimension) => sum + dimension.score * dimension.weight, 0),
  );
  const level: TrustLevel =
    score >= 75 ? 'Steward' : score >= 35 ? 'Contributor' : 'Visitor';

  return {
    id: user.id ?? user.username,
    name: user.displayName,
    avatar: user.avatarUrl,
    joined: user.joined,
    score,
    level,
    dimensions,
    activity: [
      { id: 'stances', label: 'Stances recorded', value: myStances.length, createdAt: stanceDates[0] },
      { id: 'arguments', label: 'Arguments contributed', value: myArguments.length, createdAt: argumentDates[0] },
    ],
    recent: [
      {
        label: 'Stances last 30 days',
        change: recentStances - previousStances,
      },
    ],
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}

export async function fetchCurrentUserEkohProfile(): Promise<EkohProfile | null> {
  const rawMe = await get<unknown>('users/me/');
  const mePayload = unwrapPayload(rawMe);
  if (!isUserMeApi(mePayload)) return null;
  const user = getCurrentUserIdentity(mePayload);
  if (!user.id) return null;
  return fetchEkohProfile(user.id);
}

export async function fetchUserProfile(): Promise<ReputationProfile> {
  const { me, stances, arguments: argumentsList } = await fetchTrustInputs();
  return buildTrustProfile({
    user: getCurrentUserIdentity(me),
    stances,
    arguments: argumentsList,
  });
}

export const fetchTrustProfile = fetchUserProfile;

export async function fetchTrustBadges(): Promise<TrustBadgePayload> {
  const { me, stances, arguments: argumentsList } = await fetchTrustInputs();
  const user = getCurrentUserIdentity(me);
  const myStances = filterForCurrentUser(stances, user);
  const myArguments = filterForCurrentUser(argumentsList, user);

  const firstStanceAt = myStances[0]?.timestamp ?? myStances[0]?.created_at;
  const firstArgumentAt = myArguments[0]?.created_at;

  const badges = [
    makeBadge({
      id: 'first-stance',
      title: 'First stance',
      description: 'Recorded your first stance in an Ethikos debate.',
      earned: myStances.length > 0,
      progress: myStances.length > 0 ? 100 : 0,
      earnedAt: firstStanceAt,
    }),
    makeBadge({
      id: 'argument-builder',
      title: 'Argument builder',
      description: 'Contributed at least 5 arguments to debates.',
      earned: myArguments.length >= 5,
      progress: (myArguments.length / 5) * 100,
      earnedAt: myArguments.length >= 5 ? firstArgumentAt : undefined,
    }),
  ];

  return {
    earned: badges.filter((badge) => badge.earned),
    progress: badges.filter((badge) => !badge.earned),
  };
}

export async function fetchUserBadges(): Promise<TrustBadgePayload> {
  return fetchTrustBadges();
}

export async function fetchUserBadgeList(): Promise<Badge[]> {
  const payload = await fetchTrustBadges();
  return [...payload.earned, ...payload.progress];
}

function titleFromFilename(name?: string): string {
  if (!name) return 'Untitled credential';
  const normalized = name
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
  return normalized || 'Untitled credential';
}

function toIsoOrUndefined(
  value: string | Date | null | undefined,
): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toISOString() : undefined;
}

export async function uploadCredential(
  file: File,
  meta: UploadCredentialInput = {},
): Promise<Credential> {
  const formData = new FormData();
  formData.append('file', file);

  const title = (meta.title ?? '').trim() || titleFromFilename(file.name);
  if (title) formData.append('title', title);

  const issuer = (meta.issuer ?? '').trim();
  if (issuer) formData.append('issuer', issuer);

  const issuedAt = toIsoOrUndefined(meta.issuedAt);
  if (issuedAt) formData.append('issuedAt', issuedAt);

  return post<Credential, FormData>('trust/credentials', formData);
}
