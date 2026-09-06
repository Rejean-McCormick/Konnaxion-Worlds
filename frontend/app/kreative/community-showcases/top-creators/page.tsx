// FILE: frontend/app/kreative/community-showcases/top-creators/page.tsx
// C:\MyCode\Konnaxionv14\frontend\app\kreative\community-showcases\top-creators\page.tsx
'use client';

import { TrophyOutlined } from '@ant-design/icons';
import { Avatar, Button, Select, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import KreativePageShell from '@/app/kreative/kreativePageShell';

const { Title, Text } = Typography;

type TimeFrame = 'all-time' | 'this-month';

interface Creator {
  id: string;
  name: string;
  avatar: string;
  contributions: number;
  specialty: string;
}

const creatorsData: Creator[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    avatar: 'https://via.placeholder.com/80.png?text=A',
    contributions: 125,
    specialty: 'Digital Art',
  },
  {
    id: '2',
    name: 'Bob Smith',
    avatar: 'https://via.placeholder.com/80.png?text=B',
    contributions: 110,
    specialty: 'Photography',
  },
  {
    id: '3',
    name: 'Carol Lee',
    avatar: 'https://via.placeholder.com/80.png?text=C',
    contributions: 105,
    specialty: 'Mixed Media',
  },
  {
    id: '4',
    name: 'David Kim',
    avatar: 'https://via.placeholder.com/80.png?text=D',
    contributions: 95,
    specialty: 'Painting',
  },
  {
    id: '5',
    name: 'Eva Martinez',
    avatar: 'https://via.placeholder.com/80.png?text=E',
    contributions: 88,
    specialty: 'Illustration',
  },
];

export default function TopCreatorsPage(): JSX.Element {
  const router = useRouter();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('all-time');

  const data = useMemo<Creator[]>(() => {
    return timeFrame === 'this-month' ? creatorsData.slice(0, 3) : creatorsData;
  }, [timeFrame]);

  const columns: ColumnsType<Creator> = [
    {
      title: 'Rank',
      key: 'rank',
      width: 80,
      render: (_value, _record, index) =>
        index < 3 ? (
          <TrophyOutlined style={{ fontSize: 20, color: '#faad14' }} />
        ) : (
          <Text>{index + 1}</Text>
        ),
    },
    {
      title: 'Creator',
      key: 'creator',
      width: 250,
      render: (_value, record) => (
        <Space>
          <Avatar src={record.avatar} />
          <Button
            type="link"
            onClick={() => router.push(`/kreative/profile/${record.id}`)}
          >
            {record.name}
          </Button>
        </Space>
      ),
    },
    {
      title: 'Contributions',
      dataIndex: 'contributions',
      key: 'contributions',
      width: 150,
      render: (value: number) => <Text>{value}</Text>,
    },
    {
      title: 'Specialty',
      dataIndex: 'specialty',
      key: 'specialty',
    },
  ];

  const timeframeSelector = (
    <Space>
      <Text strong>Filter by timeframe:</Text>
      <Select
        value={timeFrame}
        onChange={(value: TimeFrame) => setTimeFrame(value)}
        style={{ width: 180 }}
        options={[
          { value: 'all-time', label: 'All Time' },
          { value: 'this-month', label: 'This Month' },
        ]}
      />
    </Space>
  );

  return (
    <KreativePageShell
      title="Top Creators"
      subtitle="Leaderboard of creators with the most contributions across community showcases."
      secondaryActions={timeframeSelector}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>
          Leaderboard
        </Title>

        <Table<Creator>
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Space>
    </KreativePageShell>
  );
}
