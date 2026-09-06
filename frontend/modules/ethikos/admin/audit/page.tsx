// FILE: frontend/modules/ethikos/admin/audit/page.tsx
// C:\MyCode\Konnaxionv14\frontend\modules\ethikos\admin\audit\page.tsx
'use client';

import { PageContainer, type ProColumns, ProTable } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Tag } from 'antd';

import usePageTitle from '@/hooks/usePageTitle';
import { fetchAuditLogs, type LogRow } from '@/services/audit';

export default function AuditLogs() {
  usePageTitle('Admin · Audit Logs');

  const { data, loading } = useRequest(fetchAuditLogs);

  const columns: ProColumns<LogRow>[] = [
    {
      title: 'Time',
      dataIndex: 'ts',
      valueType: 'dateTime',
      width: 180,
      sorter: true,
    },
    {
      title: 'Actor',
      dataIndex: 'actor',
      width: 120,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 200,
    },
    {
      title: 'Target',
      dataIndex: 'target',
      ellipsis: true,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      width: 120,
      render: (_, row) => (
        <Tag
          color={
            row.severity === 'critical'
              ? 'red'
              : row.severity === 'warn'
              ? 'orange'
              : 'blue'
          }
        >
          {row.severity}
        </Tag>
      ),
      filters: [
        { text: 'Info', value: 'info' },
        { text: 'Warn', value: 'warn' },
        { text: 'Critical', value: 'critical' },
      ],
      onFilter: (value, record) => record.severity === value,
    },
  ];

  return (
    <PageContainer ghost loading={loading}>
      <ProTable<LogRow>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        pagination={{ pageSize: 15 }}
        search={false}
      />
    </PageContainer>
  );
}
