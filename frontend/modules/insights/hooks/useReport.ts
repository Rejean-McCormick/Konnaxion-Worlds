// FILE: frontend/modules/insights/hooks/useReport.ts
// modules/insights/hooks/useReport.ts
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import api from '@/api'

type SmartVoteResp = {
  labels: string[]
  votes: number[]
  avg_score: number[]
}

type UsageResp = {
  labels: string[]
  mau: number[]
  projects: number[]
  docs: number[]
}

type PerfResp = {
  labels: string[]
  p95_latency: number[]
  error_rate: number[]
}

type EndpointMap = {
  'smart-vote': SmartVoteResp
  usage: UsageResp
  perf: PerfResp
}

type ReportParamValue = string | number | boolean | null | undefined
type ReportParams = Record<string, ReportParamValue>

function buildQueryString(params?: ReportParams): string {
  if (!params) return ''

  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)] as const)
    .sort(([a], [b]) => a.localeCompare(b))

  if (entries.length === 0) return ''

  const search = new URLSearchParams()
  for (const [key, value] of entries) {
    search.set(key, value)
  }

  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function useReport<E extends keyof EndpointMap>(
  endpoint: E,
  params?: ReportParams,
) {
  const query = useMemo(() => buildQueryString(params), [params])

  return useQuery<EndpointMap[E]>({
    queryKey: ['reports', endpoint, query],
    staleTime: 300_000,
    queryFn: async () => {
      const path = query
        ? `/reports/${endpoint}/${query}`
        : `/reports/${endpoint}/`

      return api.get<EndpointMap[E]>(path)
    },
  })
}