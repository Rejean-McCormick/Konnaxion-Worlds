// FILE: frontend/types/index.ts
// types/index.ts
export type Id = string | number

export type Maker = {
  id: Id
  firstName: string
  lastName: string
  [k: string]: unknown
}

export type SculptureImage = { url: string; alt?: string; created?: string }
export type Sculpture = {
  accessionId: string
  name: string
  images: SculptureImage[]
  primaryMaker: Maker
  totalLikes: number
  totalComments: number
  totalVisits: number
  longitude?: number
  latitude?: number
  [k: string]: unknown
}

export type CommentRow = {
  commentId: Id
  author: string
  avatar?: string
  content: string
  created: string
  sculptureId?: Id
  [k: string]: unknown
}

export type LogRow = {
  id: Id
  actor: string
  action: string
  target?: string
  timestamp: string
}

export type KPI = {
  key: string
  label: string
  value: number
  delta?: number
  history?: { ts: number; value: number }[]
}

export type Topic = { id: Id; title: string; [k: string]: unknown }
export type Ballot = { id: Id; closesAt: string; [k: string]: unknown }
