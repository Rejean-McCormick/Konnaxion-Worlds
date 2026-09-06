// FILE: frontend/modules/admin/hooks/useModeration.ts
﻿import { useQuery } from "@tanstack/react-query";

import { api } from "@/shared/api";

export interface ModerationItem {
  id: string;
  type: string;
  content: string;
  reason: string;
  userId: string;
  createdAt: string;
}

export default function useModeration() {
  return useQuery<ModerationItem[], Error>({
    queryKey: ["admin-moderation"],
    queryFn: async () =>
      (await api.get<ModerationItem[]>("/api/admin/moderation")).data,
    staleTime: 2 * 60_000,
    retry: 1,
  });
}
