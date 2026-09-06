import { get, post } from './_request'

export type KreativeTag = {
  id: number
  name: string
}

export type KreativeArtwork = {
  id: number
  artist: string
  title: string
  description: string
  media_file?: string | null
  media_url?: string | null
  media_type: 'image' | 'video' | 'audio' | 'other'
  year?: number | null
  medium?: string
  style?: string
  tags: KreativeTag[]
  created_at: string
}

export type TraditionEntry = {
  id: number
  title: string
  description: string
  region: string
  media_file: string
  submitted_by?: string | null
  submitted_at: string
  approved: boolean
}

type ListPayload<T> = T[] | { results?: T[] }

function normalizeList<T>(payload: ListPayload<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? []
}

export async function listKreativeArtworks(): Promise<KreativeArtwork[]> {
  return normalizeList(await get<ListPayload<KreativeArtwork>>('kreative/artworks/'))
}

export async function createKreativeArtwork(form: FormData): Promise<KreativeArtwork> {
  return post<KreativeArtwork, FormData>('kreative/artworks/', form)
}

export async function createTraditionEntry(form: FormData): Promise<TraditionEntry> {
  return post<TraditionEntry, FormData>('kreative/traditions/', form)
}

export async function listTraditionEntries(): Promise<TraditionEntry[]> {
  return normalizeList(await get<ListPayload<TraditionEntry>>('kreative/traditions/'))
}

export type KreativeCollabSession = {
  id: number
  name: string
  host: string
  session_type: 'painting' | 'music' | 'mixed'
  started_at: string
  ended_at?: string | null
  final_artwork?: number | null
}

export async function createCollabSession(payload: {
  name: string
  session_type: KreativeCollabSession['session_type']
}): Promise<KreativeCollabSession> {
  return post<KreativeCollabSession, typeof payload>('kreative/collab-sessions/', payload)
}

export async function listCollabSessions(): Promise<KreativeCollabSession[]> {
  return normalizeList(await get<ListPayload<KreativeCollabSession>>('kreative/collab-sessions/'))
}
