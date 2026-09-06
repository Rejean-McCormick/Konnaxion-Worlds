// FILE: frontend/hooks/useExpertiseTags.ts
// hooks/useExpertiseTags.ts
'use client';

import { useQuery } from '@tanstack/react-query';

import apiRequest from '@/services/_request'; // default export

export function useExpertiseTags() {
  return useQuery({
    queryKey: ['expertise-tags'],
    queryFn: () => apiRequest.get('/expertise-tags'),   // ✅ use .get(...)
  });
}
