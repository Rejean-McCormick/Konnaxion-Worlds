// FILE: frontend/modules/konsultations/components/ConsultationVotePanel.tsx
﻿// frontend/modules/konsultations/components/ConsultationVotePanel.tsx

import { useRequest } from 'ahooks';
import {
  Alert,
  Card,
  Divider,
  Empty,
  message,
  Progress,
  Slider,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

import { get, post } from '@/services/_request';

const { Paragraph, Text, Title } = Typography;

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface ConsultationVotePanelProps {
  /** Ethikos topic id backing this consultation (numeric or string) */
  topicId?: string | number;
  /** Optional title override; defaults to "Your stance" */
  title?: React.ReactNode;
  /** When true, hides the collective summary section */
  hideSummary?: boolean;
  /** Optional CSS class for the outer Card */
  className?: string;
}

interface EthikosStancePoint {
  id: number;
  topic: number;
  value: number; // -3 … +3
  timestamp: string;
  user?: string;
}

interface UserMeApi {
  username: string;
  name?: string | null;
  email?: string;
  url?: string;
}

interface StanceStats {
  total: number;
  average: number;
  positive: number;
  neutral: number;
  negative: number;
  counts: Record<number, number>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function computeStanceStats(stances: EthikosStancePoint[]): StanceStats {
  const counts: Record<number, number> = {
    [-3]: 0,
    [-2]: 0,
    [-1]: 0,
    0: 0,
    1: 0,
    2: 0,
    3: 0,
  };

  let total = 0;
  let sum = 0;
  let positive = 0;
  let neutral = 0;
  let negative = 0;

  for (const s of stances) {
    const v = Math.max(-3, Math.min(3, s.value));
    counts[v] = (counts[v] ?? 0) + 1;
    total += 1;
    sum += v;

    if (v > 0) positive += 1;
    else if (v < 0) negative += 1;
    else neutral += 1;
  }

  const average = total > 0 ? sum / total : 0;

  return {
    total,
    average,
    positive,
    neutral,
    negative,
    counts,
  };
}

function stanceLabel(value: number): string {
  switch (value) {
    case -3:
      return 'Strongly against';
    case -2:
      return 'Moderately against';
    case -1:
      return 'Somewhat against';
    case 0:
      return 'Neutral / undecided';
    case 1:
      return 'Somewhat for';
    case 2:
      return 'Moderately for';
    case 3:
      return 'Strongly for';
    default:
      return 'Neutral / undecided';
  }
}

async function fetchTopicStances(topicId: string): Promise<EthikosStancePoint[]> {
  const numericId = Number(topicId);
  if (!Number.isFinite(numericId)) return [];
  return get<EthikosStancePoint[]>('ethikos/stances/', {
    params: { topic: numericId },
  });
}

async function submitTopicStance(topicId: string, value: number): Promise<void> {
  const numericId = Number(topicId);
  if (!Number.isFinite(numericId)) {
    throw new Error(`Invalid topic id: ${topicId}`);
  }
  await post('ethikos/stances/', {
    topic: numericId,
    value,
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const sliderMarks: Record<number, React.ReactNode> = {
  [-3]: '−3',
  [-2]: '',
  [-1]: '−1',
  0: '0',
  1: '+1',
  2: '',
  3: '+3',
};

export default function ConsultationVotePanel(
  props: ConsultationVotePanelProps,
): JSX.Element {
  const { topicId, title, hideSummary, className } = props;

  const topicKey = useMemo(
    () => (topicId != null ? String(topicId) : undefined),
    [topicId],
  );

  const {
    data: stances,
    loading: loadingStances,
    refresh: refreshStances,
  } = useRequest<EthikosStancePoint[], []>(
    () => fetchTopicStances(topicKey!),
    {
      ready: !!topicKey,
      refreshDeps: [topicKey],
    },
  );

  const { data: me } = useRequest<UserMeApi, []>(() =>
    get<UserMeApi>('users/me/'),
  );

  const [stanceValue, setStanceValue] = useState<number>(0);
  const [stanceHydrated, setStanceHydrated] = useState(false);
  const [savingStance, setSavingStance] = useState(false);

  // Initialize slider from existing stance once user & stances are loaded
  useEffect(() => {
    if (stanceHydrated) return;
    if (!me || !stances) return;

    const mine = stances.find((s) => s.user === me.username);
    if (mine) {
      setStanceValue(Math.max(-3, Math.min(3, mine.value)));
    }
    setStanceHydrated(true);
  }, [me, stances, stanceHydrated]);

  const stanceStats = useMemo(
    () => computeStanceStats(stances ?? []),
    [stances],
  );

  const handleSaveStance = async () => {
    if (!topicKey) return;
    setSavingStance(true);
    try {
      await submitTopicStance(topicKey, stanceValue);
      message.success('Stance saved');
      await refreshStances();
    } catch {
      message.error('Could not save your stance. Please try again.');
    } finally {
      setSavingStance(false);
    }
  };

  if (!topicKey) {
    return (
      <Card className={className}>
        <Empty description="No consultation selected" />
      </Card>
    );
  }

  return (
    <Card
      className={className}
      title={title ?? 'Your stance'}
      bordered
      bodyStyle={{ paddingBottom: hideSummary ? 16 : 24 }}
    >
      <Paragraph type="secondary">
        Use the scale below to register how strongly you are for or against this
        consultation. You can change your stance while the consultation is open.
      </Paragraph>

      <div style={{ marginTop: 16 }}>
        <Slider
          min={-3}
          max={3}
          step={1}
          dots
          marks={sliderMarks}
          value={stanceValue}
          tooltip={{
            formatter: (v) =>
              typeof v === 'number' ? stanceLabel(v) : undefined,
          }}
          onChange={(v) => setStanceValue(v as number)}
        />

        <Space
          style={{
            marginTop: 8,
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Text type="secondary">Strongly against</Text>
          <Text type="secondary">Neutral</Text>
          <Text type="secondary">Strongly for</Text>
        </Space>

        <Paragraph style={{ marginTop: 8 }}>
          Current selection: <Text strong>{stanceLabel(stanceValue)}</Text>
        </Paragraph>

        <Space style={{ marginTop: 8 }}>
          <Statistic
            title="Raw stance"
            value={stanceValue}
            precision={0}
            style={{ marginRight: 16 }}
          />
          <Tag color="geekblue">−3 … +3 scale</Tag>
        </Space>

        <Space style={{ marginTop: 12 }}>
          <button
            type="button"
            className="ant-btn ant-btn-primary"
            onClick={handleSaveStance}
            disabled={savingStance}
          >
            {savingStance ? 'Saving…' : 'Save stance'}
          </button>
          <button
            type="button"
            className="ant-btn"
            onClick={() => setStanceValue(0)}
            disabled={savingStance}
          >
            Reset to neutral
          </button>
        </Space>

        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message="One stance per topic"
          description="You can adjust your position at any time; only your latest stance is used in the consensus."
        />
      </div>

      {!hideSummary && (
        <>
          <Divider />
          <Title level={5} style={{ marginTop: 0 }}>
            Collective stance
          </Title>
          <Paragraph type="secondary">
            Snapshot of all recorded stances for this consultation.
          </Paragraph>

          <Space
            size="large"
            style={{ marginTop: 12, flexWrap: 'wrap' }}
          >
            <Statistic
              title="Participants"
              value={stanceStats.total}
              loading={loadingStances}
            />
            <Statistic
              title="Average stance"
              value={stanceStats.average}
              precision={2}
              loading={loadingStances}
            />
            <Statistic
              title="For / Against balance"
              value={
                stanceStats.total > 0
                  ? Math.round(
                      (1 -
                        Math.abs(
                          stanceStats.positive - stanceStats.negative,
                        ) /
                          stanceStats.total) *
                        100,
                    )
                  : 100
              }
              suffix="%"
              loading={loadingStances}
            />
          </Space>

          {stanceStats.total > 0 ? (
            <div style={{ marginTop: 16 }}>
              <Space
                direction="vertical"
                size="small"
                style={{ width: '100%' }}
              >
                <div>
                  <Text>For</Text>
                  <Progress
                    percent={Math.round(
                      (stanceStats.positive / stanceStats.total) * 100,
                    )}
                    showInfo
                  />
                </div>
                <div>
                  <Text>Neutral</Text>
                  <Progress
                    percent={Math.round(
                      (stanceStats.neutral / stanceStats.total) * 100,
                    )}
                    showInfo
                  />
                </div>
                <div>
                  <Text>Against</Text>
                  <Progress
                    percent={Math.round(
                      (stanceStats.negative / stanceStats.total) * 100,
                    )}
                    showInfo
                  />
                </div>

                <Paragraph style={{ marginTop: 4 }}>
                  <Tag color="geekblue">−3 … +3 scale</Tag>{' '}
                  <Text type="secondary">
                    0 = neutral; negative values = against; positive values =
                    for.
                  </Text>
                </Paragraph>
              </Space>
            </div>
          ) : (
            <Empty
              description="No stances recorded yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 16 }}
            />
          )}
        </>
      )}
    </Card>
  );
}
