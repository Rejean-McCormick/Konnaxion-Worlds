// FILE: frontend/app/search/GlobalSearchClient.tsx
'use client';

import {
  Alert,
  Card,
  Empty,
  Input,
  List,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { TabsProps } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getWorldKeyFromPathname, withWorldPath } from '@/lib/worlds';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

type SearchResult = {
  id: string;
  title: string;
  snippet: string;
  path: string;
};

type SearchResponseBody =
  | { results: SearchResult[] }
  | { error: string };

const MIN_QUERY_LENGTH = 2;

export default function GlobalSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const worldKey = getWorldKeyFromPathname(pathname);

  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Initialise from ?q=… if present
  useEffect(() => {
    const initial = searchParams.get('q') ?? '';
    if (initial) {
      setQuery(initial);
      if (initial.trim().length >= MIN_QUERY_LENGTH) {
        void runSearch(initial);
      }
    }
     
  }, [searchParams]);

  const runSearch = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      setError(null);

      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      if (trimmed.length < MIN_QUERY_LENGTH) {
        setResults([]);
        setHasSearched(false);
        setError(`Type at least ${MIN_QUERY_LENGTH} characters to search.`);
        return;
      }

      setLoading(true);
      setHasSearched(true);

      try {
        const params = new URLSearchParams();
        params.set('q', trimmed);

        // Keep URL in sync
        const url = withWorldPath(`/search?${params.toString()}`, worldKey);
        router.replace(url);

        if (worldKey) params.set('world', worldKey);
        const res = await fetch(`/_api/search?${params.toString()}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          let message = `Search failed with status ${res.status}.`;
          try {
            const data = (await res.json()) as SearchResponseBody;
            if ('error' in data && typeof data.error === 'string') {
              message = data.error;
            }
          } catch {
            // ignore JSON parse errors
          }
          setResults([]);
          setError(message);
          return;
        }

        const data = (await res.json()) as SearchResponseBody;
        if ('results' in data && Array.isArray(data.results)) {
          setResults(data.results);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
        setError('Unable to perform search. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [router, worldKey],
  );

  const handleSearch = (value: string) => {
    setQuery(value);
    void runSearch(value);
  };

  const handleResultClick = (item: SearchResult) => {
    const target = item.path;
    if (!target) return;

    if (target.startsWith('http://') || target.startsWith('https://')) {
      if (typeof window !== 'undefined') {
        window.open(target, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    router.push(withWorldPath(target, worldKey));
  };

  const getTypeTag = (id: string) => {
    if (id.startsWith('route:')) return <Tag>Route</Tag>;
    if (id.startsWith('knowledge:')) return <Tag>Knowledge</Tag>;
    return <Tag>Other</Tag>;
  };

  const renderList = (items: SearchResult[]) => {
    if (!items.length) return <Empty description="No results" />;

    return (
      <List
        itemLayout="vertical"
        dataSource={items}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            onClick={() => handleResultClick(item)}
            style={{ cursor: 'pointer' }}
          >
            <Space
              direction="vertical"
              size={4}
              style={{ width: '100%' }}
            >
              <Space align="baseline" size="small">
                <Text strong>{item.title}</Text>
                {getTypeTag(item.id)}
              </Space>
              <Text type="secondary">{item.snippet}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {item.path}
              </Text>
            </Space>
          </List.Item>
        )}
      />
    );
  };

  const { routeResults, knowledgeResults, otherResults } = useMemo(() => {
    const route = results.filter((r) => r.id.startsWith('route:'));
    const knowledge = results.filter((r) =>
      r.id.startsWith('knowledge:'),
    );
    const other = results.filter(
      (r) =>
        !r.id.startsWith('route:') &&
        !r.id.startsWith('knowledge:'),
    );

    return {
      routeResults: route,
      knowledgeResults: knowledge,
      otherResults: other,
    };
  }, [results]);

  const tabs: TabsProps['items'] = useMemo(
    () => [
      {
        key: 'all',
        label: `All (${results.length})`,
        children: renderList(results),
      },
      {
        key: 'routes',
        label: `Navigation (${routeResults.length})`,
        children: renderList(routeResults),
      },
      {
        key: 'knowledge',
        label: `Learning (${knowledgeResults.length})`,
        children: renderList(knowledgeResults),
      },
      {
        key: 'other',
        label: `Other (${otherResults.length})`,
        children: renderList(otherResults),
      },
    ],
    [results, routeResults, knowledgeResults, otherResults],
  );

  return (
    <div className="container mx-auto p-5" style={{ maxWidth: 1200 }}>
      <div className="mb-4">
        <Title level={2}>Krowd Navigator</Title>
        <Paragraph type="secondary">
          Global search across routes and KonnectED knowledge resources.
        </Paragraph>
      </div>

      <Card className="mb-4">
        <Search
          placeholder="Search topics, pages, and learning resources…"
          allowClear
          enterButton="Search"
          size="large"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={handleSearch}
        />
        {!hasSearched && !error && (
          <Paragraph type="secondary" style={{ marginTop: 12 }}>
            Tip: start typing a module name (EkoH, ethiKos, keenKonnect,
            KonnectED, Kreative) or a topic to jump directly to a page or
            resource.
          </Paragraph>
        )}
      </Card>

      {error && (
        <Alert
          type="error"
          message="Search error"
          description={error}
          showIcon
          className="mb-4"
        />
      )}

      <Card>
        {loading ? (
          <div
            style={{
              padding: '40px 0',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Spin size="large" />
          </div>
        ) : !hasSearched && !results.length ? (
          <Empty
            description="Type a query above to search across Konnaxion."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Tabs items={tabs} />
        )}
      </Card>
    </div>
  );
}
