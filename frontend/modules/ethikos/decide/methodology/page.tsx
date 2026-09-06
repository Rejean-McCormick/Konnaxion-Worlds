// FILE: frontend/modules/ethikos/decide/methodology/page.tsx
'use client'

import { PageContainer } from '@ant-design/pro-components';
import { Alert, Collapse, Steps, Typography } from 'antd';

import usePageTitle from '@/hooks/usePageTitle';

export default function Methodology() {
  usePageTitle('Decide · Methodology');

  return (
    <PageContainer ghost>
      <Typography.Title>How We Count Votes</Typography.Title>

      <Collapse
        items={[
          {
            key: 'weighting',
            label: '1 · Stake-weighted counting',
            children: (
              <Typography.Paragraph>
                Each ballot is tallied with quadratic weighting to dampen plutocratic influence…
              </Typography.Paragraph>
            ),
          },
          {
            key: 'verification',
            label: '2 · Identity verification',
            children: (
              <Typography.Paragraph>
                Voters authenticate via the Desjardins meritocratic ID layer…
              </Typography.Paragraph>
            ),
          },
        ]}
      />

      <Steps
        current={3}
        items={[
          { title: 'Propose' },
          { title: 'Deliberate' },
          { title: 'Vote' },
          { title: 'Audit' },
        ]}
        style={{ marginTop: 40 }}
      />

      <Alert
        type="info"
        message="Open data"
        description="Raw ballots are published (SHA-256 hashed) after a 72-hour cooling-off period."
        showIcon
        style={{ marginTop: 24 }}
      />
    </PageContainer>
  );
}
