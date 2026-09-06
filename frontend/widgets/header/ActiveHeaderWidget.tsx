// FILE: frontend/widgets/header/ActiveHeaderWidget.tsx
// \Konnaxionv14\frontend\widgets\header\ActiveHeaderWidget.tsx
'use client'

import type { FC } from 'react'

import ClockWidget from './ClockWidget'
// Later you can import WeatherWidget, FeedWidget, etc. and swap here.

const ActiveHeaderWidget: FC = () => {
  return <ClockWidget />
}

export default ActiveHeaderWidget
