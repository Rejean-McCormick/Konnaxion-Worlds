// FILE: frontend/modules/konsultations/pages/ConsultationHub.tsx
﻿'use client';

import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Alert, Typography } from 'antd';

import usePageTitle from '@/hooks/usePageTitle';

import {
  ConsultationForm,
  ConsultationList,
  ConsultationVotePanel,
  ImpactTimeline,
  ResultsDashboard,
  SuggestionBoard,
} from '../components';

const { Title, Paragraph, Text } = Typography;

export default function ConsultationHub(): JSX.Element {
  usePageTitle('Konsultations · Consultation Hub');

  return (
    <PageContainer ghost>
      {/* Intro / context */}
      <ProCard ghost style={{ marginBottom: 16 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          Consultation Hub
        </Title>
        <Paragraph type="secondary">
          Central hub for participatory consultations: discover open topics, take part in votes,
          review results, and follow how decisions translate into real-world impact.
        </Paragraph>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          message="How this hub is structured"
          description={
            <Text>
              The blocks below are wired to dedicated Konsultations components (list, vote,
              results, impact, suggestions). Each widget can evolve independently while keeping a
              single entry point for consultations.
            </Text>
          }
        />
      </ProCard>

      {/* Main layout */}
      <ProCard gutter={16} wrap>
        {/* Open consultations + create new */}
        <ProCard
          title="Open consultations"
          colSpan={{ xs: 24, md: 16 }}
          bordered
        >
          {/* List of active / upcoming consultations */}
          <ConsultationList />
        </ProCard>

        <ProCard
          title="Start a new consultation"
          colSpan={{ xs: 24, md: 8 }}
          bordered
        >
          {/* Wizard / form to launch a new consultation */}
          <ConsultationForm />
        </ProCard>

        {/* Participation panel */}
        <ProCard
          title="Participate in a consultation"
          colSpan={{ xs: 24 }}
          bordered
        >
          {/* Voting / stance capture for the currently focused consultation */}
          <ConsultationVotePanel />
        </ProCard>

        {/* Results + impact */}
        <ProCard
          title="Results & analytics"
          colSpan={{ xs: 24, md: 12 }}
          bordered
        >
          {/* High-level KPIs, charts, breakdowns */}
          <ResultsDashboard />
        </ProCard>

        <ProCard
          title="Impact over time"
          colSpan={{ xs: 24, md: 12 }}
          bordered
        >
          {/* Timeline of how decisions are implemented and updated */}
          <ImpactTimeline />
        </ProCard>

        {/* Suggestions / qualitative input */}
        <ProCard
          title="Suggestions from participants"
          colSpan={{ xs: 24 }}
          bordered
        >
          {/* Board for proposed improvements, comments, ideas */}
          <SuggestionBoard suggestions={[]} />
        </ProCard>
      </ProCard>
    </PageContainer>
  );
}
