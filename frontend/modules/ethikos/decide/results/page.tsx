// FILE: frontend/modules/ethikos/decide/results/page.tsx
// C:\MyCode\Konnaxionv14\frontend\modules\ethikos\decide\results\page.tsx
'use client'

import { PageContainer, type ProColumns, ProTable } from '@ant-design/pro-components'
import { useRequest } from 'ahooks'
import { Tag } from 'antd'
import React from 'react'

import usePageTitle from '@/hooks/usePageTitle'
import { fetchDecisionResults } from '@/services/decide'

type ResultRow = {
  id: string
  title: string
  scope: 'Elite' | 'Public'
  passed: boolean
  closesAt: string
  region: string
}

export default function ResultsArchive() {
  usePageTitle('Decide · Results Archive')

  const { data, loading } = useRequest(fetchDecisionResults)

  // Build dynamic region filters from payload
  const regionFilters = React.useMemo(
    () =>
      Array.from(
        new Set(((data?.items as ResultRow[] | undefined) ?? []).map((r) => r.region).filter(Boolean)),
      ).map((r) => ({ text: String(r), value: String(r) })),
    [data?.items],
  )

  const scopeFilters = React.useMemo(
    () => [
      { text: 'Elite', value: 'Elite' },
      { text: 'Public', value: 'Public' },
    ],
    [],
  )

  const columns: ProColumns<ResultRow>[] = [
    { title: 'Title', dataIndex: 'title', width: 260 },
    {
      title: 'Result',
      dataIndex: 'passed',
      width: 120,
      render: (_, row) => (
        <Tag color={row.passed ? 'green' : 'red'}>{row.passed ? 'PASSED' : 'REJECTED'}</Tag>
      ),
      // replace invalid `filters: true` with proper options
      filters: [
        { text: 'Passed', value: true },
        { text: 'Rejected', value: false },
      ],
      // onFilter receives React.Key | boolean; compare strictly to row.passed
      onFilter: (value, row) => row.passed === (value === true || value === 'true'),
    },
    {
      title: 'Scope',
      dataIndex: 'scope',
      width: 120,
      filters: scopeFilters,
      onFilter: (value, row) => row.scope === String(value),
      valueEnum: {
        Elite: { text: 'Elite' },
        Public: { text: 'Public' },
      },
    },
    {
      title: 'Region',
      dataIndex: 'region',
      width: 140,
      filters: regionFilters,
      onFilter: (value, row) => row.region === String(value),
    },
    // use a valid ProComponents valueType
    { title: 'Closed', dataIndex: 'closesAt', valueType: 'dateTime' },
  ]

  return (
    <PageContainer ghost loading={loading}>
      <ProTable<ResultRow>
        rowKey="id"
        columns={columns}
        dataSource={(data?.items as ResultRow[] | undefined) ?? []}
        pagination={{ pageSize: 10 }}
        search={false}
      />
    </PageContainer>
  )
}
