// FILE: frontend/modules/ethikos/admin/roles/page.tsx
'use client'

import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useRequest } from 'ahooks'
import { Switch, Tag } from 'antd'
import type { ReactNode } from 'react'

import usePageTitle from '@/hooks/usePageTitle'
import { fetchRoles, type RolePayload, type RoleRow, toggleRole } from '@/services/admin'

export default function RoleManagement() {
  usePageTitle('Admin · Role Management')

  // Fix TS2558: ahooks v3 expects 2 generics: <Data, ParamsTuple>
  // No params → params tuple is []
  const { data, loading, refresh } = useRequest<RolePayload, []>(fetchRoles)

  const columns: ProColumns<RoleRow>[] = [
    { title: 'Role', dataIndex: 'name', width: 200 },
    {
      title: 'Users',
      dataIndex: 'userCount',
      width: 100,
      render: (dom: ReactNode) => <Tag>{dom}</Tag>,
    },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      width: 120,
      render: (_: ReactNode, row: RoleRow) => (
        <Switch
          checked={row.enabled}
          onChange={async (checked: boolean) => {
            await toggleRole(row.id, checked)
            refresh() // typed as () => void by ahooks
          }}
        />
      ),
    },
  ]

  return (
    <PageContainer ghost loading={loading}>
      <ProTable<RoleRow>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={false}
        search={false}
      />
    </PageContainer>
  )
}
