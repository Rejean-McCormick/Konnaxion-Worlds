'use client'

import { TeamOutlined } from '@ant-design/icons'
import { Select, Space, Tooltip } from 'antd'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import api from '@/api'
import { getWorldKeyFromPathname } from '@/lib/worlds'

type Persona = {
  id: number
  source_key: string
  display_name: string
}

type Runtime = {
  view_as: null | { persona_id: number; display_name: string }
}

export default function WorldViewAsSwitcher() {
  const pathname = usePathname() ?? '/'
  const worldKey = getWorldKeyFromPathname(pathname)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selected, setSelected] = useState<number | undefined>()

  useEffect(() => {
    if (!worldKey) {
      setPersonas([])
      setSelected(undefined)
      return
    }
    let cancelled = false
    void Promise.all([
      api.get<Persona[]>('runtime/personas/'),
      api.get<Runtime>('runtime/'),
    ])
      .then(([rows, runtime]) => {
        if (cancelled) return
        setPersonas(rows)
        setSelected(runtime.view_as?.persona_id)
      })
      .catch(() => {
        if (!cancelled) setPersonas([])
      })
    return () => {
      cancelled = true
    }
  }, [worldKey])

  if (!worldKey || personas.length === 0) return null

  const onChange = async (personaId: number | undefined) => {
    await api.post('runtime/view-as/', { persona_id: personaId ?? null })
    // Acting identity may affect permissions/readings throughout the app.
    window.location.reload()
  }

  return (
    <Space size={6}>
      <Tooltip title="Presentation persona; your authenticated account does not change">
        <TeamOutlined />
      </Tooltip>
      <Select
        allowClear
        aria-label="View as World persona"
        placeholder="Public view"
        value={selected}
        onChange={onChange}
        style={{ minWidth: 150, maxWidth: 240 }}
        options={personas.map(persona => ({ value: persona.id, label: persona.display_name }))}
      />
    </Space>
  )
}
