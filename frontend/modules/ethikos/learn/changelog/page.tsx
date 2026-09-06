// FILE: frontend/modules/ethikos/learn/changelog/page.tsx
'use client'

import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Tag, Timeline } from 'antd';

import usePageTitle from '@/hooks/usePageTitle';
import { fetchChangelog } from '@/services/learn';

export default function Changelog() {
  usePageTitle('Learn · Changelog');

  const { data, loading } = useRequest(fetchChangelog);

  return (
    <PageContainer ghost loading={loading}>
      <Timeline
        items={(data?.entries ?? []).map(e => ({
          label: e.date,
          children: (
            <>
              <strong>{e.version}</strong>{' '}
              {e.tags.map(t => (
                <Tag key={t} color={t === 'NEW' ? 'green' : t === 'FIX' ? 'blue' : 'default'}>
                  {t}
                </Tag>
              ))}
              <ul style={{ marginTop: 4 }}>
                {e.notes.map((n: string, i: number) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </>
          ),
        }))}
      />
    </PageContainer>
  );
}
