// FILE: frontend/app/ethikos/trust/badges/page.tsx
'use client';

import { PageContainer, ProCard, ProList } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Badge as AntBadge,
  Divider,
  Empty,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import { fetchTrustBadges } from '@/services/trust';
import type {
  Badge as TrustBadge,
  TrustBadgePayload,
} from '@/services/trust';

const { Text, Paragraph } = Typography;

type SortOrder = 'newest' | 'oldest';
type TimeFilter = 'all' | '90d' | '365d';
type CatalogCategory = 'Stances' | 'Arguments' | 'Voting';
type CatalogCategoryFilter = CatalogCategory | 'All';
type CatalogShow = 'all' | 'earned' | 'locked';

interface CatalogItem {
  id: string;
  label: string;
  description: string;
  category: CatalogCategory;
  requirement: string;
}

interface CatalogRow extends CatalogItem {
  earned: boolean;
  progress: number;
  earnedAt?: string;
}

const BADGE_CATEGORY_META: Record<
  string,
  { label: CatalogCategory; color: string }
> = {
  'first-stance': { label: 'Stances', color: 'blue' },
  'argument-builder': { label: 'Arguments', color: 'purple' },
  'active-voter': { label: 'Voting', color: 'green' },
};

const BADGE_CATALOG: CatalogItem[] = [
  {
    id: 'first-stance',
    label: 'First stance',
    description: 'Recorded your first stance in a debate.',
    category: 'Stances',
    requirement: 'Post at least one stance in any Ethikos debate.',
  },
  {
    id: 'argument-builder',
    label: 'Argument builder',
    description: 'Contributed at least 5 arguments to debates.',
    category: 'Arguments',
    requirement: 'Publish 5+ arguments across debates.',
  },
  {
    id: 'active-voter',
    label: 'Active voter',
    description: 'Cast at least 10 weighted votes across the platform.',
    category: 'Voting',
    requirement: 'Submit 10+ weighted votes on proposals.',
  },
];

function getBadgeLabel(badge: TrustBadge): string {
  return badge.label || badge.title || badge.id;
}

function getBadgeDate(badge: TrustBadge): string | undefined {
  return badge.earnedAt ?? badge.createdAt;
}

function formatDate(value?: string): string {
  if (!value) {
    return 'Not earned yet';
  }

  const date = dayjs(value);

  if (!date.isValid()) {
    return value;
  }

  return date.format('MMM D, YYYY');
}

function isWithinTimeFilter(badge: TrustBadge, timeFilter: TimeFilter): boolean {
  if (timeFilter === 'all') {
    return true;
  }

  const badgeDate = getBadgeDate(badge);

  if (!badgeDate) {
    return false;
  }

  const parsed = dayjs(badgeDate);

  if (!parsed.isValid()) {
    return true;
  }

  const days = timeFilter === '90d' ? 90 : 365;

  return parsed.isAfter(dayjs().subtract(days, 'day'));
}

function sortBadges(a: TrustBadge, b: TrustBadge, sortOrder: SortOrder): number {
  const aTime = getBadgeDate(a) ? dayjs(getBadgeDate(a)).valueOf() : 0;
  const bTime = getBadgeDate(b) ? dayjs(getBadgeDate(b)).valueOf() : 0;

  return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
}

function badgeCategory(badgeId: string): CatalogCategory {
  return BADGE_CATEGORY_META[badgeId]?.label ?? 'Voting';
}

function badgeCategoryColor(badgeId: string): string {
  return BADGE_CATEGORY_META[badgeId]?.color ?? 'default';
}

function badgeProgressValue(badge: TrustBadge): number {
  if (badge.earned) {
    return 100;
  }

  if (!Number.isFinite(badge.progress)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(badge.progress)));
}

