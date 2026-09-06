// FILE: frontend/modules/ethikos/decide/elite/page.tsx
// C:\MyCode\Konnaxionv14\frontend\modules\ethikos\decide\elite\page.tsx
// Code d’origine récupéré depuis le dump (File #22). :contentReference[oaicite:0]{index=0}

'use client';

import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Progress, Statistic } from 'antd';
import dayjs from 'dayjs';

import usePageTitle from '@/hooks/usePageTitle';
import { fetchEliteBallots } from '@/services/decide';
import type { Ballot } from '@/types';

type BallotRow = Ballot & { turnout: number };

export default function EliteBallots(): JSX.Element {
  usePageTitle('Decide · Elite Ballots');

  const { data, loading } = useRequest(fetchEliteBallots);

  const columns: ProColumns<BallotRow>[] = [
    { title: 'Title', dataIndex: 'title', width: 260 },
    {
      title: 'Closes In',
      dataIndex: 'closesAt',
      width: 180,
      // ProTable render signature: (dom, entity, index, action, schema)
      render: (_dom, record) => (
        <Statistic.Countdown
          value={dayjs(record.closesAt).valueOf()}
          format="D[d] HH:mm:ss"
        />
      ),
    },
    {
      title: 'Turnout',
      dataIndex: 'turnout',
      width: 160,
      // ProTable render signature: (dom, entity, index, action, schema)
      render: (_dom, record) => <Progress type="circle" percent={record.turnout} />,
    },
    { title: 'Scope', dataIndex: 'scope', width: 100 },
  ];

  return (
    <PageContainer ghost loading={loading}>
      <ProTable<BallotRow>
        rowKey="id"
        columns={columns}
        dataSource={data?.ballots as BallotRow[] | undefined}
        pagination={{ pageSize: 8 }}
        search={false}
      />
    </PageContainer>
  );
}
