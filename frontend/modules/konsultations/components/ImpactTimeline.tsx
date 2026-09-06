// FILE: frontend/modules/konsultations/components/ImpactTimeline.tsx
﻿'use client';

import { ClockCircleOutlined } from '@ant-design/icons';
import { Empty, Space, Tag, Timeline, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

export type ImpactEventKind =
  | 'opened'
  | 'phase'
  | 'engagement'
  | 'result'
  | 'follow-up'
  | 'other';

export interface ImpactEvent {
  /** Stable identifier for React keys */
  id: string;
  /** ISO datetime or human-readable date */
  when: string;
  /** Main label for the event (e.g. "Consultation opened") */
  title: string;
  /** Optional extra context shown under the title */
  detail?: string;
  /** Optional semantic type that drives colors / badges */
  kind?: ImpactEventKind;
}

export interface ImpactTimelineProps {
  /** Chronological list of impact events for a single consultation */
  events?: ImpactEvent[] | null;
  /** Optional CSS class for outer wrapper */
  className?: string;
}

const KIND_LABEL: Record<ImpactEventKind, string> = {
  opened: 'Opened',
  phase: 'Phase',
  engagement: 'Engagement',
  result: 'Result',
  'follow-up': 'Follow-up',
  other: 'Activity',
};

const KIND_COLOR: Record<ImpactEventKind, 'blue' | 'green' | 'red' | 'gray'> = {
  opened: 'blue',
  phase: 'blue',
  engagement: 'gray',
  result: 'green',
  'follow-up': 'gray',
  other: 'gray',
};

/**
 * Small, reusable timeline component to visualise the impact
 * lifecycle of a single consultation.
 *
 * Data loading (e.g. via `useImpact(consultationId)`) is handled
 * by the parent; this component is purely presentational.
 */
export default function ImpactTimeline({
  events,
  className,
}: ImpactTimelineProps) {
  const sorted = [...(events ?? [])].sort((a, b) => {
    const ta = Date.parse(a.when);
    const tb = Date.parse(b.when);
    if (Number.isNaN(ta) || Number.isNaN(tb)) {
      return a.when.localeCompare(b.when);
    }
    // Oldest first
    return ta - tb;
  });

  if (!sorted.length) {
    return (
      <div className={className}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No impact events recorded for this consultation yet."
        />
      </div>
    );
  }

  const items = sorted.map((evt) => {
    const kind: ImpactEventKind = evt.kind ?? 'other';
    const label = dayjs(evt.when).isValid()
      ? dayjs(evt.when).format('YYYY-MM-DD')
      : evt.when;

    return {
      key: evt.id,
      color: KIND_COLOR[kind],
      dot: <ClockCircleOutlined />,
      label,
      children: (
        <Space direction="vertical" size={0}>
          <Space size="small" wrap>
            <Text strong>{evt.title}</Text>
            {evt.kind && (
              <Tag color={KIND_COLOR[kind]}>{KIND_LABEL[kind]}</Tag>
            )}
          </Space>
          {evt.detail && <Text type="secondary">{evt.detail}</Text>}
        </Space>
      ),
    };
  });

  return (
    <div className={className}>
      <Timeline mode="left" items={items} />
    </div>
  );
}
