// FILE: frontend/modules/kontact/components/OpportunityList.tsx
﻿// frontend/modules/kontact/components/OpportunityList.tsx
'use client';

import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Card, Empty, List, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';

const { Text, Title } = Typography;

export interface Opportunity {
  id: string;
  title: string;
  summary?: string;
  organisation?: string;
  location?: string;
  tags?: string[];
  commitmentLevel?: string;
  participantsNeeded?: number;
  /** ISO date string or human‑readable date */
  closingDate?: string;
}

export interface OpportunityListProps {
  /**
   * Opportunities to display.
   * In the full platform this will usually come from `useOpportunities`.
   */
  opportunities: Opportunity[] | undefined;
  /**
   * Whether data is currently loading.
   * When true and there are no items yet, the Card shows a loading skeleton.
   */
  loading?: boolean;
  /**
   * Optional click handler when an opportunity is selected.
   */
  onSelect?(opportunity: Opportunity): void;
}

/**
 * Kontact – list view for collaboration / engagement opportunities.
 *
 * Pure presentational component; data is provided by a container using
 * the Kontact hooks (e.g. `useOpportunities`).
 */
export default function OpportunityList({
  opportunities,
  loading = false,
  onSelect,
}: OpportunityListProps): JSX.Element {
  const items = opportunities ?? [];

  return (
    <Card
      title="Opportunities"
      loading={loading && !items.length}
      bodyStyle={{ padding: items.length ? 0 : undefined }}
    >
      {!items.length && !loading ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No opportunities are available at the moment."
        />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
              onClick={() => onSelect?.(item)}
            >
              <List.Item.Meta
                title={
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Space wrap align="baseline">
                      <Title level={5} style={{ margin: 0 }}>
                        {item.title}
                      </Title>
                      {item.organisation && (
                        <Text type="secondary">{item.organisation}</Text>
                      )}
                    </Space>
                    <Space size="small" wrap>
                      {item.location && (
                        <Tag icon={<EnvironmentOutlined />}>{item.location}</Tag>
                      )}

                      {item.commitmentLevel && (
                        <Tag>{item.commitmentLevel}</Tag>
                      )}

                      {item.closingDate && (
                        <Tag icon={<ClockCircleOutlined />}>
                          {formatClosingDate(item.closingDate)}
                        </Tag>
                      )}

                      {typeof item.participantsNeeded === 'number' && (
                        <Tag icon={<TeamOutlined />}>
                          {item.participantsNeeded} needed
                        </Tag>
                      )}

                      {item.tags?.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </Space>
                  </Space>
                }
                description={
                  item.summary ? (
                    <Text type="secondary">{item.summary}</Text>
                  ) : null
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}

function formatClosingDate(value: string): string {
  const parsed = dayjs(value);
  if (parsed.isValid()) {
    return `Closes ${parsed.format('YYYY-MM-DD')}`;
  }
  return `Closes ${value}`;
}
