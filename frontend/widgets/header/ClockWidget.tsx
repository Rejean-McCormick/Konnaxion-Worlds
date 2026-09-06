// FILE: frontend/widgets/header/ClockWidget.tsx
// C:\MyCode\Konnaxionv14\frontend\widgets\header\ClockWidget.tsx
'use client'

import type { FC } from 'react'
import { useEffect, useState } from 'react'

const ClockWidget: FC = () => {
  const [label, setLabel] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const time = now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
      // 14 chars or less, e.g. "Local 14:32"
      setLabel(`Local ${time}`)
    }

    update()
    const id = window.setInterval(update, 30_000)
    return () => window.clearInterval(id)
  }, [])

  return <span>{label}</span>
}

export default ClockWidget
