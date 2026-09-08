'use client'

import { GlobalOutlined } from '@ant-design/icons'
import { Select, Space, Tag, Tooltip } from 'antd'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import api from '@/api'
import {
  getWorldKeyFromPathname,
  switchWorldPath,
} from '@/lib/worlds'

const RECENT_WORLDS_KEY = 'konnaxion:recent-worlds'
const MAX_RECENT_WORLDS = 8

type ReleaseSummary = {
  id: number
  release_number: number
  status: string
  is_dirty: boolean
}

type WorldSummary = {
  id: number
  key: string
  title: string
  status: string
  visibility: string
  current_release: ReleaseSummary | null
  can_manage: boolean
}

function readRecentWorlds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(window.localStorage.getItem(RECENT_WORLDS_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []
  } catch {
    return []
  }
}

function rememberWorld(key: string, existing: string[]): string[] {
  const next = [key, ...existing.filter(item => item !== key)].slice(0, MAX_RECENT_WORLDS)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(RECENT_WORLDS_KEY, JSON.stringify(next))
  }
  return next
}

export default function WorldSwitcher() {
  const pathname = usePathname() ?? '/'
  const currentKey = getWorldKeyFromPathname(pathname)
  const [worlds, setWorlds] = useState<WorldSummary[]>([])
  const [recentKeys, setRecentKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setRecentKeys(readRecentWorlds())
  }, [])

  useEffect(() => {
    let cancelled = false
    void api
      .get<WorldSummary[]>('control/worlds/')
      .then(rows => {
        if (!cancelled) setWorlds(rows)
      })
      .catch(() => {
        if (!cancelled) setWorlds([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const current = useMemo(
    () => worlds.find(world => world.key === currentKey) ?? null,
    [currentKey, worlds],
  )

  const orderedWorlds = useMemo(() => {
    const recentRank = new Map(recentKeys.map((key, index) => [key, index]))
    return [...worlds].sort((left, right) => {
      const leftRank = recentRank.get(left.key)
      const rightRank = recentRank.get(right.key)
      if (leftRank !== undefined || rightRank !== undefined) {
        if (leftRank === undefined) return 1
        if (rightRank === undefined) return -1
        return leftRank - rightRank
      }
      return left.title.localeCompare(right.title)
    })
  }, [recentKeys, worlds])

  useEffect(() => {
    if (!currentKey) return
    setRecentKeys(existing => rememberWorld(currentKey, existing))
  }, [currentKey])

  useEffect(() => {
    let reloading = false
    const onReleaseChanged = () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    }
    window.addEventListener('konnaxion:world-release-changed', onReleaseChanged)
    return () => window.removeEventListener('konnaxion:world-release-changed', onReleaseChanged)
  }, [])

  useEffect(() => {
    const releaseId = current?.current_release?.id
    if (releaseId) document.documentElement.dataset.kxWorldReleaseId = String(releaseId)
    else delete document.documentElement.dataset.kxWorldReleaseId
    return () => {
      delete document.documentElement.dataset.kxWorldReleaseId
    }
  }, [current])

  if (!loading && worlds.length === 0) return null

  const onChange = (key: string) => {
    if (key === currentKey) return
    setRecentKeys(existing => rememberWorld(key, existing))
    const target = switchWorldPath(pathname, key)
    const query = typeof window !== 'undefined' ? window.location.search : ''
    // Deliberately hard-navigate. This clears every client cache and prevents
    // response/state from the previous World surviving the context boundary.
    window.location.assign(`${target}${query}`)
  }

  return (
    <Space size={6}>
      <Tooltip title="Switch the entire Konnaxion data World">
        <GlobalOutlined />
      </Tooltip>
      <Select
        aria-label="Active World"
        loading={loading}
        value={currentKey ?? undefined}
        placeholder="Search or select World"
        showSearch
        allowClear={false}
        onChange={onChange}
        filterOption={(input, option) => {
          const searchText = String((option as { searchText?: string })?.searchText ?? '')
          return searchText.includes(input.trim().toLowerCase())
        }}
        style={{ minWidth: 220, maxWidth: 340 }}
        options={orderedWorlds.map(world => ({
          value: world.key,
          label: world.title,
          searchText: `${world.title} ${world.key}`.toLowerCase(),
          disabled:
            !world.current_release ||
            world.current_release.status !== 'current' ||
            (world.status !== 'active' && !world.can_manage),
        }))}
      />
      {current?.current_release?.is_dirty ? <Tag>Modified</Tag> : null}
    </Space>
  )
}
