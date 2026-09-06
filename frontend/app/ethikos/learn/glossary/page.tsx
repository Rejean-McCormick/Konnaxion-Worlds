// FILE: frontend/app/ethikos/learn/glossary/page.tsx
'use client';

import { DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Empty,
  Input,
  Segmented,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import { fetchGlossary, type GlossaryItem } from '@/services/learn';

const { Text, Paragraph } = Typography;

type GlossaryPayload = {
  items: GlossaryItem[];
};

type LetterFilter = 'all' | '#' | string;

function getInitial(term?: string): string {
  const first = (term?.trim()?.[0] ?? '').toUpperCase();

  if (first >= 'A' && first <= 'Z') {
    return first;
  }

  return '#';
}

function escapeCsvCell(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

function buildGlossaryCsv(items: GlossaryItem[]): string {
  const header = ['Term', 'Definition'];
  const rows = items.map((item) => [
    item.term ?? '',
    item.definition ?? '',
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');
}

function downloadGlossaryCsv(items: GlossaryItem[]): void {
  const csv = buildGlossaryCsv(items);
  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = 'ethikos-glossary.csv';
  anchor.click();

  URL.revokeObjectURL(url);
}

export default function Glossary(): JSX.Element {
  const [query, setQuery] = useState('');
  const [letter, setLetter] = useState<LetterFilter>('all');

  const {
    data,
    loading,
    error,
    refresh,
  } = useRequest<GlossaryPayload, []>(fetchGlossary);

  const items = useMemo<GlossaryItem[]>(() => data?.items ?? [], [data]);

  const letters = useMemo<{ label: string; value: string }[]>(() => {
    const availableLetters = new Set<string>();

    items.forEach((item) => {
      availableLetters.add(getInitial(item.term));
    });

    const result: { label: string; value: string }[] = [
      { label: 'All', value: 'all' },
    ];

    if (availableLetters.has('#')) {
      result.push({ label: '#', value: '#' });
    }

    for (let code = 65; code <= 90; code += 1) {
      const value = String.fromCharCode(code);

      if (availableLetters.has(value)) {
        result.push({ label: value, value });
      }
    }

    return result;
  }, [items]);

  const filteredByQuery = useMemo<GlossaryItem[]>(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => {
      const term = item.term.toLowerCase();
      const definition = item.definition.toLowerCase();

      return (
        term.includes(normalizedQuery) ||
        definition.includes(normalizedQuery)
      );
    });
  }, [items, query]);

  const filtered = useMemo<GlossaryItem[]>(() => {
    if (letter === 'all') {
      return filteredByQuery;
    }

    return filteredByQuery.filter((item) => getInitial(item.term) === letter);
  }, [filteredByQuery, letter]);

  const hasActiveFilters = query.trim().length > 0 || letter !== 'all';

  const columns: ProColumns<GlossaryItem>[] = [
    {
      title: 'Term',
      dataIndex: 'term',
      width: 280,
      sorter: (left, right) =>
        left.term.localeCompare(right.term, undefined, {
          sensitivity: 'base',
        }),
      render: (_dom, row) => (
        <Space size={8} wrap>
          <Tag>{getInitial(row.term)}</Tag>
          <Text strong>{row.term}</Text>
        </Space>
      ),
    },
    {
      title: 'Definition',
      dataIndex: 'definition',
      ellipsis: true,
      render: (_dom, row) => (
        <Paragraph style={{ marginBottom: 0 }}>
          {row.definition || 'No definition available.'}
        </Paragraph>
      ),
    },
  ];

  const secondaryActions = (
    <Space wrap>
      <Tooltip title="Reload glossary terms from the Learn service">
        <Button
          icon={<SyncOutlined />}
          onClick={() => refresh()}
          loading={loading}
        >
          Refresh
        </Button>
      </Tooltip>

      <Tooltip title="Export the currently visible glossary rows">
        <Button
          icon={<DownloadOutlined />}
          disabled={filtered.length === 0}
          onClick={() => downloadGlossaryCsv(filtered)}
        >
          Export CSV
        </Button>
      </Tooltip>
    </Space>
  );

  return (
    <EthikosPageShell
      title="Glossary"
      sectionLabel="Learn"
      subtitle="Definitions for the core Ethikos concepts used across Deliberate, Decide, Pulse, Trust, and Impact."
      secondaryActions={secondaryActions}
    >
      <PageContainer ghost loading={loading}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {error && (
            <Alert
              type="warning"
              showIcon
              message="Glossary unavailable"
              description="The Learn glossary service did not respond. The page will recover automatically once the service is available."
            />
          )}

          <Space
            align="center"
            style={{
              width: '100%',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
          >
            <Space size="large" wrap>
              <Statistic title="Total terms" value={items.length} />
              <Statistic title="Visible terms" value={filtered.length} />
              <Statistic title="Letters" value={Math.max(letters.length - 1, 0)} />
            </Space>

            <Input.Search
              allowClear
              value={query}
              placeholder="Search terms or definitions"
              style={{ width: 320 }}
              onChange={(event) => setQuery(event.target.value)}
              onSearch={(value) => setQuery(value)}
            />
          </Space>

          <Segmented<string>
            value={letter}
            options={letters}
            onChange={(value) => setLetter(value)}
          />

          {items.length === 0 && !loading ? (
            <Empty
              description={
                error
                  ? 'Unable to load glossary terms.'
                  : 'No glossary terms are available yet.'
              }
            />
          ) : filtered.length === 0 ? (
            <Empty
              description={
                hasActiveFilters
                  ? 'No glossary terms match the current filters.'
                  : 'No glossary terms are available yet.'
              }
            />
          ) : (
            <ProTable<GlossaryItem>
              rowKey="id"
              columns={columns}
              dataSource={filtered}
              search={false}
              options={false}
              pagination={{
                pageSize: 12,
                showSizeChanger: true,
                showTotal: (total) => `${total} terms`,
              }}
              toolBarRender={() => [
                <Text key="hint" type="secondary">
                  Terms are sourced from the Ethikos Learn service and category
                  metadata when available.
                </Text>,
              ]}
            />
          )}
        </Space>
      </PageContainer>
    </EthikosPageShell>
  );
}