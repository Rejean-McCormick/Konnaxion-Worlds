// FILE: frontend/src/types/index.ts
// Alias: "@/types"
export type ID = string

export interface Ballot {
  id: ID
  title: string
  closesAt: string       // ISO
  scope?: 'Elite' | 'Public'
  region?: string
  options?: string[]     // pour Public
  turnout?: number
}

export interface Topic {
  id: ID
  title: string
  category: string
  createdAt?: string
  lastActivity?: string
  hot?: boolean
}

export interface KPI {
  key: string
  label: string
  value: number
  delta?: number
}
