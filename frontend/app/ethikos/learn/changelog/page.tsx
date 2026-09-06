// FILE: frontend/app/ethikos/learn/changelog/page.tsx
'use client';

import {
  ApartmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  ProList,
  StatisticCard,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Anchor,
  Badge,
  Button,
  DatePicker,
  Empty,
  Input,
  Segmented,
  Space,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd';
import type { GetProps } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import usePageTitle from '@/hooks/usePageTitle';
import { type ChangelogEntry, fetchChangelog } from '@/services/learn';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

type RangePickerProps = GetProps<typeof RangePicker>;
type RangeValue = RangePickerProps['value'];
type ViewMode = 'timeline' | 'list';

type ChangelogResponse = {
  entries: ChangelogEntry[];
};

const TAG_COLOR: Record<string, string> = {
  NEW: 'green',
  FIX: 'blue',
  IMPROVE: 'geekblue',
  DOCS: 'gold',
  LEARN: 'cyan',
  CHORE: 'default',
  BREAKING: 'red',
  DEPRECATE: 'volcano',
  INITIAL: 'purple',
};

function normalizeTag(tag: string): string {
  return tag.trim().toUpperCase();
}

function formatDate(value: string): string {
  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : value;
}

function entryKey(entry: ChangelogEntry): string {
  return `${entry.version}-${entry.date}`;
}

export default function Changelog(): JSX.Element {
  usePageTitle('Learn · Changelog');

  const { data, loading, error, refresh } = useRequest<ChangelogResponse, []>(
    fetchChangelog,
  );

  const [query, setQuery] = useState('');
  const [range, setRange] = useState<RangeValue>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [view, setView] = useState<ViewMode>('timeline');

  const entries: ChangelogEntry[] = data?.entries ?? [];

  const sortedEntries = useMemo<ChangelogEntry[]>(
    () =>
      [...entries].sort(
        (left, right) =>
          dayjs(right.date).valueOf() - dayjs(left.date).valueOf(),
      ),
    [entries],
  );

  const allTags = useMemo<string[]>(
    () =>
      Array.from(
        new Set(
          sortedEntries.flatMap((entry) =>
            entry.tags.map((tag) => normalizeTag(tag)),
          ),
        ),
      ).sort(),
    [sortedEntries],
  );

  const filtered = useMemo<ChangelogEntry[]>(() => {
    let next = sortedEntries;

    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery) {
      next = next.filter((entry) => {
        if (entry.version.toLowerCase().includes(normalizedQuery)) {
          return true;
        }

        return entry.notes.some((note) =>
          note.toLowerCase().includes(normalizedQuery),
        );
      });
    }

    if (selectedTags.length > 0) {
      const allowedTags = new Set(selectedTags.map(normalizeTag));

      next = next.filter((entry) =>
        entry.tags
          .map((tag) => normalizeTag(tag))
          .some((tag) => allowedTags.has(tag)),
      );
    }

    if (range?.[0] && range?.[1]) {
      const start = range[0].startOf('day').valueOf();
      const end = range[1].endOf('day').valueOf();

      next = next.filter((entry) => {
        const timestamp = dayjs(entry.date).valueOf();

        return timestamp >= start && timestamp <= end;
      });
    }

    return next;
  }, [sortedEntries, query, selectedTags, range]);

  const totalEntries = filtered.length;

  const versionCount = useMemo(
    () => new Set(filtered.map((entry) => entry.version)).size,
    [filtered],
  );

  const tagCounts = useMemo<[string, number][]>(() => {
    const counts = new Map<string, number>();

    for (const entry of filtered) {
      for (const tag of entry.tags) {
        const normalized = normalizeTag(tag);
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4);
  }, [filtered]);

  const lastUpdated = useMemo<string | null>(() => {
    const firstEntry = sortedEntries[0];

    if (!firstEntry) {
      return null;
    }

    return formatDate(firstEntry.date);
  }, [sortedEntries]);

  const anchorItems = useMemo(
    () =>
      Array.from(new Set(filtered.map((entry) => entry.version))).map(
        (version) => ({
          key: version,
          href: `#ver-${version}`,
          title: version,
        }),
      ),
    [filtered],
  );

  const exportJSON = (): void => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'ethikos-changelog.json';
    link.click();

    URL.revokeObjectURL(url);
  };

  const copyMarkdown = async (): Promise<void> => {
    const markdown = filtered
      .map(
        (entry) =>
          `### ${entry.version} — ${formatDate(entry.date)}\n` +
          entry.notes.map((note) => `- ${note}`).join('\n'),
      )
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      // Clipboard can fail in insecure contexts; no user-blocking action needed.
    }
  };

  const renderTags = (tags: string[]): JSX.Element => (
    <Space size={[4, 4]} wrap>
      {tags.map((tag) => {
        const normalized = normalizeTag(tag);
        const color = TAG_COLOR[normalized] ?? 'default';

        return (
          <Tag key={normalized} color={color}>
            {normalized}
          </Tag>
        );
      })}
    </Space>
  );

  const shellTitle = 'Learn · Changelog';
  const shellSectionLabel = 'Learn';
  const shellSubtitle =
    'Versioned changes, fixes and improvements across the Ethikos layer.';

  const compactActions = (
    <Space>
      {lastUpdated && (
        <Badge
          count={
            <Tooltip title={`Last entry date ${lastUpdated}`}>
              <ClockCircleOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          }
        />
      )}

      <Button
        icon={<ReloadOutlined />}
        onClick={() => refresh()}
        type="text"
      />
    </Space>
  );

  const fullActions = (
    <Space wrap>
      {lastUpdated && (
        <Badge
          count={
            <Tooltip title={`Last entry date ${lastUpdated}`}>
              <ClockCircleOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          }
        />
      )}

      <Segmented<ViewMode>
        value={view}
        onChange={(value) => setView(value)}
        options={[
          { label: 'Timeline', value: 'timeline', icon: <CalendarOutlined /> },
          { label: 'List', value: 'list', icon: <UnorderedListOutlined /> },
        ]}
      />

      <Tooltip title="Export JSON">
        <Button icon={<DownloadOutlined />} onClick={exportJSON} size="small" />
      </Tooltip>

      <Tooltip title="Copy Markdown">
        <Button
          icon={<CopyOutlined />}
          onClick={() => void copyMarkdown()}
          size="small"
        />
      </Tooltip>

      <Tooltip title="Refresh">
        <Button
          icon={<ReloadOutlined />}
          onClick={() => refresh()}
          size="small"
        />
      </Tooltip>
    </Space>
  );

  if (loading && !data) {
    return (
      <EthikosPageShell
        title={shellTitle}
        sectionLabel={shellSectionLabel}
        subtitle={shellSubtitle}
      >
        <PageContainer ghost loading>
          <div style={{ height: 240 }} />
        </PageContainer>
      </EthikosPageShell>
    );
  }

  if (error) {
    return (
      <EthikosPageShell
        title={shellTitle}
        sectionLabel={shellSectionLabel}
        subtitle={shellSubtitle}
        secondaryActions={compactActions}
      >
        <PageContainer ghost>
          <Empty description="Failed to load changelog." />
        </PageContainer>
      </EthikosPageShell>
    );
  }

  if (!filtered.length && !loading) {
    return (
      <EthikosPageShell
        title={shellTitle}
        sectionLabel={shellSectionLabel}
        subtitle={shellSubtitle}
        secondaryActions={compactActions}
      >
        <PageContainer ghost>
          <ProCard>
            <Empty description="No changelog entries match your filters." />
          </ProCard>
        </PageContainer>
      </EthikosPageShell>
    );
  }

  return (
    <EthikosPageShell
      title={shellTitle}
      sectionLabel={shellSectionLabel}
      subtitle={shellSubtitle}
      secondaryActions={fullActions}
    >
      <PageContainer ghost loading={loading}>
        <ProCard gutter={[16, 16]} wrap style={{ marginBottom: 16 }}>
          <StatisticCard
            colSpan={{ xs: 24, sm: 12, md: 8, xl: 6 }}
            statistic={{
              title: 'Entries',
              value: totalEntries,
              description: <Text type="secondary">After filters</Text>,
            }}
          />

          <StatisticCard
            colSpan={{ xs: 24, sm: 12, md: 8, xl: 6 }}
            statistic={{
              title: 'Versions',
              value: versionCount,
              description: <Text type="secondary">In current view</Text>,
            }}
          />

          {tagCounts.map(([tag, count]) => (
            <StatisticCard
              key={tag}
              colSpan={{ xs: 24, sm: 12, md: 8, xl: 6 }}
              statistic={{
                title: (
                  <Space>
                    <Tag color={TAG_COLOR[tag] ?? 'default'}>{tag}</Tag>
                  </Space>
                ),
                value: count,
                description: <Text type="secondary">Entries with tag</Text>,
              }}
            />
          ))}
        </ProCard>

        <ProCard split="vertical" ghost>
          <ProCard
            colSpan={{ xs: 24, md: 8, lg: 7, xl: 6 }}
            title={
              <Space>
                <FilterOutlined />
                <span>Filter</span>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text type="secondary">Search</Text>
                <Input.Search
                  placeholder="Version or note text…"
                  allowClear
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>

              <div>
                <Text type="secondary">Date range</Text>
                <div style={{ marginTop: 8 }}>
                  <RangePicker
                    allowEmpty={[true, true]}
                    value={range}
                    onChange={(value) => setRange(value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <Text type="secondary">Tags</Text>
                <div style={{ marginTop: 8 }}>
                  <Space size={[6, 8]} wrap>
                    {allTags.length === 0 ? (
                      <Text type="secondary">No tags</Text>
                    ) : (
                      allTags.map((tag) => (
                        <Tag.CheckableTag
                          key={tag}
                          checked={selectedTags.includes(tag)}
                          onChange={(checked) => {
                            setSelectedTags((previous) =>
                              checked
                                ? [...previous, tag]
                                : previous.filter((item) => item !== tag),
                            );
                          }}
                        >
                          <Tag
                            color={TAG_COLOR[tag] ?? 'default'}
                            style={{ marginRight: 0 }}
                          >
                            {tag}
                          </Tag>
                        </Tag.CheckableTag>
                      ))
                    )}
                  </Space>
                </div>
              </div>

              <div>
                <Text type="secondary">Versions</Text>
                <Anchor
                  affix={false}
                  items={anchorItems}
                  style={{ marginTop: 8, maxHeight: 320, overflow: 'auto' }}
                />
              </div>
            </Space>
          </ProCard>

          <ProCard
            colSpan={{ xs: 24, md: 16, lg: 17, xl: 18 }}
            title={
              <Space>
                {view === 'timeline' ? (
                  <ApartmentOutlined />
                ) : (
                  <UnorderedListOutlined />
                )}
                <span>Changelog entries</span>
              </Space>
            }
          >
            {view === 'timeline' ? (
              <Timeline
                mode="left"
                items={filtered.map((entry, index) => ({
                  key: `${entryKey(entry)}-${index}`,
                  label: formatDate(entry.date),
                  dot: <CalendarOutlined />,
                  children: (
                    <div
                      id={`ver-${entry.version}`}
                      style={{ scrollMarginTop: 72 }}
                    >
                      <Space
                        direction="vertical"
                        size="small"
                        style={{ width: '100%' }}
                      >
                        <Space size="small" align="center" wrap>
                          <Title level={5} style={{ margin: 0 }}>
                            {entry.version}
                          </Title>
                          {renderTags(entry.tags)}
                        </Space>

                        <ul style={{ marginTop: 4 }}>
                          {entry.notes.map((note, noteIndex) => (
                            <li key={`${entryKey(entry)}-note-${noteIndex}`}>
                              <Text>{note}</Text>
                            </li>
                          ))}
                        </ul>
                      </Space>
                    </div>
                  ),
                }))}
              />
            ) : (
              <ProList<ChangelogEntry>
                rowKey={(row) => entryKey(row)}
                dataSource={filtered}
                split
                pagination={{ pageSize: 10, showSizeChanger: false }}
                metas={{
                  title: {
                    render: (_dom, row) => (
                      <Space size="small" wrap>
                        <Text strong>{row.version}</Text>
                        <Tag icon={<CalendarOutlined />}>
                          {formatDate(row.date)}
                        </Tag>
                      </Space>
                    ),
                  },
                  subTitle: {
                    render: (_dom, row) => renderTags(row.tags),
                  },
                  description: {
                    render: (_dom, row) => (
                      <ul style={{ marginTop: 4 }}>
                        {row.notes.map((note, index) => (
                          <li key={`${entryKey(row)}-list-note-${index}`}>
                            <Text>{note}</Text>
                          </li>
                        ))}
                      </ul>
                    ),
                  },
                }}
              />
            )}
          </ProCard>
        </ProCard>
      </PageContainer>
    </EthikosPageShell>
  );
}