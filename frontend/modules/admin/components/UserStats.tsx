// FILE: frontend/modules/admin/components/UserStats.tsx
"use client";
import { Alert, Card, Descriptions, Spin } from "antd";
import React from "react";

import useStats from "@/admin/hooks/useStats";

export default function UserStats() {
  const { data, isLoading, isError, error } = useStats();
  if (isLoading) return <Spin />;
  if (isError)   return <Alert message={error.message} type="error" />;
  if (!data)     return null;                         // TS18048 safe‑guard

  return (
    <Card title="User Statistics">
      <Descriptions column={1}>
        <Descriptions.Item label="Total users">{data.totalUsers}</Descriptions.Item>
        <Descriptions.Item label="Active users">{data.activeUsers}</Descriptions.Item>
        {data.newUsers != null && (
          <Descriptions.Item label="New users (24 h)">
            {data.newUsers}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
}
