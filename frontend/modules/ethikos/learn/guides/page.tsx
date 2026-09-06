// FILE: frontend/modules/ethikos/learn/guides/page.tsx
'use client'

import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Anchor, Collapse, Typography } from 'antd';

import usePageTitle from '@/hooks/usePageTitle';
import { fetchGuides } from '@/services/learn';

export default function Guides() {
  usePageTitle('Learn · Guides');

  const { data, loading } = useRequest(fetchGuides);

  return (
    <PageContainer ghost loading={loading}>
      <Anchor
        affix
        items={data?.sections.map(s => ({
          key: s.id,
          href: `#${s.id}`,
          title: s.title,
        }))}
      />

      <Collapse
        accordion
        items={data?.sections.map(s => ({
          key: s.id,
          label: <Typography.Text id={s.id}>{s.title}</Typography.Text>,
          children: <Typography.Paragraph>{s.content}</Typography.Paragraph>,
        }))}
      />
    </PageContainer>
  );
}
