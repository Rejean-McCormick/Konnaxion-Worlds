// FILE: frontend/modules/ethikos/deliberate/elite/page.tsx
'use client';

import { FireOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProCard,
  type ProColumns,
  ProFormSelect,
  ProFormText,
  ProTable,
  StatisticCard,
} from '@ant-design/pro-components';
import { useInterval, useRequest } from 'ahooks';
import { message as antdMessage, Button, Drawer, Empty, Space, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';

import usePageTitle from '@/hooks/usePageTitle';
import { createEliteTopic, fetchEliteTopics, fetchTopicPreview } from '@/services/deliberate';
import type { Topic } from '@/types';

dayjs.extend(relativeTime);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TopicRow extends Topic {
  createdAt: string;
  lastActivity: string;
  hot: boolean;
  stanceCount: number;
}

type TopicPreview = {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  latest: Array<{ id: string; author: string; body: string }>;
};

/* ------------------------------------------------------------------ */
/*  Composant principal                                                */
/* ------------------------------------------------------------------ */

export default function EliteAgora() {
  usePageTitle('Deliberate · Elite Agora');

  // Service wrapper pour garantir { list: TopicRow[] } au typage de useRequest
  const eliteTopicsService = React.useCallback(async (): Promise<{ list: TopicRow[] }> => {
    const res = await fetchEliteTopics();
    return {
      list: (res?.list ?? []).map((value: unknown) => {
        const topic =
          value && typeof value === 'object'
            ? (value as Partial<TopicRow>)
            : {};
        return {
          ...topic,
          stanceCount:
            typeof topic.stanceCount === 'number' ? topic.stanceCount : 0,
        } as TopicRow;
      }),
    };
  }, []);

  // useRequest<TData, TParams>. Pas de params -> [].
  const { data, loading, refresh } = useRequest<{ list: TopicRow[] }, []>(eliteTopicsService);
  useInterval(refresh, 60_000);

  /* ---------- drawer preview ---------- */
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const {
    data: preview,
    loading: previewLoading,
    run: loadPreview,
  } = useRequest<TopicPreview, [string]>(fetchTopicPreview, { manual: true });

  const openPreview = React.useCallback(
    (row: TopicRow) => {
      setPreviewId(row.id);
      loadPreview(row.id);
    },
    [loadPreview],
  );

  /* ---------- KPI header ---------- */
  const headerStats = React.useMemo(
    () => [
      { label: 'Open topics', value: data?.list.length ?? 0 },
      {
        label: 'Avg stances / topic',
        value: data?.list?.length
          ? Math.round(
              data!.list.reduce((sum: number, t: TopicRow) => sum + (t.stanceCount ?? 0), 0) /
                data!.list.length,
            )
          : 0,
      },
      { label: 'Hot topics', value: (data?.list ?? []).filter((t: TopicRow) => t.hot).length },
    ],
    [data],
  );

  /* ---------- filtres de catégorie ---------- */
  const categoryFilters = React.useMemo(
    () =>
      Array.from(
        new Set((data?.list ?? []).map((t: TopicRow) => t.category).filter(Boolean)),
      ).map((c) => ({ text: String(c), value: String(c) })),
    [data?.list],
  );

  /* ---------- colonnes ---------- */
  const columns: ProColumns<TopicRow>[] = React.useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'title',
        render: (_, row) => (
          <a onClick={() => openPreview(row)} style={{ cursor: 'pointer' }}>
            {row.title}
          </a>
        ),
      },
      {
        title: 'Category',
        dataIndex: 'category',
        filters: categoryFilters,
        onFilter: (value, record) => String(record.category) === String(value),
        render: (_, row) => <Tag color="geekblue">{row.category}</Tag>,
      },
      {
        title: 'Stances',
        dataIndex: 'stanceCount',
        sorter: true,
        align: 'right',
      },
      {
        title: 'Last activity',
        dataIndex: 'lastActivity',
        // Pas de valueType "fromNow" (non standard). On formate via dayjs.
        render: (_, row) => dayjs(row.lastActivity).fromNow(),
      },
      {
        title: '',
        dataIndex: 'hot',
        width: 60,
        render: (_, row) =>
          row.hot ? (
            <Tooltip title="Trending">
              <FireOutlined style={{ color: '#fa541c' }} />
            </Tooltip>
          ) : null,
      },
    ],
    [categoryFilters, openPreview],
  );

  /* ---------- rendu ---------- */
  return (
    <PageContainer
      ghost
      loading={loading}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refresh} type="text" title="Refresh list" />
          <NewTopicButton onCreated={refresh} />
        </Space>
      }
    >
      {/* KPI */}
      <ProCard gutter={16} wrap style={{ marginBottom: 16 }}>
        {headerStats.map((k) => (
          <StatisticCard
            key={k.label}
            colSpan={{ xs: 24, sm: 8 }}
            statistic={{ title: k.label, value: k.value }}
          />
        ))}
      </ProCard>

      {/* Liste */}
      <ProTable<TopicRow>
        rowKey="id"
        columns={columns}
        dataSource={data?.list}
        search={{ labelWidth: 90, filterType: 'light' }}
        pagination={{ pageSize: 10 }}
      />

      {/* Preview drawer */}
      <Drawer
        width={520}
        open={!!previewId}
        onClose={() => setPreviewId(null)}
        title={preview?.title || 'Preview'}
      >
        {previewLoading ? (
          <Empty description="Loading…" />
        ) : preview ? (
          <>
            <p>
              <strong>Category:</strong> {preview.category}
            </p>
            <p>
              <strong>Opened:</strong> {dayjs(preview.createdAt).format('YYYY-MM-DD HH:mm')}
            </p>
            <h4>Latest statements</h4>
            <ul>
              {preview.latest.map((s) => (
                <li key={s.id}>
                  <em>{s.author}</em> — {s.body}
                </li>
              ))}
            </ul>
            <Button
              type="primary"
              onClick={() => window.location.assign(`/ethikos/deliberate/${preview.id}`)}
            >
              Go to thread →
            </Button>
          </>
        ) : (
          <Empty />
        )}
      </Drawer>
    </PageContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  New Topic modal                                                    */
/* ------------------------------------------------------------------ */

function NewTopicButton({ onCreated }: { onCreated: () => void }) {
  const [visible, setVisible] = React.useState(false);

  // On fige les Params pour typer runAsync correctement
  const { runAsync, loading } = useRequest<unknown, [{ title: string; category: string }]>(
    createEliteTopic,
    {
      manual: true,
      onSuccess: () => {
        antdMessage.success('Topic created 🎉');
        setVisible(false);
        onCreated();
      },
    },
  );

  return (
    <>
      <Button icon={<PlusOutlined />} type="primary" onClick={() => setVisible(true)}>
        New Topic
      </Button>
      <ModalForm<{ title: string; category: string }>
        title="Create new topic"
        open={visible}
        onOpenChange={setVisible}
        onFinish={async (values) => {
          await runAsync(values);
          return true;
        }}
        submitter={{ submitButtonProps: { loading } }}
      >
        <ProFormText name="title" label="Title" rules={[{ required: true, min: 10 }]} />
        <ProFormSelect
          name="category"
          label="Category"
          options={[
            { label: 'AI Policy', value: 'AI Policy' },
            { label: 'Biotech', value: 'Biotech' },
            { label: 'Ethics', value: 'Ethics' },
          ]}
          rules={[{ required: true }]}
        />
      </ModalForm>
    </>
  );
}
