// FILE: frontend/modules/kontact/components/ProfileCard.tsx
﻿'use client';

import {
  EnvironmentOutlined,
  MessageOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Card, Space, Tag, Tooltip, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

/**
 * Minimal, module-local representation of a profile surfaced by the Kontact
 * connect center (KeenKonnect / KonnectED).
 *
 * This is intentionally UI-focused: it only exposes the fields needed
 * to render a rich card. The data can come from any backend endpoint.
 */
export interface KontactProfileSummary {
  id: string;
  /** Display name shown as the main title */
  name: string;
  /** Short headline/tagline, e.g. "AI ethics researcher · Product lead" */
  headline?: string;
  /** Optional avatar URL */
  avatarUrl?: string | null;
  /** Organization or team, e.g. "Konnaxion Labs" */
  organization?: string | null;
  /** Free-form location, e.g. "Paris, France" */
  location?: string | null;
  /** Short bio / focus areas. Keep this reasonably small (1–3 lines). */
  bio?: string | null;
  /** Key expertise tags (max a handful – UI truncates if many). */
  expertiseTags?: string[];
  /** Additional interests (optional, not always shown). */
  interests?: string[];
  /** Optional Ekoh trust score (0–100 or similar scale). */
  ekohScore?: number;
  /**
   * Optional SmartVote weight (e.g. 1.0, 1.5, 2.0) derived from Ekoh.
   * Only shown when different from 1.0.
   */
  smartVoteWeight?: number;
  /** Human-readable last activity, e.g. "2 days ago" or "Just now". */
  lastActiveAgo?: string;
  /** Whether this profile is explicitly open for new collaborations. */
  isOpenToCollab?: boolean;
}

export interface ProfileCardProps {
  profile: KontactProfileSummary;
  /**
   * Called when user clicks "View profile".
   * The parent is responsible for routing (e.g. using next/navigation).
   */
  onViewProfile?: (profile: KontactProfileSummary) => void;
  /** Optional CTA to start a connection / request. */
  onConnect?: (profile: KontactProfileSummary) => void;
  /** Optional CTA to start a direct message or chat. */
  onMessage?: (profile: KontactProfileSummary) => void;
  /** Compact variant used in dense lists. */
  compact?: boolean;
  /** Allow parent to hide the footer actions completely. */
  showActions?: boolean;
}

/**
 * Presentational profile card for the Kontact module.
 *
 * Used by:
 * - ConnectCenter (profile discovery / matching)
 * - PublicProfile (summary view of a single profile)
 *
 * This component is deliberately dumb: it does not fetch data and does not
 * know about routing. It simply renders the provided `profile` and forwards
 * callbacks for primary actions.
 */
const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onViewProfile,
  onConnect,
  onMessage,
  compact = false,
  showActions = true,
}) => {
  const {
    name,
    headline,
    avatarUrl,
    organization,
    location,
    bio,
    expertiseTags = [],
    ekohScore,
    smartVoteWeight,
    lastActiveAgo,
    isOpenToCollab,
  } = profile;

  const avatarInitial =
    (typeof name === 'string' && name.trim().charAt(0).toUpperCase()) || '?';

  const hasTags = expertiseTags.length > 0;
  const showBio = !compact && !!bio;
  const maxTags = compact ? 3 : 6;
  const visibleTags = expertiseTags.slice(0, maxTags);
  const hiddenCount = expertiseTags.length - visibleTags.length;

  const showFooter =
    showActions &&
    (onViewProfile != null || onConnect != null || onMessage != null || !!lastActiveAgo);

  return (
    <Card
      hoverable
      bodyStyle={{ padding: compact ? 16 : 20 }}
      style={{ width: '100%' }}
    >
      <Space direction="vertical" size={compact ? 8 : 12} style={{ width: '100%' }}>
        {/* Header: avatar + name + meta */}
        <div style={{ display: 'flex', gap: 16 }}>
          <Avatar
            size={compact ? 40 : 56}
            src={avatarUrl ?? undefined}
            alt={name}
            icon={!avatarUrl && <UserOutlined />}
          >
            {!avatarUrl && avatarInitial}
          </Avatar>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Space size={8} wrap>
                <Text
                  strong
                  style={{
                    fontSize: compact ? 14 : 16,
                    lineHeight: 1.25,
                  }}
                >
                  {name}
                </Text>

                {typeof isOpenToCollab === 'boolean' && (
                  <Tag color={isOpenToCollab ? 'green' : 'default'}>
                    {isOpenToCollab ? 'Open to collaboration' : 'Not actively looking'}
                  </Tag>
                )}

                {typeof ekohScore === 'number' && !Number.isNaN(ekohScore) && (
                  <Tooltip title="Ekoh trust score used inside KeenKonnect decisions">
                    <Tag color="gold">Ekoh {Math.round(ekohScore)}</Tag>
                  </Tooltip>
                )}

                {typeof smartVoteWeight === 'number' &&
                  !Number.isNaN(smartVoteWeight) &&
                  smartVoteWeight !== 1 && (
                    <Tooltip title="SmartVote influence weight from Ekoh reputation">
                      <Tag color="purple">Weight ×{smartVoteWeight.toFixed(1)}</Tag>
                    </Tooltip>
                  )}
              </Space>

              {headline && (
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {headline}
                </Text>
              )}

              {(organization || location) && (
                <Space size={8} wrap style={{ marginTop: 2 }}>
                  {organization && (
                    <Tag icon={<TeamOutlined />} color="default">
                      {organization}
                    </Tag>
                  )}
                  {location && (
                    <Tag icon={<EnvironmentOutlined />} color="default">
                      {location}
                    </Tag>
                  )}
                </Space>
              )}
            </Space>
          </div>
        </div>

        {/* Bio */}
        {showBio && (
          <Text
            type="secondary"
            style={{
              fontSize: 13,
              display: 'block',
              marginTop: 2,
              maxHeight: compact ? 40 : 60,
              overflow: 'hidden',
            }}
          >
            {bio}
          </Text>
        )}

        {/* Expertise tags */}
        {hasTags && (
          <Space size={[4, 4]} wrap style={{ marginTop: compact ? 4 : 6 }}>
            {visibleTags.map((tag) => (
              <Tag key={tag} color="blue">
                {tag}
              </Tag>
            ))}
            {hiddenCount > 0 && (
              <Tag>+{hiddenCount} more</Tag>
            )}
          </Space>
        )}

        {/* Footer: activity + actions */}
        {showFooter && (
          <div
            style={{
              marginTop: compact ? 4 : 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {lastActiveAgo && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Active {lastActiveAgo}
              </Text>
            )}

            <Space size={8} wrap>
              {onViewProfile && (
                <Button
                  size="small"
                  type="link"
                  icon={<UserOutlined />}
                  onClick={() => onViewProfile(profile)}
                >
                  View profile
                </Button>
              )}

              {onConnect && (
                <Button
                  size="small"
                  type="primary"
                  icon={<TeamOutlined />}
                  onClick={() => onConnect(profile)}
                >
                  Connect
                </Button>
              )}

              {onMessage && (
                <Button
                  size="small"
                  icon={<MessageOutlined />}
                  onClick={() => onMessage(profile)}
                >
                  Message
                </Button>
              )}
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default ProfileCard;
