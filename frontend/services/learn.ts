// FILE: frontend/services/learn.ts
// frontend/services/learn.ts

import { get } from './_request'

export interface ChangelogEntry {
  version: string
  date: string
  tags: string[]
  notes: string[]
}

export interface GuideSection {
  id: string
  title: string
  content: string
}

export interface GlossaryItem {
  id: string
  term: string
  definition: string
}

interface EthikosCategoryApi {
  id: number
  name: string
  description?: string | null
}

/**
 * Canonical local content for Ethikos Learn.
 *
 * Rationale:
 * - Current Learn consumers expect synchronous, stable shapes from this service.
 * - The glossary page explicitly states terms are synced from Ethikos categories.
 * - The backend categories endpoint may be optional, so glossary fetching must degrade safely.
 */

const CHANGELOG: ChangelogEntry[] = [
  {
    version: 'v0.1',
    date: '2025-01-01',
    tags: ['INITIAL'],
    notes: [
      'First deploy of the Ethikos kernel: topics, stances, arguments, and categories.',
      'Elite and public debate flows were wired on top of the Ethikos core models.',
    ],
  },
  {
    version: 'v0.2',
    date: '2025-02-01',
    tags: ['IMPROVE', 'LEARN'],
    notes: [
      'Added the first Learn-layer content for onboarding, glossary, and usage guidance.',
      'Clarified how DECIDE, DELIBERATE, and Trust signals relate to debate participation.',
    ],
  },
]

const GUIDES: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started with Ethikos',
    content:
      'Create a debate topic, invite participants to express a stance, then use DECIDE for outcomes and DELIBERATE for argument threads.',
  },
  {
    id: 'elite-vs-public',
    title: 'Elite vs public consultations',
    content:
      'Elite debates are linked to an expertise category; public debates are open to all. This distinction is defined on the Ethikos topic and related expertise metadata.',
  },
  {
    id: 'reading-results',
    title: 'How to read results and participation',
    content:
      'Use DECIDE to review closed decisions, Pulse to inspect participation patterns, and Trust to understand contributor reputation signals around the debate space.',
  },
]

function cloneChangelog(entries: ChangelogEntry[]): ChangelogEntry[] {
  return entries.map((entry) => ({
    ...entry,
    tags: entry.tags.map((tag) => tag.trim().toUpperCase()),
    notes: [...entry.notes],
  }))
}

function cloneGuides(sections: GuideSection[]): GuideSection[] {
  return sections.map((section) => ({
    ...section,
  }))
}

function normalizeDefinition(value?: string | null): string {
  return (value ?? '').trim()
}

function sortGlossary(items: GlossaryItem[]): GlossaryItem[] {
  return [...items].sort((a, b) =>
    a.term.localeCompare(b.term, undefined, { sensitivity: 'base' }),
  )
}

export async function fetchChangelog(): Promise<{ entries: ChangelogEntry[] }> {
  const entries = cloneChangelog(CHANGELOG).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  return { entries }
}

export async function fetchGuides(): Promise<{ sections: GuideSection[] }> {
  return { sections: cloneGuides(GUIDES) }
}

export async function fetchGlossary(): Promise<{ items: GlossaryItem[] }> {
  try {
    const categories = await get<EthikosCategoryApi[]>('ethikos/categories/')

    const items: GlossaryItem[] = (categories ?? [])
      .filter((category) => Boolean(category?.name?.trim()))
      .map((category) => ({
        id: String(category.id),
        term: category.name.trim(),
        definition: normalizeDefinition(category.description),
      }))

    return { items: sortGlossary(items) }
  } catch {
    // The categories endpoint is optional in this codebase.
    // Keep the Learn UI usable even when that endpoint is not registered yet.
    return { items: [] }
  }
}