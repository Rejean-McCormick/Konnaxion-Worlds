// FILE: frontend/modules/ethikos/pulse/live/page.tsx
'use client';

import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Badge, Space } from 'antd';
import { useEffect } from 'react';

import ChartCard from '@/components/charts/ChartCard';
import usePageTitle from '@/hooks/usePageTitle';
import { fetchPulseLiveData } from '@/services/pulse';

type LoosePulseChartPoint = {
  x?: string | number;
  y?: number;
  ts?: string | number;
  date?: string | number;
  value?: number;
  count?: number;
};

function normalizePulseChartData(history: LoosePulseChartPoint[] = []) {
  return history.map((point, index) => ({
    x: point.x ?? point.ts ?? point.date ?? index,
    y: point.y ?? point.value ?? point.count ?? 0,
  }));
}

export default function PulseLive(): JSX.Element {
  usePageTitle('Pulse · Live Metrics');

  // Single polling source only.
  const { data, loading, refresh } = usePulseLive(true);

  // Refresh once when the tab becomes visible again.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh]);

  const counters = data?.counters ?? [];

  return (
    <PageContainer ghost loading={loading}>
      <ProCard gutter={16} wrap>
        {counters.map((counter) => {
          const trend = counter.trend ?? 0;

          return (
            <StatisticCard
              key={counter.label}
              statistic={{
                title: (
                  <Space>
                    {counter.label}
                    <Badge
                      status={
                        trend > 0
                          ? 'success'
                          : trend < 0
                            ? 'error'
                            : 'default'
                      }
                    />
                  </Space>
                ),
                value: counter.value,
                precision: 0,
              }}
              chart={
                <ChartCard
                  type="line"
                  data={normalizePulseChartData(counter.history)}
                  height={50}
                />
              }
            />
          );
        })}
      </ProCard>
    </PageContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  Local data-fetching hook                                          */
/* ------------------------------------------------------------------ */

function usePulseLive(polling = false) {
  return useRequest(fetchPulseLiveData, {
    pollingInterval: polling ? 20_000 : undefined,
  });
}