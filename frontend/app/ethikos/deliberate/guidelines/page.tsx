// FILE: frontend/app/ethikos/deliberate/guidelines/page.tsx
'use client';

import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Anchor,
  Card,
  Col,
  Divider,
  List,
  Row,
  Space,
  Steps,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

type EvidenceRuleRow = {
  claimType: string;
  minimumEvidence: string;
  preferredSources: string;
};

const evidenceData: EvidenceRuleRow[] = [
  {
    claimType: 'Factual statement about science / policy',
    minimumEvidence: 'At least one credible, verifiable source',
    preferredSources: 'Peer‑reviewed research, official statistics, institutional reports',
  },
  {
    claimType: 'Claim about personal experience or local context',
    minimumEvidence: 'Describe context and limits of your observation',
    preferredSources: 'First‑hand description; optional supporting links',
  },
  {
    claimType: 'Normative / ethical argument',
    minimumEvidence: 'Explicit reasoning chain; reference to frameworks if used',
    preferredSources: 'Ethical frameworks, case law, precedent, structured argumentation',
  },
  {
    claimType: 'Prediction or scenario',
    minimumEvidence: 'Stated assumptions and method (trend, model, analogy)',
    preferredSources: 'Forecasting models, expert assessments, reputable think‑tank reports',
  },
];

const evidenceColumns: ColumnsType<EvidenceRuleRow> = [
  {
    title: 'Claim type',
    dataIndex: 'claimType',
    key: 'claimType',
    width: 260,
  },
  {
    title: 'Minimum evidence',
    dataIndex: 'minimumEvidence',
    key: 'minimumEvidence',
    width: 260,
  },
  {
    title: 'Preferred sources',
    dataIndex: 'preferredSources',
    key: 'preferredSources',
  },
];

const quickChecklistItems: string[] = [
  'Is my contribution respectful and focused on the topic?',
  'Have I separated facts from opinions or values?',
  'Did I provide at least one source or explain my reasoning?',
  'Is my stance slider (−3…+3) aligned with what I actually wrote?',
  'Would I be comfortable seeing this appear in a public archive of the debate?',
];

