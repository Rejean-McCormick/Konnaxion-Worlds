// FILE: frontend/modules/konsultations/pages/ConsultationDetailPage.tsx
﻿'use client';

import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Alert, Empty, Result, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import {
  ConsultationForm,
  ImpactTimeline,
  ResultsChart,
  SuggestionBoard,
} from '@/modules/konsultations/components';
import {
  useConsultationResults,
  useImpact,
  useSuggestions,
} from '@/modules/konsultations/hooks';

const { Paragraph, Text } = Typography;

// Infer the ImpactTimeline event item type from the component props
type ImpactEvent = NonNullable<
  React.ComponentProps<typeof ImpactTimeline>['events']
>[number];

export interface ConsultationDetailProps {
  consultationId: string | number;
}

const ConsultationDetailPage: React.FC<ConsultationDetailProps> = ({
  consultationId,
}) => {
  // Primary source of consultation metadata (title, status, dates, etc.)
  const {
    data: impact,
    isLoading: impactLoading,
    isError: impactIsError,
    error: impactError,
  } = useImpact(consultationId);

  // Aggregated stance results for this consultation
  const {
    data: results,
    isLoading: resultsLoading,
    isError: resultsIsError,
    error: resultsError,
  } = useConsultationResults(consultationId);

  // Citizen suggestions for this consultation
  const {
    suggestions: rawSuggestions,
    isLoading: suggestionsLoading,
    isError: suggestionsIsError,
    error: suggestionsError,
    submit: submitSuggestion,
    isSubmitting: suggestionsSubmitting,
  } = useSuggestions(consultationId);

  const loading = impactLoading || resultsLoading || suggestionsLoading;

  const pageTitle =
    impact?.summary?.title ?? `Consultation ${String(consultationId)}`;

  if (impactIsError && impactError) {
    return (
      <EthikosPageShell
        title={pageTitle}
        sectionLabel="Consultation"
        metaTitle={`ethiKos · Consultation · ${pageTitle}`}
      >
        <Result
          status="error"
          title="Failed to load consultation"
          subTitle={
            impactError.message ||
            'This consultation may not exist or an error occurred.'
          }
        />
      </EthikosPageShell>
    );
  }

  const summary = impact?.summary;

  // Status + date info derived from impact summary
  let statusTag: React.ReactNode = null;
  let dateInfo: React.ReactNode = null;

  if (summary) {
    const status = String(summary.status ?? '').toLowerCase();
    const isOpen =
      status === 'in-progress' ||
      status === 'in_progress' ||
      status === 'planned';

    const statusLabel = summary.status ?? (isOpen ? 'Open' : 'Closed');

    statusTag = (
      <Tag color={isOpen ? 'blue' : 'default'} style={{ marginRight: 8 }}>
        {statusLabel}
      </Tag>
    );

    if (summary.closesAt) {
      const closes = dayjs(summary.closesAt);
      if (closes.isValid()) {
        const prefix =
          isOpen && closes.isAfter(dayjs())
            ? 'Closes on '
            : !isOpen
            ? 'Closed on '
            : 'Closes ';
        dateInfo = (
          <Text type="secondary">
            {prefix}
            {closes.format('YYYY-MM-DD')}
          </Text>
        );
      }
    }
  }

  // Map stance buckets → chart data for ResultsChart
  const chartData =
    results?.buckets.map((bucket) => ({
      option: bucket.label,
      votes: bucket.count,
      // Represent share as a 0–100 weighted score
      weightedScore: Math.round(bucket.share * 100),
    })) ?? [];

  // Map backend suggestions → SuggestionBoard's suggestion type
  const boardSuggestions =
    rawSuggestions?.map((s) => ({
      id: s.id,
      body: s.body,
      createdAt: s.createdAt,
      authorName: s.author,
      upvotes: 0, // backend does not expose support counts yet
    })) ?? [];

  // Coerce impact timeline events to the shape expected by ImpactTimeline
  const impactEvents: ImpactEvent[] =
    ((impact?.timeline ?? []) as unknown as ImpactEvent[]);

  const handleCreateSuggestion = async (body: string) => {
    await submitSuggestion({ body });
  };

  return (
    <EthikosPageShell
      title={pageTitle}
      sectionLabel="Consultation"
      metaTitle={`ethiKos · Consultation · ${pageTitle}`}
    >
      <PageContainer ghost loading={loading}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Consultation metadata */}
          {summary && (
            <div>
              <Space direction="vertical" size={4}>
                <Space size="small" wrap>
                  {statusTag}
                  {dateInfo}
                </Space>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {summary.category && (
                    <Text>
                      Category: <Text strong>{summary.category}</Text>
                    </Text>
                  )}
                  {summary.scope && (
                    <>
                      {' · '}
                      <Text>
                        Scope: <Text strong>{summary.scope}</Text>
                      </Text>
                    </>
                  )}
                  {typeof summary.stances === 'number' && (
                    <>
                      {' · '}
                      <Text type="secondary">
                        {summary.stances} participant stances recorded
                      </Text>
                    </>
                  )}
                </Paragraph>
              </Space>
            </div>
          )}

          {/* Stance submission form */}
          <ProCard title="Your stance" bordered>
            <ConsultationForm consultationId={consultationId} />
          </ProCard>

          {/* Results and Suggestions side by side */}
          <ProCard ghost gutter={16} wrap>
            <ProCard colSpan={{ xs: 24, md: 12 }} title="Results">
              {resultsIsError && resultsError ? (
                <Alert
                  type="error"
                  showIcon
                  message="Could not load results."
                  description={resultsError.message}
                />
              ) : (
                <ResultsChart data={chartData} />
              )}
            </ProCard>

            <ProCard colSpan={{ xs: 24, md: 12 }} title="Suggestions">
              <SuggestionBoard
                suggestions={boardSuggestions}
                isLoading={suggestionsLoading || suggestionsSubmitting}
                errorMessage={
                  suggestionsIsError && suggestionsError
                    ? suggestionsError.message
                    : null
                }
                allowVoting={false}
                allowNewSuggestions
                onCreateSuggestion={handleCreateSuggestion}
              />
              {!suggestionsLoading &&
                !suggestionsIsError &&
                boardSuggestions.length === 0 && (
                  <Empty
                    description="No suggestions yet"
                    style={{ marginTop: 16 }}
                  />
                )}
            </ProCard>
          </ProCard>

          {/* Impact timeline */}
          <ProCard title="Impact timeline" bordered>
            {impactLoading ? (
              <Empty description="Loading impact timeline…" />
            ) : impactEvents.length === 0 ? (
              <Empty description="No impact actions recorded yet." />
            ) : (
              <ImpactTimeline events={impactEvents} />
            )}
          </ProCard>
        </Space>
      </PageContainer>
    </EthikosPageShell>
  );
};

export default ConsultationDetailPage;
