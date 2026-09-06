// FILE: frontend/app/konnected/community-discussions/thread/[topicId]/page.tsx
'use client';

import {
  ArrowLeftOutlined,
  MessageOutlined,
  ReloadOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Empty,
  Input,
  List,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';
import api from '@/services/_request';

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

type ForumTopicApi = {
  id: number | string;
  title: string;
  category?: string | null;
  creator?: string | null;
  replies_count?: number;
  created_at: string;
  updated_at: string;
};

type ForumPostApi = {
  id: number | string;
  topic: number | string;
  author?: string | null;
  content: string;
  created_at: string;
  updated_at: string;
};

export default function KonnectedThreadDetailPage(): JSX.Element {
  const params = useParams<{ topicId: string }>();
  const router = useRouter();
  const topicId = String(params.topicId ?? '');

  const [topic, setTopic] = useState<ForumTopicApi | null>(null);
  const [posts, setPosts] = useState<ForumPostApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadThread = useCallback(async () => {
    if (!topicId) return;

    setLoading(true);
    setError(null);
    try {
      const [topicRow, postRows] = await Promise.all([
        api.get<ForumTopicApi>(`konnected/forum-topics/${topicId}/`),
        api.get<ForumPostApi[]>('konnected/forum-posts/', {
          params: { topic: topicId },
        }),
      ]);

      setTopic(topicRow);
      setPosts(postRows);
    } catch (loadError) {
      console.error('Failed to load KonnectED discussion thread', loadError);
      setError('Unable to load this discussion thread.');
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  const orderedPosts = useMemo(
    () =>
      [...posts].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [posts],
  );

  const submitReply = async () => {
    const content = reply.trim();
    if (!content) {
      message.warning('Write a reply before posting.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.post<ForumPostApi>('konnected/forum-posts/', {
        topic: Number(topicId),
        content,
      });
      setPosts((current) => [...current, created]);
      setReply('');
      message.success('Reply posted.');
    } catch (postError) {
      console.error('Failed to post KonnectED reply', postError);
      message.error('Unable to post the reply.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KonnectedPageShell
      title={topic?.title ?? 'Discussion thread'}
      subtitle="Community discussion backed by the KonnectED forum API."
      primaryAction={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() =>
            router.push('/konnected/community-discussions/active-threads')
          }
        >
          Active threads
        </Button>
      }
      secondaryActions={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void loadThread()}
          loading={loading}
        >
          Reload
        </Button>
      }
    >
      {loading && !topic ? (
        <Card>
          <Space style={{ width: '100%', justifyContent: 'center' }}>
            <Spin />
            <Text>Loading discussion…</Text>
          </Space>
        </Card>
      ) : error ? (
        <Alert
          type="error"
          showIcon
          message="Discussion unavailable"
          description={error}
          action={
            <Button size="small" onClick={() => void loadThread()}>
              Retry
            </Button>
          }
        />
      ) : topic ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Space wrap>
                {topic.category && <Tag color="blue">{topic.category}</Tag>}
                <Tag icon={<MessageOutlined />}>
                  {orderedPosts.length} post{orderedPosts.length === 1 ? '' : 's'}
                </Tag>
              </Space>
              <Text type="secondary">
                Started by {topic.creator || 'Unknown'} ·{' '}
                {new Date(topic.created_at).toLocaleString()}
              </Text>
            </Space>
          </Card>

          <Card title="Posts">
            {orderedPosts.length === 0 ? (
              <Empty description="No posts yet." />
            ) : (
              <List
                dataSource={orderedPosts}
                rowKey={(item) => String(item.id)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar>{item.author?.charAt(0) ?? '?'}</Avatar>}
                      title={
                        <Space>
                          <Text strong>{item.author || 'Unknown'}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(item.created_at).toLocaleString()}
                          </Text>
                        </Space>
                      }
                      description={
                        <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                          {item.content}
                        </Paragraph>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title="Reply">
            <Space direction="vertical" style={{ width: '100%' }}>
              <TextArea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={4}
                maxLength={5000}
                placeholder="Add a constructive reply…"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={submitting}
                onClick={() => void submitReply()}
              >
                Post reply
              </Button>
            </Space>
          </Card>
        </Space>
      ) : null}
    </KonnectedPageShell>
  );
}
