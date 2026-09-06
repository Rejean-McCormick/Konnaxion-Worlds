// FILE: frontend/modules/ethikos/impact/feedback/page.tsx
'use client'

import { Comment } from '@ant-design/compatible';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Button, Empty, Input, List, Rate } from 'antd';
import { useState } from 'react';

import usePageTitle from '@/hooks/usePageTitle';
import { fetchFeedback, submitFeedback } from '@/services/impact';

export default function FeedbackLoops() {
  usePageTitle('Impact · Feedback');

  const { data, loading, mutate } = useRequest(fetchFeedback);
  const [message, setMessage] = useState('');
  const [stars, setStars] = useState<number>(0);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    await submitFeedback({ body: message.trim(), rating: stars || undefined });
    setMessage('');
    setStars(0);
    mutate();
    setSending(false);
  };

  return (
    <PageContainer ghost loading={loading}>
      <ProCard title="Add your feedback" ghost>
        <Rate onChange={setStars} value={stars} />
        <Input.TextArea
          rows={3}
          placeholder="Tell us what worked or what didn’t…"
          value={message}
          onChange={e => setMessage(e.target.value)}
          style={{ marginTop: 8 }}
        />
        <Button type="primary" onClick={send} loading={sending} style={{ marginTop: 8 }}>
          Submit
        </Button>
      </ProCard>

      <ProCard title="Community Feedback" ghost style={{ marginTop: 24 }}>
        {data?.items.length ? (
          <List
            dataSource={data.items ?? []}
            renderItem={f => (
              <li>
                <Comment
                  author={f.author}
                  datetime={f.createdAt}
                  content={
                    <>
                      {f.rating !== undefined && <Rate disabled value={f.rating} />}
                      <p style={{ marginTop: 4 }}>{f.body}</p>
                    </>
                  }
                />
              </li>
            )}
          />
        ) : (
          <Empty description="No feedback yet" />
        )}
      </ProCard>
    </PageContainer>
  );
}
