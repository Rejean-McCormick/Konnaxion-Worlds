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

export default function WorldSwitcher() {
  const pathname = usePathname() ?? '/'
  const currentKey = getWorldKeyFromPathname(pathname)
  const [worlds, setWorlds] = useState<WorldSummary[]>([])
  const [loading, setLoading] = useState(true)

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
        placeholder="Select World"
        onChange={onChange}
        style={{ minWidth: 180, maxWidth: 280 }}
        options={worlds.map(world => ({
          value: world.key,
          label: world.title,
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
