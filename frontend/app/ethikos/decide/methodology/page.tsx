// FILE: frontend/app/ethikos/decide/methodology/page.tsx
// app/ethikos/decide/methodology/page.tsx
'use client';

import {
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  StatisticCard,
} from '@ant-design/pro-components';
import {
  Alert,
  Collapse,
  Descriptions,
  Divider,
  Space,
  Steps,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';

const { Title, Paragraph, Text } = Typography;

export default function Methodology(): JSX.Element {
  return (
    <EthikosPageShell
      title="Voting methodology"
      sectionLabel="Decide"
      subtitle="How Ethikos turns nuanced stances, Ekoh reputation and Smart Vote into auditable decisions."
    >
      <PageContainer ghost>
        {/* ------------------------------------------------------------------ */}
        {/* Heading                                                            */}
        {/* ------------------------------------------------------------------ */}
        <Title level={3}>How Smart Voting Works</Title>
        <Paragraph type="secondary">
          This page explains how Ethikos decisions are computed from individual
          stances, how expertise (Ekoh) influences the result, and which
          safeguards and audit rules are applied before outcomes appear in the
          archive.
        </Paragraph>

        {/* ------------------------------------------------------------------ */}
        {/* Key constants / parameters                                        */}
        {/* ------------------------------------------------------------------ */}
        <ProCard
          gutter={16}
          wrap
          style={{ marginTop: 24, marginBottom: 24 }}
        >
          <StatisticCard
            colSpan={{ xs: 24, sm: 8 }}
            statistic={{
              title: 'Stance scale',
              value: '–3 … +3',
              description: 'Strongly against → strongly for; 0 = neutral',
            }}
          />
          <StatisticCard
            colSpan={{ xs: 24, sm: 8 }}
            statistic={{
              title: 'Expert quorum',
              value: 12,
              suffix: 'experts',
              description:
                'Minimum expert votes required for expert-only results',
            }}
          />
          <StatisticCard
            colSpan={{ xs: 24, sm: 8 }}
            statistic={{
              title: 'Auto-hide threshold',
              value: 3,
              suffix: 'reports',
              description:
                'Arguments temporarily hidden after 3 independent reports',
            }}
          />
        </ProCard>

        {/* ------------------------------------------------------------------ */}
        {/* Tabs: conceptual overview                                          */}
        {/* ------------------------------------------------------------------ */}
        <Tabs
          style={{ marginBottom: 32 }}
          items={[
            {
              key: 'overview',
              label: '1 · Pipeline overview',
              children: (
                <ProCard ghost>
                  <Paragraph>
                    Every decision in Ethikos follows the same high-level
                    pipeline:
                  </Paragraph>
                  <Timeline
                    items={[
                      {
                        color: 'blue',
                        children: (
                          <>
                            <Text strong>1. Collect nuanced stances</Text>
                            <Paragraph style={{ marginTop: 4 }}>
                              Participants express a stance on a topic on a
                              seven-point scale from{' '}
                              <Text strong>–3</Text> (strongly against) to{' '}
                              <Text strong>+3</Text> (strongly for), with{' '}
                              <Text strong>0</Text> as neutral or undecided.
                            </Paragraph>
                          </>
                        ),
                      },
                      {
                        color: 'green',
                        children: (
                          <>
                            <Text strong>2. Apply Ekoh weighting</Text>
                            <Paragraph style={{ marginTop: 4 }}>
                              Each stance is multiplied by a weight derived
                              from the voter&apos;s Ekoh reputation in the
                              relevant domain, bounded so that high expertise
                              matters but cannot dominate the entire outcome.
                            </Paragraph>
                          </>
                        ),
                      },
                      {
                        color: 'purple',
                        children: (
                          <>
                            <Text strong>3. Aggregate Smart Vote result</Text>
                            <Paragraph style={{ marginTop: 4 }}>
                              Weighted stances are aggregated by modality
                              (approval, rating, ranking, etc.) and scope (
                              <Text strong>Elite</Text> vs{' '}
                              <Text strong>Public</Text>) to produce summary
                              metrics and a consensus classification.
                            </Paragraph>
                          </>
                        ),
                      },
                      {
                        color: 'orange',
                        children: (
                          <>
                            <Text strong>
                              4. Enforce thresholds &amp; publish
                            </Text>
                            <Paragraph style={{ marginTop: 4 }}>
                              Results are only presented once minimum
                              participation and expert-quorum thresholds are
                              reached. After a cooling-off period, anonymised
                              raw data and audit logs are exposed.
                            </Paragraph>
                          </>
                        ),
                      },
                    ]}
                  />
                </ProCard>
              ),
            },
            {
              key: 'weighting',
              label: '2 · Weighting & Ekoh',
              children: (
                <ProCard ghost>
                  <Space
                    direction="vertical"
                    size="large"
                    style={{ width: '100%' }}
                  >
                    <Paragraph>
                      Ethikos relies on the Ekoh reputation engine and Smart
                      Vote services to translate competence and ethical
                      behaviour into influence on collective decisions.
                    </Paragraph>
                    <Descriptions
                      bordered
                      size="small"
                      column={{ xs: 1, sm: 2 }}
                      labelStyle={{ width: 180 }}
                    >
                      <Descriptions.Item label="Base stance">
                        Integer in [–3, +3] chosen per topic. Negative values
                        are against, positive values are for, 0 is neutral.
                      </Descriptions.Item>
                      <Descriptions.Item label="Reputation weight">
                        A factor derived from the user&apos;s Ekoh score in the
                        topic&apos;s domain. Higher expertise → higher weight,
                        within configured floors and caps.
                      </Descriptions.Item>
                      <Descriptions.Item label="Ethical multiplier">
                        An additional multiplier rewarding consistent ethical
                        behaviour (e.g. respectful participation, constructive
                        contributions), bounded to avoid runaway effects.
                      </Descriptions.Item>
                      <Descriptions.Item label="Final vote value">
                        The product of (stance × reputation weight × ethical
                        multiplier), normalised when aggregated at topic level.
                      </Descriptions.Item>
                    </Descriptions>
                    <Paragraph>
                      Expert-only views filter the same dataset to participants
                      whose Ekoh score is above the expert percentile threshold
                      in the relevant domain. This gives a complementary
                      reading of what the most competent contributors think,
                      without erasing the broader Krowd.
                    </Paragraph>
                  </Space>
                </ProCard>
              ),
            },
            {
              key: 'nuance',
              label: '3 · Nuance & modalities',
              children: (
                <ProCard ghost>
                  <Space
                    direction="vertical"
                    size="large"
                    style={{ width: '100%' }}
                  >
                    <Paragraph>
                      The stance scale and voting modalities are designed to
                      balance expressiveness and simplicity:
                    </Paragraph>
                    <Descriptions
                      bordered
                      size="small"
                      column={{ xs: 1, sm: 2 }}
                      labelStyle={{ width: 220 }}
                    >
                      <Descriptions.Item label="Nuanced stance scale">
                        <Space wrap size="small">
                          <Tag color="red">–3 · strongly against</Tag>
                          <Tag color="volcano">–2 · against</Tag>
                          <Tag color="orange">
                            –1 · somewhat against
                          </Tag>
                          <Tag>0 · neutral / unsure</Tag>
                          <Tag color="green">+1 · somewhat for</Tag>
                          <Tag color="lime">+2 · for</Tag>
                          <Tag color="cyan">+3 · strongly for</Tag>
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Supported modalities">
                        Approval, rating, ranking and preferential voting are
                        supported at the engine level. The UI exposes the
                        simplest form that fits the decision (e.g. stance
                        slider for yes/no questions, ranking for alternatives).
                      </Descriptions.Item>
                      <Descriptions.Item label="Scope filters">
                        Results can be segmented by scope (Elite councils vs
                        public Krowd), and by cohort filters (experts only,
                        verified accounts, etc.) if enough data is available.
                      </Descriptions.Item>
                      <Descriptions.Item label="Time dimension">
                        For long-running debates, a timeline of stance
                        distributions is maintained so users can see how the
                        consensus evolved.
                      </Descriptions.Item>
                    </Descriptions>
                  </Space>
                </ProCard>
              ),
            },
            {
              key: 'thresholds',
              label: '4 · Quorum & thresholds',
              children: (
                <ProCard ghost>
                  <Space
                    direction="vertical"
                    size="large"
                    style={{ width: '100%' }}
                  >
                    <Paragraph>
                      To avoid over-interpreting sparse or unbalanced
                      participation, several thresholds are enforced before a
                      result is considered stable:
                    </Paragraph>
                    <Descriptions
                      bordered
                      size="small"
                      column={{ xs: 1, sm: 2 }}
                      labelStyle={{ width: 220 }}
                    >
                      <Descriptions.Item
                        label={
                          <Space size={4}>
                            <SafetyCertificateOutlined />
                            <span>Expert quorum</span>
                          </Space>
                        }
                      >
                        Expert-only views require at least{' '}
                        <Text strong>12 distinct experts</Text> (users above
                        the expert percentile in the relevant Ekoh domain) to
                        have voted before any aggregate is displayed.
                      </Descriptions.Item>
                      <Descriptions.Item
                        label={
                          <Space size={4}>
                            <TeamOutlined />
                            <span>Participation floor</span>
                          </Space>
                        }
                      >
                        Public-facing summaries can enforce minimum
                        participation counts (configurable per deployment) to
                        avoid showing unstable distributions based on very few
                        votes.
                      </Descriptions.Item>
                      <Descriptions.Item label="Consensus classification">
                        Thresholds on weighted agreement (for instance, a
                        strong consensus band when weighted agreement exceeds a
                        high percentage) are used to label decisions as
                        &quot;divided&quot;, &quot;leaning&quot;, or
                        &quot;strong consensus&quot;.
                      </Descriptions.Item>
                      <Descriptions.Item label="Moderation linkage">
                        Content that reaches the auto-hide report threshold is
                        excluded from featured summaries until reviewed, so
                        that low-quality or abusive inputs do not skew visible
                        outcomes.
                      </Descriptions.Item>
                    </Descriptions>
                  </Space>
                </ProCard>
              ),
            },
            {
              key: 'audit',
              label: '5 · Audit & transparency',
              children: (
                <ProCard ghost>
                  <Space
                    direction="vertical"
                    size="large"
                    style={{ width: '100%' }}
                  >
                    <Paragraph>
                      Transparency is a core requirement: stakeholders must be
                      able to verify how a decision was reached without
                      exposing individual voters.
                    </Paragraph>
                    <Collapse
                      ghost
                      items={[
                        {
                          key: 'audit-trail',
                          label: 'Audit trail',
                          children: (
                            <Paragraph>
                              For each decision, Ethikos keeps a trace of
                              configuration (topic metadata, modality, filters,
                              thresholds), stance submissions, and all
                              subsequent recalculations. Changes to weighting
                              parameters are logged so that later readers can
                              reconstruct the state that produced a given
                              outcome.
                            </Paragraph>
                          ),
                        },
                        {
                          key: 'open-data',
                          label: 'Open data export',
                          children: (
                            <Paragraph>
                              After a cooling-off period, an anonymised export
                              of stances and weights can be published.
                              Individual identifiers are removed or hashed, but
                              aggregated distributions remain verifiable by
                              third parties.
                            </Paragraph>
                          ),
                        },
                        {
                          key: 'simulation',
                          label: 'Simulation & regression tests',
                          children: (
                            <Paragraph>
                              The collective-intelligence pipeline is
                              continuously validated with synthetic data.
                              Simulation runs ensure that higher expertise
                              reliably increases influence, that the nuance
                              scale behaves as expected, and that parameter
                              changes do not introduce regressions.
                            </Paragraph>
                          ),
                        },
                      ]}
                    />
                  </Space>
                </ProCard>
              ),
            },
          ]}
        />

        {/* ------------------------------------------------------------------ */}
        {/* Deep dive: stages as collapsible sections                          */}
        {/* ------------------------------------------------------------------ */}
        <Divider orientation="left">Deep dive by stage</Divider>

        <Collapse
          style={{ marginBottom: 32 }}
          items={[
            {
              key: 'collection',
              label: 'Stage 1 · Collecting stances',
              children: (
                <>
                  <Paragraph>
                    Participants see a clear question, any relevant background
                    material, and a stance control (slider or segmented
                    buttons). The interface encourages evidence-backed
                    participation by linking to guidelines and reference
                    material.
                  </Paragraph>
                  <Paragraph>
                    Users can revise their stance over time; the system stores
                    the latest value as the canonical position, while previous
                    stances can be kept for longitudinal analysis.
                  </Paragraph>
                </>
              ),
            },
            {
              key: 'weighting',
              label: 'Stage 2 · Applying weights',
              children: (
                <>
                  <Paragraph>
                    For each stance, the engine fetches the voter&apos;s Ekoh
                    profile in the relevant domain and computes a weight within
                    configured bounds. An ethical multiplier rewards
                    constructive behaviour, but both factors are capped to avoid
                    extreme influence.
                  </Paragraph>
                  <Paragraph>
                    In expert-only views, only voters above the expert
                    threshold are considered, but their weights are still
                    normalised so that no single expert can dominate the
                    outcome.
                  </Paragraph>
                </>
              ),
            },
            {
              key: 'aggregation',
              label: 'Stage 3 · Aggregation & classification',
              children: (
                <>
                  <Paragraph>
                    Weighted stances are aggregated according to the chosen
                    modality: mean or median for rating, pairwise comparisons
                    for ranking, or tallying approvals for approval voting. The
                    result is then mapped to an intuitive summary:
                    percentages, histograms, or consensus bands.
                  </Paragraph>
                  <Paragraph>
                    These summaries are computed separately for different
                    scopes and filters (public, experts-only, specific cohorts)
                    so that stakeholders can compare perspectives.
                  </Paragraph>
                </>
              ),
            },
            {
              key: 'publication',
              label: 'Stage 4 · Publication & auditability',
              children: (
                <>
                  <Paragraph>
                    Once thresholds are met, results appear on the public
                    decision pages and in the Results Archive. A short
                    explanatory note on each decision links back to this
                    methodology page to keep the process legible.
                  </Paragraph>
                  <Paragraph>
                    For high-impact decisions, administrators can additionally
                    export an audit bundle containing configuration, weight
                    distributions, and aggregate datasets suitable for
                    independent verification.
                  </Paragraph>
                </>
              ),
            },
          ]}
        />

        {/* ------------------------------------------------------------------ */}
        {/* Visual stepper                                                     */}
        {/* ------------------------------------------------------------------ */}
        <Steps
          current={2}
          style={{ marginTop: 8, marginBottom: 24, maxWidth: 720 }}
          items={[
            {
              title: 'Propose',
              description: 'Define the question, scope, and voting modality.',
            },
            {
              title: 'Deliberate',
              description: 'Debate threads and evidence gathering in Ethikos.',
            },
            {
              title: 'Vote',
              description: 'Participants submit or update their nuanced stances.',
            },
            {
              title: 'Audit',
              description: 'Results frozen, published, and made auditable.',
            },
          ]}
        />

        {/* ------------------------------------------------------------------ */}
        {/* Final info blocks                                                  */}
        {/* ------------------------------------------------------------------ */}
        <Space
          direction="vertical"
          size="middle"
          style={{ width: '100%' }}
        >
          <Alert
            type="info"
            showIcon
            message="Open methodology"
            description={
              <>
                This methodology is stable for the current platform version and
                is designed to be understandable by non-technical stakeholders.
                If configuration parameters (thresholds, scales) change, this
                page should be updated in lockstep so that every decision can
                be traced back to the rules that produced it.
              </>
            }
          />
          <Alert
            type="warning"
            showIcon
            icon={<InfoCircleOutlined />}
            message="Interpreting results"
            description={
              <>
                Ethikos results are decision-support signals, not absolute
                truth. Administrators are encouraged to look at both public and
                expert views, examine participation levels, and read the
                underlying debates before drawing conclusions.
              </>
            }
          />
        </Space>
      </PageContainer>
    </EthikosPageShell>
  );
}
