// FILE: frontend/modules/admin/hooks/useStats.ts
﻿import { useQuery } from "@tanstack/react-query";

import { api } from "@/shared/api";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsers?: number;
}

export default function useStats() {
  return useQuery<AdminStats, Error>({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get<AdminStats>("/api/admin/stats")).data,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
