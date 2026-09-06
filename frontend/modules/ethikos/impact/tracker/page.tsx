// FILE: frontend/modules/ethikos/impact/tracker/page.tsx
'use client';

import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Select } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';

import usePageTitle from '@/hooks/usePageTitle';
import { fetchImpactTracker, patchImpactStatus } from '@/services/impact';

dayjs.extend(relativeTime);

type TrackerRow = {
  id: string;
  title: string;
  owner: string;
  status: 'Planned' | 'In-Progress' | 'Completed' | 'Blocked';
  updatedAt: string;
};

type TrackerResponse = {
  items: TrackerRow[];
};

export default function ImpactTracker() {
  usePageTitle('Impact · Tracker');

  // ahooks: useRequest<TData, TParams>
  const { data, loading, mutate } = useRequest<TrackerResponse, []>(fetchImpactTracker);

  const onStatusChange = async (id: string, status: TrackerRow['status']) => {
    await patchImpactStatus(id, status);
    if (data) {
      mutate({
        ...data,
        items: data.items.map((r) => (r.id === id ? { ...r, status } : r)),
      });
    }
  };

  const statusOptions: { value: TrackerRow['status']; label: string }[] = [
    { value: 'Planned', label: 'Planned' },
    { value: 'In-Progress', label: 'In-Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Blocked', label: 'Blocked' },
  ];

  const columns: ProColumns<TrackerRow>[] = [
    { title: 'Title', dataIndex: 'title', width: 260 },
    { title: 'Owner', dataIndex: 'owner', width: 160 },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 180,
      render: (_, row) => (
        <Select<TrackerRow['status']>
          value={row.status}
          options={statusOptions}
          onChange={(val) => onStatusChange(row.id, val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      sorter: (a, b) => dayjs(a.updatedAt).valueOf() - dayjs(b.updatedAt).valueOf(),
      render: (_, row) => dayjs(row.updatedAt).fromNow(),
      width: 160,
    },
  ];

  return (
    <PageContainer ghost loading={loading}>
      <ProTable<TrackerRow>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        pagination={{ pageSize: 12 }}
        search={false}
      />
    </PageContainer>
  );
}
