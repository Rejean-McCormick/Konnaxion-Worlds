// FILE: frontend/modules/ethikos/deliberate/[topic]/page.tsx
'use client';

import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Timeline, Typography } from 'antd';
import { useParams } from 'next/navigation';

import usePageTitle from '@/hooks/usePageTitle';
import { fetchTopicDetail } from '@/services/deliberate';

// Typage dérivé du service pour rester aligné sur la source.
type TopicDetail = Awaited<ReturnType<typeof fetchTopicDetail>>;
type Statement = TopicDetail['statements'][number];

export default function TopicDetailPage() {
  const params = useParams<{ topic: string }>();
  const topicParam = params?.topic;
  const topicId =
    typeof topicParam === 'string'
      ? topicParam
      : Array.isArray(topicParam)
      ? topicParam[0]
      : undefined;

  usePageTitle(`Deliberate · ${topicId ?? ''}`);

  // FIX: useRequest attend 2 génériques <TData, TParams>. Le service n'a pas de paramètres => [].
  const { data, loading } = useRequest<TopicDetail, []>(
    () => fetchTopicDetail(topicId!),
    { ready: !!topicId, refreshDeps: [topicId] },
  );

  return (
    <PageContainer ghost loading={loading}>
      <Typography.Title level={3}>{data?.title ?? 'Topic'}</Typography.Title>

      <ProCard title="Statements Thread" ghost>
        <Timeline
          items={(data?.statements ?? []).map((s) => ({
            key: s.id,
            children: <StatementItem s={s} />,
          }))}
        />
      </ProCard>
    </PageContainer>
  );
}

function StatementItem({ s }: { s: Statement }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
        <Typography.Text strong>{s.author}</Typography.Text>
        <Typography.Text type="secondary">
          {new Date(s.createdAt).toLocaleString()}
        </Typography.Text>
      </div>
      <Typography.Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
        {s.body}
      </Typography.Paragraph>
    </div>
  );
}
