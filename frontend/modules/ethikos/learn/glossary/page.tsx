// FILE: frontend/modules/ethikos/learn/glossary/page.tsx
'use client'

import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Input } from 'antd';
import { useState } from 'react';

import usePageTitle from '@/hooks/usePageTitle';
import { fetchGlossary } from '@/services/learn';

type Term = { id: string; term: string; definition: string };

export default function Glossary() {
  usePageTitle('Learn · Glossary');

  const { data, loading } = useRequest(fetchGlossary);
  const [query, setQuery] = useState('');

  const columns = [
    { title: 'Term', dataIndex: 'term', width: 200 },
    { title: 'Definition', dataIndex: 'definition' },
  ];

  const filtered = data?.items.filter(
    (t: Term) => t.term.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <PageContainer ghost loading={loading}>
      <Input.Search
        placeholder="Search term…"
        allowClear
        style={{ marginBottom: 16, maxWidth: 320 }}
        onChange={e => setQuery(e.target.value)}
      />

      <ProTable<Term>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 20 }}
        search={false}
      />
    </PageContainer>
  );
}
