// FILE: frontend/components/dashboard-components/CommentCard.tsx
// C:\MyCode\Konnaxionv14\frontend\components\dashboard-components\CommentCard.tsx
'use client'

/**
 * Description: Comment statistics card, including total comments and trend graph
 * Author: Hieu Chu
 */

import type { AreaConfig } from '@ant-design/plots'
import dynamic from 'next/dynamic'
import React from 'react'

import {
  BarContainer,
  CardDivider,
  CardFooter,
  MainIcon,
  NumberInfoStyled,
} from './style'

type Point = { x: string | number; y: number }

interface Props {
  TOTAL_COMMENTS: number
  DAILY_COMMENTS: number
  DAILY_COMMENTS_CHANGE: number
  COMMENT_DATA: Point[]
}

// SSR-safe dynamic import of the Area chart
const Area = dynamic(() => import('@ant-design/plots').then(m => m.Area), {
  ssr: false,
})

export default function CommentCard({
  TOTAL_COMMENTS,
  DAILY_COMMENTS,
  DAILY_COMMENTS_CHANGE,
  COMMENT_DATA,
}: Props) {
  const areaConfig: AreaConfig = {
    data: COMMENT_DATA,
    xField: 'x',
    yField: 'y',
    height: 90,
    autoFit: true,
    padding: 0,
    // v2: axis unifié (remplace xAxis/yAxis)
    axis: { x: false, y: false },
    tooltip: {},
    // v2: style au niveau du mark (remplace areaStyle)
    style: { fillOpacity: 0.2 },
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <MainIcon type="message" twoToneColor="rgb(205, 34, 255)" />
        <NumberInfoStyled subTitle="Comments" total={TOTAL_COMMENTS} />
      </div>

      <BarContainer>
        <Area {...areaConfig} />
      </BarContainer>

      <CardDivider />

      <CardFooter
        title="Daily comments"
        value={DAILY_COMMENTS}
        change={DAILY_COMMENTS_CHANGE}
      />
    </>
  )
}
