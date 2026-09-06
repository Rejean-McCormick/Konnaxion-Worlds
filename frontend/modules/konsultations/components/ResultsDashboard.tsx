// FILE: frontend/modules/konsultations/components/ResultsDashboard.tsx
﻿'use client';

import {
  Alert,
  Card,
  Col,
  Empty,
  List,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Timeline,
  Typography,
} from 'antd';

import {
  useConsultation,
  useConsultationResults,
  useImpact,
  useSuggestions,
} from '../hooks';

const { Text } = Typography;

type ConsultationStatus = 'open' | 'closed' | 'archived' | string;

interface ConsultationSummary {
  id: string;
  title: string;
  status?: ConsultationStatus;
  openDate?: string;
  closeDate?: string;
  region?: string;
}

interface OptionResult {
  key?: string;
  label: string;
  rawCount: number;
  weightedCount?: number | null;
}

interface ConsultationResults {
  totalVotes: number;
  turnoutPercent?: number;
  rawAverage?: number;
  weightedAverage?: number;
  supportPercent?: number;
  medianStance?: number;
  options?: OptionResult[];
}

interface ImpactItem {
  id: string;
  action: string;
  status?: string;
  date?: string;
}

interface SuggestionItem {
  id: string;
  author?: string;
  content: string;
  createdAt?: string;
  status?: string;
  supportCount?: number;
}

type QueryState<T> = {
  data?: T;
  loading?: boolean;
  error?: Error;
};

type CollectionState<T> = {
  data?: { items?: T[] };
  items?: T[];
  loading?: boolean;
  error?: Error;
};

type DashboardHook<TState> = (
  consultationId?: string | number,
) => TState | undefined;

export interface ResultsDashboardProps {
  consultationId?: string | number;
}

function statusTagColor(status?: string): string {
  if (!status) return 'default';
  const normalized = status.toLowerCase();
  if (normalized === 'open') return 'green';
  if (normalized === 'closed') return 'geekblue';
  if (normalized === 'archived') return 'default';
  return 'default';
}

