// FILE: frontend/modules/global/pages/Search.tsx
"use client";
import { Alert, List, Spin } from "antd";
import { useSearchParams } from "next/navigation";

import AppShell from "@/global/components/AppShell";
import useGlobalSearch, { GlobalSearchResult } from "@/global/hooks/useGlobalSearch";

export default function GlobalSearchPage() {
  const q = useSearchParams().get("q") ?? "";
  const { data, isLoading, isError, error } = useGlobalSearch(q);

  return (
    <AppShell>
      {isLoading && <Spin />}
      {isError && <Alert message={error.message} type="error" />}
      {data && (
        <List<GlobalSearchResult>
          itemLayout="vertical"
          dataSource={data}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                title={<a href={item.path}>{item.title}</a>}
                description={item.snippet}
              />
            </List.Item>
          )}
        />
      )}
    </AppShell>
  );
}