export default function Guidelines() {
  return (
    <EthikosPageShell
      title="Deliberation guidelines"
      subtitle="Shared rules for Korum debates and Konsultations consultations in ethiKos."
      sectionLabel="Deliberate"
    >
      <PageContainer ghost>
        <Row gutter={[24, 24]}>
          {/* Left column: navigation + quick rules */}
          <Col xs={24} md={7} lg={6}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card size="small" title="Navigate this guide">
                <Anchor
                  affix
                  items={[
                    { key: 'overview', href: '#overview', title: 'Overview' },
                    { key: 'principles', href: '#principles', title: 'Core principles' },
                    { key: 'etiquette', href: '#etiquette', title: 'Etiquette & tone' },
                    { key: 'evidence', href: '#evidence', title: 'Evidence & sources' },
                    {
                      key: 'identity',
                      href: '#identity',
                      title: 'Identity, expertise & Ekoh',
                    },
                    { key: 'korum', href: '#korum', title: 'Korum debates' },
                    {
                      key: 'konsultations',
                      href: '#konsultations',
                      title: 'Konsultations consultations',
                    },
                    { key: 'moderation', href: '#moderation', title: 'Moderation ladder' },
                    { key: 'appeals', href: '#appeals', title: 'Appeals & transparency' },
                    { key: 'checklist', href: '#checklist', title: 'Checklist before posting' },
                  ]}
                />
              </Card>

              <Card size="small" title="Hard limits">
                <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                  Content may be removed and accounts restricted for:
                </Paragraph>
                <List
                  size="small"
                  dataSource={[
                    'Harassment, threats, or targeted hate',
                    'Deliberate misinformation (knowingly false claims)',
                    'Doxxing or disclosure of private data',
                    'Incitement to violence or illegal activity',
                  ]}
                  renderItem={(item) => (
                    <List.Item style={{ paddingInline: 0 }}>{item}</List.Item>
                  )}
                />
              </Card>
            </Space>
          </Col>

          {/* Right column: full guidelines */}
          <Col xs={24} md={17} lg={18}>
            {/* Overview */}
            <section id="overview">
              <Title level={3}>What ethiKos is for</Title>
              <Paragraph>
                ethiKos is Konnaxion&apos;s environment for structured ethical debates and public
                consultations. It combines:
              </Paragraph>
              <List
                size="small"
                dataSource={[
                  'Nuanced stance‑taking on a −3…+3 scale (from strongly against to strongly for).',
                  'Threaded arguments (Korum) where reasoning and evidence are visible.',
                  'Time‑boxed consultations (Konsultations) with transparent weighted results.',
                ]}
                renderItem={(item) => (
                  <List.Item style={{ paddingInline: 0 }}>{item}</List.Item>
                )}
              />

              <Alert
                style={{ marginTop: 16 }}
                type="info"
                showIcon
                message="Key operational rules"
                description={
                  <Space direction="vertical">
                    <Text>
                      • Stance scale is fixed at −3…+3; 0 = neutral. Your slider should reflect what
                      you actually argue.
                    </Text>
                    <Text>
                      • Moderation auto‑hide is triggered after <strong>3 independent reports</strong>.
                    </Text>
                    <Text>
                      • &ldquo;Expert cohort&rdquo; views are only shown once at least{' '}
                      <strong>12 qualified experts</strong> have voted.
                    </Text>
                  </Space>
                }
              />
            </section>

            <Divider />

            {/* Core principles */}
            <section id="principles">
              <Title level={3}>Core principles</Title>
              <Space wrap>
                <Tag color="blue">Respect</Tag>
                <Tag color="green">Evidence</Tag>
                <Tag color="gold">Transparency</Tag>
                <Tag color="purple">Nuance</Tag>
                <Tag color="geekblue">Accountability</Tag>
              </Space>

              <Paragraph style={{ marginTop: 12 }}>
                Every contribution in ethiKos should:
              </Paragraph>
              <List
                size="small"
                dataSource={[
                  'Focus on ideas and arguments, not on people.',
                  'Separate facts (what is) from values (what ought to be).',
                  'Acknowledge uncertainty and limits of your own knowledge.',
                  'Make it possible for others to verify what you claim.',
                  'Remain readable and accessible to non‑experts where possible.',
                ]}
                renderItem={(item) => (
                  <List.Item style={{ paddingInline: 0 }}>{item}</List.Item>
                )}
              />
            </section>

            <Divider />

            {/* Etiquette & tone */}
            <section id="etiquette">
              <Title level={3}>Etiquette & tone</Title>
              <Paragraph>
                The goal is high‑signal, low‑toxicity debate. The following expectations apply
                across Korum debates and Konsultations comments:
              </Paragraph>

              <List
                size="small"
                dataSource={[
                  'Be concise and stay on topic. Long posts are fine if they are structured.',
                  'Critique arguments, not identities or motives. Avoid ad hominem attacks.',
                  'No mockery, slurs, or profanity aimed at individuals or groups.',
                  'Signal disagreement explicitly (e.g. “I disagree because…”), not by sarcasm alone.',
                  'Use formatting (short paragraphs, bullet points) to make complex ideas readable.',
                ]}
                renderItem={(item) => (
                  <List.Item style={{ paddingInline: 0 }}>{item}</List.Item>
                )}
              />
            </section>

            <Divider />

            {/* Evidence & sources */}
            <section id="evidence">
              <Title level={3}>Evidence & sources</Title>
              <Paragraph>
                ethikos is not just for opinions; it is built for traceable reasoning. As a rule of
                thumb:
              </Paragraph>

              <List
                size="small"
                dataSource={[
                  'If a claim can be checked, provide enough information for others to check it.',
                  'Link to primary sources where possible (studies, datasets, official documents).',
                  'If you rely on secondary sources (media, blogs), prefer outlets with clear editorial standards.',
                  'Clearly mark personal experience as such and avoid overgeneralising from it.',
                ]}
                renderItem={(item) => (
                  <List.Item style={{ paddingInline: 0 }}>{item}</List.Item>
                )}
              />

              <Card
                size="small"
                style={{ marginTop: 16 }}
                title="Minimum evidence by claim type"
              >
                <Table<EvidenceRuleRow>
                  size="small"
                  rowKey={(row) => row.claimType}
                  columns={evidenceColumns}
                  dataSource={evidenceData}
                  pagination={false}
                />
              </Card>
            </section>

            <Divider />

            {/* Identity, expertise & Ekoh */}
            <section id="identity">
              <Title level={3}>Identity, expertise & Ekoh weighting</Title>
              <Paragraph>
                ethiKos uses the Ekoh reputation system to highlight and weight contributions from
                users with demonstrated expertise, without turning debates into popularity contests.
              </Paragraph>

              <Card size="small">
                <List
                  size="small"
                  dataSource={[
                    'Expert and verified accounts may be tagged (e.g. “Domain expert”, “Verified identity”) next to their name.',
                    'Weighted results views (e.g. “Experts only”) depend on Ekoh scores in the relevant field.',
                    'Reputation is descriptive, not absolute authority: arguments still stand or fall on their merits.',
                    'You may use pseudonyms where allowed, but you remain bound by all guidelines and legal obligations.',
                  ]}
                  renderItem={(item) => (
                    <List.Item style={{ paddingInline: 0, alignItems: 'flex-start' }}>
                      {item}
                    </List.Item>
                  )}
                />
              </Card>
            </section>

            <Divider />

            {/* Korum-specific rules */}
            <section id="korum">
              <Title level={3}>Korum debates: structured arguments</Title>
              <Paragraph>
                Korum is the structured debate environment under ethiKos. Topics represent a single
                question; threads capture arguments and replies.
              </Paragraph>

              <List
                size="small"
                header={<Text strong>When posting in a Korum debate, you should:</Text>}
                dataSource={[
                  'Align your stance slider (−3…+3) with the position you defend in your argument.',
                  'Use one post per main point; avoid packing multiple unrelated arguments into a single block.',
                  'If you reply, indicate whether you are clarifying, objecting, or adding supporting detail.',
                  'Avoid repeating the same argument without engaging with counter‑arguments.',
                  'Flag possible conflicts of interest when relevant to the topic.',
                ]}
                renderItem={(item) => (
                  <List.Item style={{ paddingInline: 0 }}>{item}</List.Item>
                )}
              />
            </section>

            <Divider />

            {/* Konsultations-specific rules */}
            <section id="konsultations">
              <Title level={3}>Konsultations: public consultations & feedback</Title>
              <Paragraph>
                Konsultations host time‑boxed consultations and suggestion flows that may feed into
                policy or organisational decisions.
              </Paragraph>

              <Card size="small">
                <List
                  size="small"
                  header={<Text strong>For consultations and suggestions:</Text>}
                  dataSource={[
                    'Answer the specific question being asked; off‑topic comments may be hidden.',
                    'When suggesting amendments, be as concrete and implementable as possible.',
                    'Explain trade‑offs: what might be improved, and what might be lost?',
                    'Avoid campaigns to flood a consultation with near‑identical comments.',
                    'Respect any participation limits (per‑day comments, max length, etc.) if configured.',
                  ]}
                  renderItem={(item) => (
                    <List.Item style={{ paddingInline: 0, alignItems: 'flex-start' }}>
                      {item}
                    </List.Item>
                  )}
                />
              </Card>
            </section>

            <Divider />

            {/* Moderation ladder */}
            <section id="moderation">
              <Title level={3}>Moderation & reporting ladder</Title>
              <Paragraph>
                Moderation in ethiKos is a mix of community signals and dedicated moderator review.
                Automated actions are transparent and bounded.
              </Paragraph>

              <Steps
                direction="vertical"
                size="small"
                current={2}
                style={{ marginTop: 8, maxWidth: 520 }}
              >
                <Step
                  title="0. Content posted"
                  description="A debate argument, comment, or suggestion is created and visible to participants."
                />
                <Step
                  title="1. Reported by users"
                  description="Other users can report content for clear guideline violations (harassment, spam, misinformation, etc.)."
                />
                <Step
                  title="2. Auto‑hide at 3 independent reports"
                  description="At three distinct reports, the post is temporarily hidden and routed to the moderation queue."
                />
                <Step
                  title="3. Moderator review"
                  description="A moderator reviews the context, reports, and user history to decide on the outcome."
                />
                <Step
                  title="4. Outcome"
                  description="Content may be restored (optionally with a warning), edited/redacted, or permanently removed; account actions apply in repeated or severe cases."
                />
              </Steps>
            </section>

            <Divider />

            {/* Appeals & transparency */}
            <section id="appeals">
              <Title level={3}>Appeals & transparency</Title>
              <Paragraph>
                You can request a second look when your content is removed or your account is
                restricted. Appeals should focus on clarity and evidence.
              </Paragraph>

              <Timeline
                style={{ marginTop: 8 }}
                items={[
                  {
                    color: 'blue',
                    children: (
                      <>
                        <Text strong>1. Trigger</Text>
                        <Paragraph style={{ marginBottom: 0 }}>
                          You receive a notice that a post was removed or that your participation is
                          temporarily limited.
                        </Paragraph>
                      </>
                    ),
                  },
                  {
                    color: 'blue',
                    children: (
                      <>
                        <Text strong>2. Appeal submission</Text>
                        <Paragraph style={{ marginBottom: 0 }}>
                          Use the &ldquo;Request review&rdquo; or equivalent button (where
                          available) to explain why you think the decision was incorrect or
                          disproportionate.
                        </Paragraph>
                      </>
                    ),
                  },
                  {
                    color: 'green',
                    children: (
                      <>
                        <Text strong>3. Secondary review</Text>
                        <Paragraph style={{ marginBottom: 0 }}>
                          A moderator other than the original reviewer, where possible, examines the
                          case and may ask for clarification.
                        </Paragraph>
                      </>
                    ),
                  },
                  {
                    color: 'gray',
                    children: (
                      <>
                        <Text strong>4. Final outcome</Text>
                        <Paragraph style={{ marginBottom: 0 }}>
                          The decision may be upheld or adjusted. In all cases, a short rationale
                          should be recorded for audit and future calibration.
                        </Paragraph>
                      </>
                    ),
                  },
                ]}
              />
            </section>

            <Divider />

            {/* Checklist */}
            <section id="checklist">
              <Title level={3}>Checklist before posting</Title>
              <Paragraph>
                Use this short checklist before you submit a new stance, argument, or suggestion in
                ethiKos:
              </Paragraph>

              <List
                size="small"
                dataSource={quickChecklistItems}
                renderItem={(item) => (
                  <List.Item style={{ paddingInline: 0 }}>
                    <Text>• {item}</Text>
                  </List.Item>
                )}
              />

              <Alert
                style={{ marginTop: 16 }}
                type="success"
                showIcon
                message="Signal‑boost good debate"
                description={
                  <Paragraph style={{ marginBottom: 0 }}>
                    Use the available tools (up‑weighting, endorsements, sharing within your
                    organisation) to promote high‑quality, well‑evidenced arguments—regardless of
                    whether you personally agree with them.
                  </Paragraph>
                }
              />
            </section>
          </Col>
        </Row>
      </PageContainer>
    </EthikosPageShell>
  );
}
