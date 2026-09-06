// FILE: frontend/modules/insights/hooks/__tests__/useReport.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useReport } from '../useReport';

// Mock the API module actually imported by useReport (`@/api`).
jest.mock('@/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({
      labels: ['A'],
      votes: [10],
      avg_score: [0.7],
    }),
  },
}));

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

test('returns mocked report data', async () => {
  const qc = createQueryClient();
  const { result } = renderHook(
    () => useReport('smart-vote', { range: '7d' }),
    { wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> }
  );

  // initial React-Query status is 'pending'
  expect(result.current.status).toBe('pending');

  // wait until data arrives
  await waitFor(() => expect(result.current.data).toBeDefined());

  expect(result.current.data?.votes).toEqual([10]);
});
