// FILE: frontend/components/dashboard/TeamBuilderCard.tsx
// C:\MyCode\Konnaxionv14\frontend\components\dashboard\TeamBuilderCard.tsx
'use client';

import {
  ArrowRightOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Card, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import React from 'react';

const { Title, Paragraph, Text } = Typography;

export interface TeamBuilderCardProps {
  /**
   * Optional override for the title.
   * Defaults to "AI-powered Team Builder".
   */
  title?: string;
  /**
   * Optional compact mode (for tighter dashboard grids).
   */
  compact?: boolean;
}

/**
 * Dashboard card that promotes / deep-links into the Team Builder experience.
 * Intended to sit alongside other dashboard-components cards.
 */
const TeamBuilderCard: React.FC<TeamBuilderCardProps> = ({
  title = 'AI-powered Team Builder',
  compact = false,
}) => {
  return (
    <Card
      bordered={false}
      bodyStyle={{
        padding: compact ? 16 : 20,
      }}
    >
      <Space
        direction="vertical"
        size={compact ? 8 : 12}
        style={{ width: '100%' }}
      >
        <Space align="center">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(37, 99, 235, 0.06))',
            }}
          >
            <TeamOutlined style={{ fontSize: 20, color: '#4f46e5' }} />
          </div>

          <div>
            <Title level={5} style={{ margin: 0 }}>
              {title}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Let AI assemble balanced teams from your candidate pool.
            </Text>
          </div>
        </Space>

        <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
          Configure a builder session, pick candidates, and generate
          collaboration-ready teams in a few clicks. Ideal for projects,
          debate panels, learning cohorts, and more.
        </Paragraph>

        <Space size={6} wrap>
          <Tag icon={<ThunderboltOutlined />} color="purple">
            AI-assisted matching
          </Tag>
          <Tag color="blue">Cross-module ready</Tag>
          <Tag color="default">Transparent criteria</Tag>
        </Space>

        <div
          style={{
            display: 'flex',
            marginTop: 4,
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Start from scratch or continue an existing session.
            </Text>
          </div>

          <Link href="/teambuilder" passHref legacyBehavior>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              size={compact ? 'small' : 'middle'}
            >
              Open Team Builder
            </Button>
          </Link>
        </div>
      </Space>
    </Card>
  );
};

export default TeamBuilderCard;
