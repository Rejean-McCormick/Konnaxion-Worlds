// FILE: frontend/components/dashboard-components/StatisticCard.tsx
// C:\MyCode\Konnaxionv14\frontend\components\dashboard-components\StatisticCard.tsx
'use client';

import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { Card, Skeleton, Statistic, Tooltip, Typography } from 'antd';
import React from 'react';
import type { CSSProperties, ReactNode } from 'react';

const { Text } = Typography;

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface StatisticCardProps {
  /** Main label for the metric (preferred). */
  label?: ReactNode;
  /** Backwards‑compat: legacy title prop, falls back to `label` if provided. */
  title?: ReactNode;

  /** Primary numeric value for the metric. */
  value: number | null | undefined;

  /** Decimal precision for the main value. */
  precision?: number;

  /** Suffix for the main value (%, ms, pts, etc.). */
  suffix?: ReactNode;

  /** Optional icon shown next to the label. */
  icon?: ReactNode;

  /** Small helper text under the main value. */
  description?: ReactNode;

  /**
   * Delta / variation vs previous period (usually in percentage points).
   * Example: +12.5 means “up 12.5%”.
   */
  delta?: number | null;

  /**
   * Direction of the trend. If omitted, it is inferred from `delta`
   * (positive → up, negative → down, zero → neutral).
   */
  trend?: TrendDirection;

  /** Optional label explaining the delta (“vs last 30 days”, etc.). */
  deltaLabel?: ReactNode;

  /** Show a loading skeleton instead of the numeric content. */
  loading?: boolean;

  /** Make the card clickable. */
  onClick?: () => void;

  /** Allow callers to tweak the outer card style. */
  style?: CSSProperties;
}

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const getTrend = (delta: number, explicit?: TrendDirection): TrendDirection => {
  if (explicit) return explicit;
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'neutral';
};

const StatisticCard: React.FC<StatisticCardProps> = ({
  label,
  title,
  value,
  precision,
  suffix,
  icon,
  description,
  delta,
  trend,
  deltaLabel,
  loading = false,
  onClick,
  style,
}) => {
  const hasValue = isFiniteNumber(value);

  const effectiveTrend =
    delta != null && isFiniteNumber(delta) ? getTrend(delta, trend) : null;

  const trendColor =
    effectiveTrend === 'up'
      ? '#3f8600'
      : effectiveTrend === 'down'
      ? '#cf1322'
      : 'var(--ant-color-text-secondary, rgba(0,0,0,.45))';

  return (
    <Card
      bordered={false}
      bodyStyle={{ padding: 16 }}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        background: 'var(--ant-color-bg-container)',
        ...style,
      }}
      onClick={onClick}
    >
      {/* Header: icon + label */}
      {(label ?? title) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 4,
            gap: 8,
          }}
        >
          {icon && (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              {icon}
            </span>
          )}
          <Text
            style={{
              fontSize: 14,
              color: 'var(--ant-color-text-secondary, rgba(0,0,0,.65))',
            }}
          >
            {label ?? title}
          </Text>
        </div>
      )}

      {/* Main value */}
      {loading ? (
        <Skeleton
          active
          title={{ width: '60%' }}
          paragraph={false}
          style={{ marginTop: 4, marginBottom: 4 }}
        />
      ) : (
        <Statistic
          value={hasValue ? value! : 0}
          precision={hasValue ? precision : undefined}
          suffix={hasValue ? suffix : undefined}
          valueStyle={{
            fontSize: 28,
            fontWeight: 500,
            color: 'var(--ant-color-text, rgba(0,0,0,.85))',
          }}
          formatter={
            hasValue
              ? undefined
              : () => (
                  <span
                    style={{
                      color:
                        'var(--ant-color-text-disabled, rgba(0,0,0,.25))',
                    }}
                  >
                    —
                  </span>
                )
          }
        />
      )}

      {/* Helper text */}
      {description && !loading && (
        <Text
          type="secondary"
          style={{ display: 'block', marginTop: 4, fontSize: 12 }}
        >
          {description}
        </Text>
      )}

      {/* Delta / trend */}
      {effectiveTrend && delta != null && isFiniteNumber(delta) && !loading && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
          <Tooltip
            title={deltaLabel ?? 'Change over the comparison period'}
          >
            <span style={{ color: trendColor }}>
              {effectiveTrend === 'up' && (
                <CaretUpOutlined style={{ marginRight: 4 }} />
              )}
              {effectiveTrend === 'down' && (
                <CaretDownOutlined style={{ marginRight: 4 }} />
              )}
              {Math.abs(delta).toLocaleString(undefined, {
                minimumFractionDigits:
                  typeof precision === 'number' ? precision : 1,
                maximumFractionDigits:
                  typeof precision === 'number' ? precision : 1,
              })}
              <span style={{ marginLeft: 2 }}>%</span>
              {deltaLabel && (
                <span
                  style={{
                    marginLeft: 6,
                    color:
                      'var(--ant-color-text-secondary, rgba(0,0,0,.45))',
                  }}
                >
                  {deltaLabel}
                </span>
              )}
            </span>
          </Tooltip>
        </div>
      )}
    </Card>
  );
};

export default StatisticCard;