export default function TrustBadgesPage(): JSX.Element {
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [catalogCategory, setCatalogCategory] =
    useState<CatalogCategoryFilter>('All');
  const [catalogShow, setCatalogShow] = useState<CatalogShow>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [detail, setDetail] = useState<TrustBadge | null>(null);

  const {
    data,
    loading,
    error,
    refresh,
  } = useRequest<TrustBadgePayload, []>(fetchTrustBadges);

  const earnedBadges = useMemo<TrustBadge[]>(
    () => data?.earned ?? [],
    [data],
  );

  const progressBadges = useMemo<TrustBadge[]>(
    () => data?.progress ?? [],
    [data],
  );

  const allBadges = useMemo<TrustBadge[]>(
    () => [...earnedBadges, ...progressBadges],
    [earnedBadges, progressBadges],
  );

  const earnedIds = useMemo(
    () => new Set(earnedBadges.map((badge) => badge.id)),
    [earnedBadges],
  );

  const visibleEarnedBadges = useMemo(
    () =>
      earnedBadges
        .filter((badge) => isWithinTimeFilter(badge, timeFilter))
        .sort((a, b) => sortBadges(a, b, sortOrder)),
    [earnedBadges, sortOrder, timeFilter],
  );

  const catalogRows = useMemo<CatalogRow[]>(() => {
    const byId = new Map(allBadges.map((badge) => [badge.id, badge]));

    return BADGE_CATALOG.map((catalogItem) => {
      const badge = byId.get(catalogItem.id);
      const earned = badge?.earned ?? earnedIds.has(catalogItem.id);

      return {
        ...catalogItem,
        earned,
        progress: badge ? badgeProgressValue(badge) : 0,
        earnedAt: badge?.earnedAt ?? badge?.createdAt,
      };
    });
  }, [allBadges, earnedIds]);

  const filteredCatalogRows = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();

    return catalogRows.filter((row) => {
      const matchesCategory =
        catalogCategory === 'All' || row.category === catalogCategory;

      const matchesShow =
        catalogShow === 'all' ||
        (catalogShow === 'earned' && row.earned) ||
        (catalogShow === 'locked' && !row.earned);

      const matchesSearch =
        query.length === 0 ||
        row.label.toLowerCase().includes(query) ||
        row.description.toLowerCase().includes(query) ||
        row.requirement.toLowerCase().includes(query);

      return matchesCategory && matchesShow && matchesSearch;
    });
  }, [catalogCategory, catalogRows, catalogSearch, catalogShow]);

  const earnedCount = earnedBadges.length;
  const progressCount = progressBadges.length;
  const totalCatalogCount = BADGE_CATALOG.length;
  const completionRate =
    totalCatalogCount > 0
      ? Math.round((earnedCount / totalCatalogCount) * 100)
      : 0;

  const detailMeta = detail ? BADGE_CATEGORY_META[detail.id] : undefined;

  const secondaryActions: ReactNode = (
    <Space wrap>
      <Tag color="green">{earnedCount} earned</Tag>
      <Tag color="blue">{progressCount} in progress</Tag>
      <Tag color="purple">{completionRate}% complete</Tag>
    </Space>
  );

  return (
    <EthikosPageShell
      title="Badges"
      sectionLabel="Trust"
      subtitle="Track Ethikos trust badges earned through stances, arguments, and voting activity."
      secondaryActions={secondaryActions}
    >
      <PageContainer ghost loading={loading}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <ProCard gutter={16} wrap>
            <ProCard colSpan={{ xs: 24, md: 8 }}>
              <Statistic title="Earned badges" value={earnedCount} />
            </ProCard>

            <ProCard colSpan={{ xs: 24, md: 8 }}>
              <Statistic title="In progress" value={progressCount} />
            </ProCard>

            <ProCard colSpan={{ xs: 24, md: 8 }}>
              <Statistic
                suffix="%"
                title="Catalog completion"
                value={completionRate}
              />
            </ProCard>
          </ProCard>

          <ProCard
            bordered
            title="Your badges"
            extra={
              <Space wrap>
                <Select<TimeFilter>
                  size="small"
                  value={timeFilter}
                  style={{ width: 130 }}
                  onChange={setTimeFilter}
                  options={[
                    { label: 'All time', value: 'all' },
                    { label: 'Last 90 days', value: '90d' },
                    { label: 'Last year', value: '365d' },
                  ]}
                />

                <Select<SortOrder>
                  size="small"
                  value={sortOrder}
                  style={{ width: 130 }}
                  onChange={setSortOrder}
                  options={[
                    { label: 'Newest first', value: 'newest' },
                    { label: 'Oldest first', value: 'oldest' },
                  ]}
                />
              </Space>
            }
          >
            {error ? (
              <Empty
                description="Unable to load trust badges."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Typography.Link onClick={() => refresh()}>
                  Retry
                </Typography.Link>
              </Empty>
            ) : visibleEarnedBadges.length === 0 && !loading ? (
              <Empty
                description="No earned badges match the current filters."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <ProList<TrustBadge>
                rowKey="id"
                dataSource={visibleEarnedBadges}
                loading={loading}
                pagination={{
                  pageSize: 6,
                  showSizeChanger: false,
                }}
                metas={{
                  title: {
                    render: (_dom, badge) => (
                      <Space wrap>
                        <Text strong>{getBadgeLabel(badge)}</Text>
                        <Tag color={badgeCategoryColor(badge.id)}>
                          {badgeCategory(badge.id)}
                        </Tag>
                      </Space>
                    ),
                  },
                  description: {
                    render: (_dom, badge) => (
                      <Space direction="vertical" size={2}>
                        <Text type="secondary">{badge.description}</Text>
                        <Text type="secondary">
                          Earned {formatDate(getBadgeDate(badge))}
                        </Text>
                      </Space>
                    ),
                  },
                  avatar: {
                    render: (_dom, badge) => (
                      <AntBadge
                        status={badge.earned ? 'success' : 'default'}
                        text={badge.earned ? 'Earned' : 'Locked'}
                      />
                    ),
                  },
                  actions: {
                    render: (_dom, badge) => [
                      <Typography.Link
                        key="details"
                        onClick={() => setDetail(badge)}
                      >
                        Details
                      </Typography.Link>,
                    ],
                  },
                }}
              />
            )}
          </ProCard>

          <ProCard
            bordered
            title="Badge catalog"
            extra={
              <Space wrap>
                <Input.Search
                  allowClear
                  size="small"
                  placeholder="Search badges"
                  style={{ width: 220 }}
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                />

                <Select<CatalogCategoryFilter>
                  size="small"
                  value={catalogCategory}
                  style={{ width: 140 }}
                  onChange={setCatalogCategory}
                  options={[
                    { label: 'All categories', value: 'All' },
                    { label: 'Stances', value: 'Stances' },
                    { label: 'Arguments', value: 'Arguments' },
                    { label: 'Voting', value: 'Voting' },
                  ]}
                />

                <Select<CatalogShow>
                  size="small"
                  value={catalogShow}
                  style={{ width: 130 }}
                  onChange={setCatalogShow}
                  options={[
                    { label: 'All', value: 'all' },
                    { label: 'Earned', value: 'earned' },
                    { label: 'Locked', value: 'locked' },
                  ]}
                />
              </Space>
            }
          >
            {filteredCatalogRows.length === 0 ? (
              <Empty
                description="No catalog badges match the current filters."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <ProList<CatalogRow>
                rowKey="id"
                dataSource={filteredCatalogRows}
                pagination={{
                  pageSize: 6,
                  showSizeChanger: false,
                }}
                metas={{
                  title: {
                    render: (_dom, row) => (
                      <Space wrap>
                        <Text strong>{row.label}</Text>
                        <Tag
                          color={BADGE_CATEGORY_META[row.id]?.color ?? 'default'}
                        >
                          {row.category}
                        </Tag>
                        {row.earned ? (
                          <Tag color="success">Earned</Tag>
                        ) : (
                          <Tag>Locked</Tag>
                        )}
                      </Space>
                    ),
                  },
                  description: {
                    render: (_dom, row) => (
                      <Space
                        direction="vertical"
                        size={4}
                        style={{ width: '100%' }}
                      >
                        <Text type="secondary">{row.description}</Text>
                        <Text>{row.requirement}</Text>

                        {!row.earned && (
                          <Progress
                            size="small"
                            percent={row.progress}
                            status={row.progress > 0 ? 'active' : 'normal'}
                          />
                        )}

                        {row.earned && row.earnedAt && (
                          <Text type="secondary">
                            Earned {formatDate(row.earnedAt)}
                          </Text>
                        )}
                      </Space>
                    ),
                  },
                }}
              />
            )}
          </ProCard>

          <ProCard bordered title="How badges are used">
            <Paragraph type="secondary">
              Badges are derived from Ethikos participation signals such as
              stances, arguments, and voting. They are trust context signals and
              do not replace Ethikos stance values, argument impact votes, or
              Smart Vote readings.
            </Paragraph>

            <Divider />

            <Space wrap>
              <Tag color="blue">Stances</Tag>
              <Tag color="purple">Arguments</Tag>
              <Tag color="green">Voting</Tag>
            </Space>
          </ProCard>
        </Space>

        <Modal
          open={!!detail}
          title={detail ? getBadgeLabel(detail) : 'Badge details'}
          footer={null}
          onCancel={() => setDetail(null)}
        >
          {detail && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap>
                <Tag color={detailMeta?.color ?? 'default'}>
                  {detailMeta?.label ?? badgeCategory(detail.id)}
                </Tag>
                {detail.earned ? (
                  <Tag color="success">Earned</Tag>
                ) : (
                  <Tag>Locked</Tag>
                )}
              </Space>

              <Paragraph>{detail.description}</Paragraph>

              <div>
                <Text strong>Progress</Text>
                <Progress percent={badgeProgressValue(detail)} />
              </div>

              <div>
                <Text strong>Earned date</Text>
                <Paragraph type="secondary">
                  {formatDate(getBadgeDate(detail))}
                </Paragraph>
              </div>
            </Space>
          )}
        </Modal>
      </PageContainer>
    </EthikosPageShell>
  );
}