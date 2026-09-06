// FILE: frontend/components/dashboard-components/style.tsx
// C:\MyCode\Konnaxionv14\frontend\components\dashboard-components\style.tsx
/**
 * Description: Stylesheet for dashboard components
 * Author: Hieu Chu
 */

import {
  CaretDownOutlined,
  CaretUpOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import * as AntIcons from '@ant-design/icons'
import { Card, Col, Divider, Statistic, Tooltip } from 'antd'
import React from 'react'
import styled from 'styled-components'

/** helper: map legacy Icon `type` strings (e.g. "shopping-cart") to v4 components */
const legacyTypeToIcon = (type?: string) => {
  if (!type) return null

  const pascal =
    type
      .split('-')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') + 'Outlined'

  const key = pascal as keyof typeof AntIcons
  const Comp = AntIcons[key]

  return (Comp as React.ComponentType | undefined) ?? null
}

export const CardStyled = (props: React.ComponentProps<typeof Card>) => {
  const bodyStyle: React.CSSProperties = {
    padding: '20px 24px 8px',
  }
  return <Card bodyStyle={bodyStyle} bordered={false} {...props} />
}

/**
 * Replacement for `NumberInfo` from ant-design-pro.
 * Keeps the same call sites: <NumberInfoStyled subTitle="..." total={123} />
 */
export const NumberInfoStyled = (props: {
  subTitle?: React.ReactNode
  total: number
  precision?: number
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  style?: React.CSSProperties
}) => {
  const { subTitle, total, precision, prefix, suffix, style } = props
  return (
    <div style={{ display: 'inline-block', ...(style || {}) }}>
      <Statistic
        title={subTitle}
        value={total}
        precision={precision}
        prefix={prefix}
        suffix={suffix}
        formatter={v => Number(v).toLocaleString()}
        valueStyle={{ fontSize: 30 }}
      />
    </div>
  )
}

export const HelperIcon = (props: React.ComponentProps<typeof Tooltip>) => (
  <div style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}>
    <Tooltip {...props} placement="topLeft" arrowPointAtCenter>
      <InfoCircleOutlined style={{ verticalAlign: -3, cursor: 'pointer' }} />
    </Tooltip>
  </div>
)

/**
 * Backward compatible MainIcon.
 * Preferred: <MainIcon icon={<YourIcon />} />
 * Legacy support: <MainIcon type="shopping-cart" />
 */
export const MainIcon: React.FC<{
  icon?: React.ReactElement
  type?: string
  style?: React.CSSProperties
  twoToneColor?: string
}> = ({ icon, type, style, twoToneColor, ...rest }) => {
  const Comp = !icon && type ? legacyTypeToIcon(type) : null

  // Loosen the element type so we can pass twoToneColor safely
  const element: React.ReactElement<{
    style?: React.CSSProperties
    twoToneColor?: string
  }> | null =
    icon && React.isValidElement(icon)
      ? (icon as React.ReactElement<{
          style?: React.CSSProperties
          twoToneColor?: string
        }>)
      : Comp
      ? React.createElement(Comp)
      : null

  const mergedStyle: React.CSSProperties | undefined = element
    ? {
        ...(element.props.style ?? {}),
        ...(style ?? {}),
        fontSize: 54,
      }
    : undefined

  return (
    <div style={{ marginRight: 16 }} {...rest}>
      {element
        ? React.cloneElement(element, {
            style: mergedStyle,
            twoToneColor,
          })
        : null}
    </div>
  )
}

export const CardFooter: React.FC<{
  title: React.ReactNode
  value: number
  change: number
}> = ({ title, value, change }) => {
  return (
    <div style={{ position: 'relative', zIndex: 99 }}>
      <span>{title}:</span>
      <span style={{ marginLeft: 8, color: 'rgba(0,0,0,.85)' }}>
        {value.toLocaleString()}
      </span>
      <Tooltip title="Change compared to yesterday">
        <span style={{ marginLeft: 16 }}>
          <span style={{ color: 'rgba(0,0,0,.55)', marginRight: 2 }}>
            {change.toLocaleString()}
          </span>

          {change < 0 ? (
            <CaretDownOutlined
              style={{ color: '#f5222d', verticalAlign: 'text-bottom' }}
            />
          ) : (
            <CaretUpOutlined
              style={{ color: '#52c41a', verticalAlign: 'middle' }}
            />
          )}
        </span>
      </Tooltip>
    </div>
  )
}

export const ColStyled = styled(Col)`
  padding-bottom: 12px;
`

export const CardDivider = styled(Divider)`
  margin-top: 12px;
  margin-bottom: 9px;
`

export const BarContainer = styled.div`
  height: 90px;
  margin-top: 10px;
  margin-bottom: -10px;
`

export const ShadowCard = styled(CardStyled)`
  box-shadow: rgba(0, 0, 0, 0.06) 0px 9px 24px;
  border-width: 1px;
  border-style: solid;
  border-color: rgb(242, 242, 242);
  border-radius: 3px;
  transition: all 150ms ease-in-out 0s;

  &:hover {
    box-shadow: rgba(0, 0, 0, 0.1) 0px 9px 24px;
    cursor: pointer;
    transition: all 150ms ease-in-out 0s;
  }
`
