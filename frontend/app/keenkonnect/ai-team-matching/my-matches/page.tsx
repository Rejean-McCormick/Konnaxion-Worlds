// FILE: frontend/app/keenkonnect/ai-team-matching/my-matches/page.tsx
'use client';

import { ProCard, type ProColumns, ProTable } from '@ant-design/pro-components';
import { Badge, Button, Drawer, Progress, Space, Tag, Typography } from 'antd';
import React from 'react';

import KeenPage from '@/app/keenkonnect/KeenPageShell';

const { Text, Title, Paragraph } = Typography;

type MatchType = 'team' | 'partner';

interface MatchRow {
  id: string;
  type: MatchType;
  name: string;
  matchScore: number;
  commonInterests: string;
  roleOrNeed: string;
  location?: string;
  availability?: string;
  membersCount?: number;
  new?: boolean;
}

/**
 * Declared preview dataset — teams
 * No AI matching service contract is exposed in this build.
 */
const teamMatches: MatchRow[] = [
  {
    id: 'team1',
    type: 'team',
    name: 'Alpha Team',
    matchScore: 92,
    commonInterests: 'UI/UX, Backend, DevOps',
    roleOrNeed: 'Recherche un·e full-stack pour stabiliser le MVP.',
    location: 'Remote / Europe-friendly',
    availability: '3–5 h / semaine',
    membersCount: 4,
    new: true,
  },
  {
    id: 'team2',
    type: 'team',
    name: 'Beta Squad',
    matchScore: 85,
    commonInterests: 'Mobile, Frontend, Design System',
    roleOrNeed: 'Besoin d’un·e designer produit + front React Native.',
    location: 'Montréal / Hybrid',
    availability: 'Soirs & week-ends',
    membersCount: 3,
  },
  {
    id: 'team3',
    type: 'team',
    name: 'Gamma Builders',
    matchScore: 78,
    commonInterests: 'Data, ML Ops, Product Analytics',
    roleOrNeed: 'Profil orienté data storytelling & dashboards.',
    location: 'Remote',
    availability: 'Flexible',
    membersCount: 5,
  },
];

/**
 * Declared preview dataset — individual partners
 */
const partnerMatches: MatchRow[] = [
  {
    id: 'partner1',
    type: 'partner',
    name: 'Jane Doe',
    matchScore: 88,
    commonInterests: 'Product Management, Design Thinking, Strategy',
    roleOrNeed: 'Veut co-lead un produit AI early-stage.',
    location: 'Montréal / Hybrid',
    availability: 'Soirs de semaine',
    new: true,
  },
  {
    id: 'partner2',
    type: 'partner',
    name: 'John Smith',
    matchScore: 80,
    commonInterests: 'Data Science, Machine Learning, Experimentation',
    roleOrNeed: 'Cherche une équipe pour un projet ML appliqué.',
    location: 'Remote / North America',
    availability: '2–3 soirs / semaine',
  },
  {
    id: 'partner3',
    type: 'partner',
    name: 'Amina K.',
    matchScore: 73,
    commonInterests: 'Community building, Facilitation, UX research',
    roleOrNeed: 'Souhaite rejoindre un projet orienté impact social.',
    location: 'Paris',
    availability: 'Week-ends',
  },
];

