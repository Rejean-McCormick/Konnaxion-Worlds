// FILE: frontend/app/kreative/idea-incubator/collaborate-on-ideas/page.tsx
// app/kreative/idea-incubator/collaborate-on-ideas/page.tsx
'use client';

import { Alert, Badge, Button, Input, List, Select, Space, Typography } from 'antd';
import React, { useMemo, useState } from 'react';

import KreativePageShell from '@/app/kreative/kreativePageShell';

const { Title, Text } = Typography;

interface Idea {
  id: string;
  title: string;
  status: 'Seeking Collaboration' | 'In Progress';
  dateCreated: string; // YYYY-MM-DD
  newActivity: boolean;
}

const PREVIEW_IDEAS: Idea[] = [
  {
    id: '1',
    title: 'Revolutionary App Concept',
    status: 'Seeking Collaboration',
    dateCreated: '2025-11-20',
    newActivity: true,
  },
  {
    id: '2',
    title: 'Sustainable Energy Initiative',
    status: 'In Progress',
    dateCreated: '2025-10-15',
    newActivity: false,
  },
  {
    id: '3',
    title: 'Urban Gardening Project',
    status: 'Seeking Collaboration',
    dateCreated: '2025-11-01',
    newActivity: true,
  },
];

type StatusFilter = 'All' | Idea['status'];

export default function CollaborateOnIdeasPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('All');

  const filteredIdeas = useMemo<Idea[]>(() => {
    let ideas = PREVIEW_IDEAS;

    if (selectedStatus !== 'All') {
      ideas = ideas.filter((idea) => idea.status === selectedStatus);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      ideas = ideas.filter((idea) => idea.title.toLowerCase().includes(q));
    }

    return ideas;
  }, [searchQuery, selectedStatus]);

  return (
    <KreativePageShell
      title="Collaborate on Ideas"
      subtitle="Discover community ideas and join as a collaborator."
    >
      <Alert
        type="info"
        showIcon
        message="Idea collaboration preview"
        description="This surface uses a declared preview dataset because no dedicated idea/showcase persistence contract exists in the current backend. Preview records are not presented as persisted state."
        style={{ marginBottom: 16 }}
      />
      <Space
        direction="vertical"
        size="middle"
        style={{ width: '100%', marginBottom: 24 }}
      >
        <Space>
          <Input
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select<StatusFilter>
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            style={{ width: 220 }}
            options={[
              { value: 'All', label: 'All Status' },
              { value: 'Seeking Collaboration', label: 'Seeking Collaboration' },
              { value: 'In Progress', label: 'In Progress' },
            ]}
          />
        </Space>
      </Space>

      <List
        itemLayout="vertical"
        dataSource={filteredIdeas}
        renderItem={(idea) => (
          <List.Item
            key={idea.id}
            actions={[
              <Button key="edit" type="primary" disabled>
                Edit unavailable
              </Button>,
              <Button key="view" disabled>
                View preview
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  {idea.newActivity && (
                    <Badge count="New" style={{ backgroundColor: '#52c41a' }} />
                  )}
                  <Title level={4} style={{ margin: 0 }}>
                    {idea.title}
                  </Title>
                </Space>
              }
              description={
                <>
                  <Text type="secondary">Status: {idea.status}</Text>
                  <br />
                  <Text type="secondary">
                    Created on: {idea.dateCreated}
                  </Text>
                </>
              }
            />
          </List.Item>
        )}
      />
    </KreativePageShell>
  );
}