function impactStatusColor(status?: string): string {
  if (!status) return 'default';
  const normalized = status.toLowerCase();
  if (normalized === 'planned') return 'blue';
  if (normalized === 'in-progress' || normalized === 'in_progress') return 'gold';
  if (normalized === 'completed') return 'green';
  if (normalized === 'blocked') return 'red';
  return 'default';
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function formatDateRange(openDate?: string, closeDate?: string): string | null {
  const open = formatDate(openDate);
  const close = formatDate(closeDate);
  if (open && close) return `${open} → ${close}`;
  if (open) return `Opens ${open}`;
  if (close) return `Closes ${close}`;
  return null;
}

export default function ResultsDashboard({
  consultationId,
}: ResultsDashboardProps) {
  // Hooks are currently lightweight adapters; use explicit local contracts
  // until the Konsultations hooks expose stable exported result types.
  const consultationState =
    (useConsultation as unknown as DashboardHook<QueryState<ConsultationSummary>>)(
      consultationId,
    ) ?? {};
  const resultsState =
    (useConsultationResults as unknown as DashboardHook<QueryState<ConsultationResults>>)(
      consultationId,
    ) ?? {};
  const impactState =
    (useImpact as unknown as DashboardHook<CollectionState<ImpactItem>>)(
      consultationId,
    ) ?? {};
  const suggestionsState =
    (useSuggestions as unknown as DashboardHook<CollectionState<SuggestionItem>>)(
      consultationId,
    ) ?? {};

  const consultation = consultationState.data as ConsultationSummary | undefined;
  const consultationLoading = Boolean(consultationState.loading);
  const consultationError = consultationState.error as Error | undefined;

  const results = resultsState.data as ConsultationResults | undefined;
  const resultsLoading = Boolean(resultsState.loading);
  const resultsError = resultsState.error as Error | undefined;

  const impactItems: ImpactItem[] =
    (impactState.items as ImpactItem[] | undefined) ??
    (impactState.data?.items as ImpactItem[] | undefined) ??
    [];
  const impactLoading = Boolean(impactState.loading);
  const impactError = impactState.error as Error | undefined;

  const suggestions: SuggestionItem[] =
    (suggestionsState.items as SuggestionItem[] | undefined) ??
    (suggestionsState.data?.items as SuggestionItem[] | undefined) ??
    [];
  const suggestionsLoading = Boolean(suggestionsState.loading);
  const suggestionsError = suggestionsState.error as Error | undefined;

  const loading =
    consultationLoading || resultsLoading || impactLoading || suggestionsLoading;

  if (!consultationId) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Select a consultation to view live results and impact."
        />
      </Card>
    );
  }

  const headerError = consultationError || resultsError;

  const totalVotes = results?.totalVotes ?? 0;
  const turnoutPct = results?.turnoutPercent;
  const supportPct = results?.supportPercent;
  const rawAvg = results?.rawAverage;
  const weightedAvg = results?.weightedAverage;
  const medianStance =
    typeof results?.medianStance === 'number'
      ? results.medianStance
      : typeof weightedAvg === 'number'
      ? weightedAvg
      : rawAvg;

  const options = results?.options ?? [];
  const dateRange = formatDateRange(consultation?.openDate, consultation?.closeDate);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {headerError && (
        <Alert
          type="error"
          showIcon
          message="Unable to load consultation results."
          description={headerError.message}
        />
      )}

      <Card
        loading={loading}
        title={consultation?.title ?? 'Consultation results'}
        extra={
          <Space size={8} wrap>
            {consultation?.status && (
              <Tag color={statusTagColor(consultation.status)}>
                {consultation.status.toUpperCase()}
              </Tag>
            )}
            {consultation?.region && <Tag>{consultation.region}</Tag>}
          </Space>
        }
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {dateRange && (
            <Text type="secondary">Consultation window: {dateRange}</Text>
          )}
          <Text type="secondary">
            Results combine raw votes with optional Ekoh‑weighted aggregates. As
            new votes and impact actions are recorded, this snapshot updates
            automatically.
          </Text>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col xs={12} md={6}>
              <Statistic title="Total votes" value={totalVotes} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Weighted support"
                value={supportPct != null ? Math.round(supportPct) : undefined}
                suffix={supportPct != null ? '%' : undefined}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Turnout"
                value={turnoutPct != null ? Math.round(turnoutPct) : undefined}
                suffix={turnoutPct != null ? '%' : undefined}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Avg. stance"
                value={
                  typeof medianStance === 'number'
                    ? medianStance.toFixed(2)
                    : undefined
                }
              />
            </Col>
          </Row>
        </Space>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card loading={resultsLoading} title="Vote distribution">
            {!results || options.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No votes recorded yet for this consultation."
              />
            ) : (
              <List
                dataSource={options}
                renderItem={(opt) => (
                  <List.Item key={opt.key ?? opt.label}>
                    <List.Item.Meta
                      title={opt.label}
                      description={
                        <Space size={8} wrap>
                          <Text type="secondary">
                            Raw: {opt.rawCount}
                          </Text>
                          {typeof opt.weightedCount === 'number' && (
                            <Text type="secondary">
                              Weighted: {opt.weightedCount.toFixed(1)}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                    <div style={{ minWidth: 160 }}>
                      <Progress
                        percent={
                          totalVotes
                            ? Math.round((opt.rawCount / totalVotes) * 100)
                            : 0
                        }
                        size="small"
                      />
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            loading={impactLoading}
            title="Impact & follow‑up actions"
          >
            {impactError && (
              <Alert
                type="error"
                showIcon
                message="Could not load impact actions."
                description={impactError.message}
                style={{ marginBottom: 8 }}
              />
            )}

            {!impactError && impactItems.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No follow‑up actions have been logged yet."
              />
            ) : (
              <Timeline
                items={impactItems.map((item) => ({
                  key: item.id,
                  color: impactStatusColor(item.status),
                  children: (
                    <Space direction="vertical" size={0}>
                      <Text strong>{item.action}</Text>
                      <Space size={4} wrap>
                        {item.status && (
                          <Tag color={impactStatusColor(item.status)}>
                            {item.status}
                          </Tag>
                        )}
                        {item.date && (
                          <Text type="secondary">
                            {new Date(item.date).toLocaleDateString()}
                          </Text>
                        )}
                      </Space>
                    </Space>
                  ),
                }))}
              />
            )}
          </Card>

          <Card
            loading={suggestionsLoading}
            title="Top citizen suggestions"
            style={{ marginTop: 16 }}
          >
            {suggestionsError && (
              <Alert
                type="error"
                showIcon
                message="Could not load suggestions."
                description={suggestionsError.message}
                style={{ marginBottom: 8 }}
              />
            )}

            {!suggestionsError && suggestions.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No suggestions submitted for this consultation yet."
              />
            ) : (
              <List
                size="small"
                dataSource={suggestions.slice(0, 5)}
                renderItem={(s) => (
                  <List.Item key={s.id}>
                    <List.Item.Meta
                      title={s.content}
                      description={
                        <Space size={4} wrap>
                          {s.author && (
                            <Text type="secondary">By {s.author}</Text>
                          )}
                          {s.status && (
                            <Tag
                              color={
                                s.status === 'accepted'
                                  ? 'green'
                                  : s.status === 'rejected'
                                  ? 'red'
                                  : 'default'
                              }
                            >
                              {s.status}
                            </Tag>
                          )}
                          {s.createdAt && (
                            <Text type="secondary">
                              {new Date(s.createdAt).toLocaleDateString()}
                            </Text>
                          )}
                          {typeof s.supportCount === 'number' && (
                            <Text type="secondary">
                              · Support: {s.supportCount}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
