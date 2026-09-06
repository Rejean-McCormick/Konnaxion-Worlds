// FILE: frontend/modules/konsultations/components/SuggestionsBoard.tsx
﻿// modules/konsultations/components/SuggestionsBoard.tsx
'use client';

import {
  ClockCircleOutlined,
  CommentOutlined,
  DislikeOutlined,
  LikeOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Empty,
  List,
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';

const { Text, Paragraph } = Typography;

/* ------------------------------------------------------------------ */
/*  Domain types                                                       */
/* ------------------------------------------------------------------ */

export type SuggestionStatus = 'new' | 'under-review' | 'accepted' | 'rejected';

export type SuggestionsSortKey = 'most-supported' | 'newest' | 'oldest';

export interface Suggestion {
  id: string;
  /** Short label for the suggestion (can be same as first sentence of body) */
  title: string;
  /** Main suggestion body / explanation */
  body: string;
  author: string;
  createdAt: string; // ISO string
  /** Number of supporting signals (votes, endorsements, etc.) */
  upvotes: number;
  /** Optional number of opposing signals */
  downvotes?: number;
  /** Optional number of comments / replies */
  commentsCount?: number;
  status: SuggestionStatus;
  /** Optional thematic tags (e.g. "Budget", "Governance") */
  tags?: string[];
}

export interface SuggestionsBoardProps {
  suggestions: Suggestion[];
  loading?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Initial status filter; defaults to "all" */
  defaultStatusFilter?: SuggestionStatus | 'all';
  /** Initial sort; defaults to "most-supported" */
  defaultSort?: SuggestionsSortKey;
  /** Optional callback when user clicks support / oppose */
  onVote?: (id: string, direction: 'up' | 'down') => void;
  /** Optional callback to open a full suggestion view */
  onOpenSuggestion?: (suggestion: Suggestion) => void;
}

type StatusFilter = SuggestionStatus | 'all';

const STATUS_LABELS: Record<SuggestionStatus, string> = {
  new: 'New',
  'under-review': 'Under review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<SuggestionStatus, string> = {
  new: 'default',
  'under-review': 'processing',
  accepted: 'success',
  rejected: 'error',
};

const DEFAULT_STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'under-review', label: 'Under review' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

const SORT_OPTIONS: { value: SuggestionsSortKey; label: string }[] = [
  { value: 'most-supported', label: 'Most supported' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SuggestionsBoard({
  suggestions,
  loading = false,
  emptyMessage = 'No suggestions have been submitted yet.',
  defaultStatusFilter = 'all',
  defaultSort = 'most-supported',
  onVote,
  onOpenSuggestion,
}: SuggestionsBoardProps): JSX.Element {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(defaultStatusFilter);
  const [sortKey, setSortKey] = useState<SuggestionsSortKey>(defaultSort);

  const items = Array.isArray(suggestions) ? suggestions : [];

  const filteredAndSorted = useMemo(() => {
    let list = items;

    if (statusFilter !== 'all') {
      list = list.filter((s) => s.status === statusFilter);
    }

    const sorted = [...list];

    sorted.sort((a, b) => {
      if (sortKey === 'newest') {
        return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
      }
      if (sortKey === 'oldest') {
        return dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf();
      }

      // most-supported: sort by support score (upvotes - downvotes), fallback to newest
      const scoreA = a.upvotes - (a.downvotes ?? 0);
      const scoreB = b.upvotes - (b.downvotes ?? 0);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
    });

    return sorted;
  }, [items, statusFilter, sortKey]);

  const hasData = items.length > 0;

  return (
    <Card
      title="Suggestions"
      loading={loading && !hasData}
      extra={
        <Space size="middle" wrap>
          <Segmented
            size="small"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as StatusFilter)}
            options={DEFAULT_STATUS_FILTER_OPTIONS}
          />
          <Select<SuggestionsSortKey>
            size="small"
            style={{ minWidth: 160 }}
            value={sortKey}
            onChange={(val) => setSortKey(val)}
            options={SORT_OPTIONS}
          />
        </Space>
      }
    >
      {!hasData && !loading ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={emptyMessage}
        />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={filteredAndSorted}
          renderItem={(item) => {
            const created = dayjs(item.createdAt);
            const hasDownvotes = typeof item.downvotes === 'number';
            const hasComments = typeof item.commentsCount === 'number';

            return (
              <List.Item key={item.id}>
                <Space
                  direction="vertical"
                  size={6}
                  style={{ width: '100%' }}
                >
                  <Space wrap>
                    <Text strong>{item.title}</Text>
                    <Tag color={STATUS_COLORS[item.status]}>
                      {STATUS_LABELS[item.status]}
                    </Tag>
                    {item.tags?.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>

                  <Paragraph
                    type="secondary"
                    style={{ marginBottom: 4 }}
                    ellipsis={{ rows: 3 }}
                  >
                    {item.body}
                  </Paragraph>

                  <Space
                    size={16}
                    wrap
                    style={{ fontSize: 12 }}
                  >
                    <Text type="secondary">
                      <ClockCircleOutlined /> {created.format('YYYY-MM-DD HH:mm')}
                    </Text>
                    <Text type="secondary">By {item.author}</Text>
                  </Space>

                  <Space size={12} wrap>
                    <Tooltip title="Support this suggestion">
                      <Button
                        size="small"
                        icon={<LikeOutlined />}
                        onClick={() => onVote?.(item.id, 'up')}
                      >
                        {item.upvotes}
                      </Button>
                    </Tooltip>

                    {hasDownvotes && (
                      <Tooltip title="Express reservations">
                        <Button
                          size="small"
                          icon={<DislikeOutlined />}
                          onClick={() => onVote?.(item.id, 'down')}
                        >
                          {item.downvotes}
                        </Button>
                      </Tooltip>
                    )}

                    {hasComments && (
                      <Tooltip title="Comments">
                        <span>
                          <CommentOutlined /> {item.commentsCount}
                        </span>
                      </Tooltip>
                    )}

                    {onOpenSuggestion && (
                      <Button
                        size="small"
                        type="link"
                        onClick={() => onOpenSuggestion(item)}
                      >
                        Open details
                      </Button>
                    )}
                  </Space>
                </Space>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
}
