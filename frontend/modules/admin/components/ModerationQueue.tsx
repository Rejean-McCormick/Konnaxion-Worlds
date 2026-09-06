// FILE: frontend/modules/admin/components/ModerationQueue.tsx
﻿"use client";
import { Alert, Card, List, Spin, Tag } from "antd";
import React from "react";

import useModeration, { ModerationItem } from "@/admin/hooks/useModeration";

function ModerationQueue() {
  const { data, isLoading, isError, error } = useModeration();

  if (isLoading) return <Spin />;
  if (isError) return <Alert message={error.message} type="error" />;

  return (
    <Card title="Moderation Queue" style={{ marginTop: 16 }}>
      <List<ModerationItem>
        itemLayout="vertical"
        dataSource={data}
        renderItem={(item) => (
          <List.Item key={item.id}>
            <List.Item.Meta
              title={
                <>
                  <Tag>{item.type}</Tag> by {item.userId}
                </>
              }
              description={new Date(item.createdAt).toLocaleString()}
            />
            <p>{item.content}</p>
            <p>
              <strong>Reason:</strong> {item.reason}
            </p>
          </List.Item>
        )}
      />
    </Card>
  );
}

export default ModerationQueue;
