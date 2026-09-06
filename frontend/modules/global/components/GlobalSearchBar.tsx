// FILE: frontend/modules/global/components/GlobalSearchBar.tsx
// File: modules/global/components/GlobalSearchBar.tsx
'use client'

import { Input } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getWorldKeyFromPathname, withWorldPath } from '@/lib/worlds'
import React, { useState } from 'react'

export function GlobalSearchBar() {
  const [q, setQ] = useState(useSearchParams().get('q') ?? '')
  const router = useRouter()
  const pathname = usePathname()
  const worldKey = getWorldKeyFromPathname(pathname)

  const onSearch = (value: string) => {
    if (value.trim()) {
      router.push(withWorldPath(`/search?q=${encodeURIComponent(value.trim())}`, worldKey))
    }
  }

  return (
    <Input.Search
      placeholder="Search…"
      value={q}
      onChange={e => setQ(e.target.value)}
      onSearch={onSearch}
      enterButton
      style={{ maxWidth: 400 }}
    />
  )
}