export default function MyMatchesPage(): JSX.Element {
  const [selectedMatch, setSelectedMatch] = React.useState<MatchRow | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const allMatches: MatchRow[] = [...teamMatches, ...partnerMatches];

  const total = allMatches.length;
  const newCount = allMatches.filter((m) => m.new).length;
  const avgScore = total
    ? Math.round(allMatches.reduce((acc, m) => acc + m.matchScore, 0) / total)
    : 0;
  const strongMatches = allMatches.filter((m) => m.matchScore >= 80).length;

  const columns: ProColumns<MatchRow>[] = [
    {
      title: 'Type',
      dataIndex: 'type',
      width: 140,
      filters: [
        { text: 'Teams', value: 'team' },
        { text: 'Partners', value: 'partner' },
      ],
      onFilter: (value, row) => row.type === String(value),
      render: (_, row) => (
        <Tag color={row.type === 'team' ? 'blue' : 'purple'}>
          {row.type === 'team' ? 'Team match' : 'Partner match'}
        </Tag>
      ),
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      width: 240,
      render: (_, row) => (
        <Space>
          {row.new && <Badge dot />}
          <Text strong>{row.name}</Text>
        </Space>
      ),
    },
    {
      title: 'Match',
      dataIndex: 'matchScore',
      width: 220,
      sorter: (a, b) => a.matchScore - b.matchScore,
      render: (_, row) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Progress
            percent={row.matchScore}
            size="small"
            status={
              row.matchScore >= 85
                ? 'success'
                : row.matchScore >= 70
                ? 'active'
                : 'normal'
            }
          />
          <Text type="secondary">{row.matchScore}% de compatibilité globale</Text>
        </Space>
      ),
    },
    {
      title: 'Points communs',
      dataIndex: 'commonInterests',
      ellipsis: true,
    },
    {
      title: 'Rôle / Besoin',
      dataIndex: 'roleOrNeed',
      ellipsis: true,
      width: 260,
    },
    {
      title: 'Localisation',
      dataIndex: 'location',
      width: 180,
      render: (_, row) =>
        row.location ? <Text>{row.location}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 200,
      render: (_, row) => [
        <Button
          key="view"
          type="link"
          onClick={() => {
            setSelectedMatch(row);
            setDrawerOpen(true);
          }}
        >
          Voir le détail
        </Button>,
        <Button key="connect" type="link">
          Proposer une connexion
        </Button>,
      ],
    },
  ];

  return (
    <KeenPage
      title="Mes correspondances"
      description="Résumé de tes matches générés par l’AI Team Matching : équipes, partenaires potentiels et niveau de compatibilité."
      metaTitle="KeenKonnect · Mes correspondances"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Bandeau de KPIs / résumé */}
        <ProCard ghost gutter={[16, 16]} wrap>
          <ProCard colSpan={{ xs: 24, sm: 12, md: 6 }} bordered>
            <Text type="secondary">Total de matches</Text>
            <Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
              {total}
            </Title>
          </ProCard>

          <ProCard colSpan={{ xs: 24, sm: 12, md: 6 }} bordered>
            <Text type="secondary">Nouveaux matches</Text>
            <Space align="baseline">
              <Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
                {newCount}
              </Title>
              {newCount > 0 && (
                <Badge
                  count="Nouveau"
                  style={{ backgroundColor: '#52c41a', marginLeft: 8 }}
                />
              )}
            </Space>
          </ProCard>

          <ProCard colSpan={{ xs: 24, sm: 12, md: 6 }} bordered>
            <Text type="secondary">Compatibilité moyenne</Text>
            <Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
              {avgScore}%
            </Title>
            <Progress
              percent={avgScore}
              size="small"
              style={{ marginTop: 8 }}
              status={
                avgScore >= 85 ? 'success' : avgScore >= 70 ? 'active' : 'normal'
              }
            />
          </ProCard>

          <ProCard colSpan={{ xs: 24, sm: 12, md: 6 }} bordered>
            <Text type="secondary">Matches forts (≥ 80%)</Text>
            <Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
              {strongMatches}
            </Title>
          </ProCard>
        </ProCard>

        {/* Tableau principal */}
        <ProTable<MatchRow>
          rowKey="id"
          columns={columns}
          dataSource={allMatches}
          search={false}
          pagination={{ pageSize: 6 }}
          options={false}
          onRow={(record) => ({
            onClick: () => {
              setSelectedMatch(record);
              setDrawerOpen(true);
            },
          })}
        />

        {/* Drawer de détail d’un match */}
        <Drawer
          title={selectedMatch ? selectedMatch.name : 'Détail du match'}
          open={drawerOpen}
          width={520}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedMatch(null);
          }}
        >
          {selectedMatch && (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Space>
                <Tag color={selectedMatch.type === 'team' ? 'blue' : 'purple'}>
                  {selectedMatch.type === 'team' ? 'Team match' : 'Partner match'}
                </Tag>
                {selectedMatch.new && (
                  <Badge count="Nouveau" style={{ backgroundColor: '#52c41a' }} />
                )}
              </Space>

              <Space align="center">
                <Progress
                  type="dashboard"
                  percent={selectedMatch.matchScore}
                  status={
                    selectedMatch.matchScore >= 85
                      ? 'success'
                      : selectedMatch.matchScore >= 70
                      ? 'active'
                      : 'normal'
                  }
                  style={{ marginRight: 16 }}
                />
                <div>
                  <Text strong>
                    {selectedMatch.matchScore}% de compatibilité globale
                  </Text>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    Calculé à partir des intérêts, compétences, disponibilité et
                    style de collaboration.
                  </Paragraph>
                </div>
              </Space>

              <div>
                <Title level={5}>Ce que vous avez en commun</Title>
                <Paragraph>{selectedMatch.commonInterests}</Paragraph>
              </div>

              <div>
                <Title level={5}>Rôle &amp; attentes</Title>
                <Paragraph>{selectedMatch.roleOrNeed}</Paragraph>
              </div>

              {selectedMatch.location && (
                <Paragraph>
                  <Text strong>Localisation :</Text> {selectedMatch.location}
                </Paragraph>
              )}

              {selectedMatch.availability && (
                <Paragraph>
                  <Text strong>Disponibilité :</Text> {selectedMatch.availability}
                </Paragraph>
              )}

              {selectedMatch.membersCount != null && (
                <Paragraph>
                  <Text strong>Taille de l’équipe :</Text>{' '}
                  {selectedMatch.membersCount} membres
                </Paragraph>
              )}

              <Space>
                <Button type="primary">Proposer une connexion</Button>
                <Button>Voir le profil complet</Button>
              </Space>
            </Space>
          )}
        </Drawer>
      </Space>
    </KeenPage>
  );
}
