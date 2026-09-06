// FILE: frontend/modules/ethikos/pulse/health/page.tsx
'use client'

import { Pie, Radar } from '@ant-design/plots';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';

import usePageTitle from '@/hooks/usePageTitle';
import { fetchPulseHealth } from '@/services/pulse';

export default function PulseHealth() {
  usePageTitle('Pulse · Participation Health');

  const { data, loading } = useRequest(fetchPulseHealth);

  return (
    <PageContainer ghost loading={loading}>
      <ProCard gutter={16} wrap>
        <ProCard colSpan={12} title="Diversity Radar">
          <Radar {...data?.radarConfig} />
        </ProCard>

        <ProCard colSpan={12} title="Ethics Score Breakdown">
          <Pie {...data?.pieConfig} />
        </ProCard>
      </ProCard>
    </PageContainer>
  );
}
