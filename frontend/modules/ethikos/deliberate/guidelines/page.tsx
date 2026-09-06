// FILE: frontend/modules/ethikos/deliberate/guidelines/page.tsx
'use client'

import { PageContainer } from '@ant-design/pro-components';
import { Anchor, Divider, Typography } from 'antd';

import usePageTitle from '@/hooks/usePageTitle';

export default function Guidelines() {
  usePageTitle('Deliberate · Guidelines');

  return (
    <PageContainer ghost>
      <Anchor
        affix
        items={[
          { key: 'etiquette', href: '#etiquette', title: '1. Etiquette' },
          { key: 'evidence', href: '#evidence', title: '2. Evidence Rules' },
          { key: 'moderation', href: '#moderation', title: '3. Moderation & Appeals' },
        ]}
      />

      <Typography.Title id="etiquette" level={3}>
        1. Etiquette
      </Typography.Title>
      <Typography.Paragraph>
        • Be concise, civil, and on-topic. Personal attacks and profanity are removed.
      </Typography.Paragraph>

      <Divider />

      <Typography.Title id="evidence" level={3}>
        2. Evidence Rules
      </Typography.Title>
      <Typography.Paragraph>
        • Claims must cite peer-reviewed sources or official data. Unsupported assertions can be flagged.
      </Typography.Paragraph>

      <Divider />

      <Typography.Title id="moderation" level={3}>
        3. Moderation & Appeals
      </Typography.Title>
      <Typography.Paragraph>
        • First strike = comment hidden. Second strike = 24 h read-only. Appeals via “Request review” button.
      </Typography.Paragraph>
    </PageContainer>
  );
}
