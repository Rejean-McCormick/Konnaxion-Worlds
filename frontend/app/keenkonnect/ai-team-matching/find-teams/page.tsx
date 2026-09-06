// FILE: frontend/app/keenkonnect/ai-team-matching/find-teams/page.tsx
'use client';

import {
  FilterOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Input,
  List,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import KeenPage from '@/app/keenkonnect/KeenPageShell';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

type TeamSizeFilter = 'all' | 'small' | 'medium' | 'large';

interface TeamMatch {
  id: string;
  name: string;
  description: string;
  domain: string;
  members: string[];
  teamSize: number;
  matchReason: string;
  isOpen: boolean;
}

const sampleTeamMatches: TeamMatch[] = [
  {
    id: '1',
    name: 'AI Innovators',
    description: 'A team focused on cutting-edge AI projects and research.',
    domain: 'AI & Robotics',
    members: ['Alice', 'Bob', 'Charlie'],
    teamSize: 3,
    matchReason: 'Your background in robotics aligns with the team’s focus.',
    isOpen: true,
  },
  {
    id: '2',
    name: 'Sustainable Cities Lab',
    description:
      'Collaborating on innovative solutions for sustainable urban development.',
    domain: 'Sustainable Cities',
    members: ['Dana', 'Eve'],
    teamSize: 2,
    matchReason:
      'Your interest in urban planning and green infrastructure is highly relevant.',
    isOpen: true,
  },
  {
    id: '3',
    name: 'HealthTech Pioneers',
    description:
      'Exploring new technologies in health and wellness management.',
    domain: 'Health & Wellness',
    members: ['Frank', 'Grace', 'Heidi', 'Ivan'],
    teamSize: 4,
    matchReason:
      'Your experience at the intersection of healthcare and digital platforms is a strong match.',
    isOpen: false,
  },
];

const getTeamSizeTag = (size: number) => {
  if (size <= 3) return { label: 'Small team', color: 'green' as const };
  if (size <= 6) return { label: 'Medium team', color: 'blue' as const };
  return { label: 'Large team', color: 'purple' as const };
};

const domainOptions = Array.from(new Set(sampleTeamMatches.map((t) => t.domain)));

const FindTeamsPage: React.FC = () => {
  const router = useRouter();

  const [searchText, setSearchText] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [teamSizeFilter, setTeamSizeFilter] = useState<TeamSizeFilter>('all');
  const [openOnly, setOpenOnly] = useState<boolean>(false);

  const [selectedTeam, setSelectedTeam] = useState<TeamMatch | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleOpenDrawer = (team: TeamMatch) => {
    setSelectedTeam(team);
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedTeam(null);
  };

  const resetFilters = () => {
    setSearchText('');
    setDomainFilter('all');
    setTeamSizeFilter('all');
    setOpenOnly(false);
  };

  const filteredTeams = useMemo(
    () =>
      sampleTeamMatches.filter((team) => {
        const matchesSearch =
          !searchText ||
          team.name.toLowerCase().includes(searchText.toLowerCase()) ||
          team.description.toLowerCase().includes(searchText.toLowerCase()) ||
          team.domain.toLowerCase().includes(searchText.toLowerCase());

        const matchesDomain =
          domainFilter === 'all' || team.domain === domainFilter;

        const matchesOpen = !openOnly || team.isOpen;

        let matchesSize = true;
        if (teamSizeFilter === 'small') {
          matchesSize = team.teamSize <= 3;
        } else if (teamSizeFilter === 'medium') {
          matchesSize = team.teamSize > 3 && team.teamSize <= 6;
        } else if (teamSizeFilter === 'large') {
          matchesSize = team.teamSize > 6;
        }

        return matchesSearch && matchesDomain && matchesOpen && matchesSize;
      }),
    [searchText, domainFilter, teamSizeFilter, openOnly],
  );

  const hasActiveFilters =
    !!searchText ||
    domainFilter !== 'all' ||
    teamSizeFilter !== 'all' ||
    openOnly;

  const handleGoToPreferences = () => {
    router.push('/keenkonnect/ai-team-matching/match-preferences');
  };

  const handleViewMatches = () => {
    router.push('/keenkonnect/ai-team-matching/my-matches');
  };

  const handleViewWorkspace = (team: TeamMatch) => {
    router.push(
      `/keenkonnect/projects/project-workspace?teamId=${encodeURIComponent(
        team.id,
      )}`,
    );
  };

  return (
    <KeenPage
      title="Find AI-recommended teams"
      description="Discover teams recommended based on your profile and AI matching preferences."
      metaTitle="KeenKonnect · AI Team Matching · Find teams"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Intro / CTA */}
        <Card>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={16}>
              <Space direction="vertical" size={8}>
                <Title level={3} style={{ marginBottom: 0 }}>
                  Discover teams that match your profile
                </Title>
                <Text type="secondary">
                  KeenKonnect uses your skills, experience, and preferences to
                  suggest teams where you’re likely to thrive. Refine the
                  filters or adjust your preferences to tune the recommendations.
                </Text>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space
                direction="vertical"
                size={8}
                style={{ width: '100%', justifyContent: 'flex-end' }}
              >
                <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button
                    onClick={handleGoToPreferences}
                    icon={<FilterOutlined />}
                  >
                    Adjust match preferences
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleViewMatches}
                    icon={<TeamOutlined />}
                  >
                    View my matches
                  </Button>
                </Space>
                <Text type="secondary">
                  <InfoCircleOutlined /> Results use a declared preview dataset; no AI matching service is connected.
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Filters */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={10}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Search teams, domains, keywords…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Col>
              <Col xs={24} sm={12} md={5}>
                <Select
                  style={{ width: '100%' }}
                  value={domainFilter}
                  onChange={(value) => setDomainFilter(value)}
                  placeholder="Domain"
                >
                  <Option value="all">All domains</Option>
                  {domainOptions.map((domain) => (
                    <Option key={domain} value={domain}>
                      {domain}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={5}>
                <Select
                  style={{ width: '100%' }}
                  value={teamSizeFilter}
                  onChange={(value: TeamSizeFilter) => setTeamSizeFilter(value)}
                >
                  <Option value="all">All team sizes</Option>
                  <Option value="small">Small (≤3)</Option>
                  <Option value="medium">Medium (4–6)</Option>
                  <Option value="large">Large (7+)</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Space>
                  <Switch
                    checked={openOnly}
                    onChange={setOpenOnly}
                    size="small"
                  />
                  <Text>Open to new members only</Text>
                </Space>
              </Col>
            </Row>

            {hasActiveFilters && (
              <Row>
                <Col span={24}>
                  <Space wrap>
                    {searchText && (
                      <Tag closable onClose={() => setSearchText('')}>
                        Search: {searchText}
                      </Tag>
                    )}
                    {domainFilter !== 'all' && (
                      <Tag closable onClose={() => setDomainFilter('all')}>
                        Domain: {domainFilter}
                      </Tag>
                    )}
                    {teamSizeFilter !== 'all' && (
                      <Tag closable onClose={() => setTeamSizeFilter('all')}>
                        Team size: {teamSizeFilter}
                      </Tag>
                    )}
                    {openOnly && (
                      <Tag closable onClose={() => setOpenOnly(false)}>
                        Open teams only
                      </Tag>
                    )}
                    <Button
                      type="link"
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={resetFilters}
                    >
                      Clear all filters
                    </Button>
                  </Space>
                </Col>
              </Row>
            )}
          </Space>
        </Card>

        {/* Teams list */}
        <Card
          title={
            <Space>
              <TeamOutlined />
              <span>Recommended teams</span>
              <Badge
                count={filteredTeams.length}
                style={{ backgroundColor: '#1890ff' }}
              />
            </Space>
          }
        >
          {filteredTeams.length === 0 ? (
            <Empty
              description={
                <span>
                  No teams match your current filters. Try broadening your search
                  or{' '}
                  <Button
                    type="link"
                    size="small"
                    onClick={handleGoToPreferences}
                  >
                    updating your preferences
                  </Button>
                  .
                </span>
              }
            />
          ) : (
            <List
              grid={{
                gutter: 16,
                xs: 1,
                sm: 1,
                md: 2,
                lg: 2,
                xl: 3,
                xxl: 3,
              }}
              dataSource={filteredTeams}
              renderItem={(team) => {
                const sizeTag = getTeamSizeTag(team.teamSize);

                return (
                  <List.Item>
                    <Card
                      hoverable
                      onClick={() => handleOpenDrawer(team)}
                      actions={[
                        <Tooltip
                          key="join"
                          title="Join requests are unavailable until an AI matching membership contract exists."
                        >
                          <Button
                            type="link"
                            icon={<UserAddOutlined />}
                            disabled
                          >
                            Join unavailable
                          </Button>
                        </Tooltip>,
                        <Tooltip key="save" title="Saving AI-match recommendations is unavailable in this preview.">
                          <Button
                            type="link"
                            icon={<HeartOutlined />}
                            disabled
                          >
                            Save unavailable
                          </Button>
                        </Tooltip>,
                      ]}
                    >
                      <Space
                        direction="vertical"
                        size={8}
                        style={{ width: '100%' }}
                      >
                        <Space align="center" style={{ width: '100%' }}>
                          <Title
                            level={5}
                            style={{ marginBottom: 0, flex: 1 }}
                          >
                            {team.name}
                          </Title>
                          <Badge
                            status={team.isOpen ? 'success' : 'default'}
                            text={team.isOpen ? 'Open' : 'Currently full'}
                          />
                        </Space>

                        <Text type="secondary">{team.description}</Text>

                        <Space wrap size={[4, 4]}>
                          <Tag color="geekblue">{team.domain}</Tag>
                          <Tag color={sizeTag.color}>
                            {sizeTag.label} ({team.teamSize})
                          </Tag>
                          <Tag>{team.members.join(', ')}</Tag>
                        </Space>

                        <Space direction="vertical" size={4}>
                          <Text strong>Why this is a good match</Text>
                          <Paragraph
                            type="secondary"
                            ellipsis={{ rows: 2 }}
                            style={{ marginBottom: 0 }}
                          >
                            {team.matchReason}
                          </Paragraph>
                        </Space>

                        <Button
                          type="default"
                          block
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer(team);
                          }}
                        >
                          View details
                        </Button>
                      </Space>
                    </Card>
                  </List.Item>
                );
              }}
            />
          )}
        </Card>
      </Space>

      {/* Details drawer */}
      <Drawer
        title={
          selectedTeam ? (
            <Space direction="vertical" size={0}>
              <Space align="center">
                <TeamOutlined />
                <span>{selectedTeam.name}</span>
                {selectedTeam.isOpen && (
                  <Tag color="green">Open to new members</Tag>
                )}
              </Space>
              <Text type="secondary">{selectedTeam.domain}</Text>
            </Space>
          ) : (
            'Team details'
          )
        }
        width={520}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        destroyOnHidden
      >
        {selectedTeam && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <section>
              <Title level={5}>Overview</Title>
              <Paragraph>{selectedTeam.description}</Paragraph>
              <Text type="secondary">
                <InfoCircleOutlined /> This team recommendation is based on your
                profile and AI matching preferences.
              </Text>
            </section>

            <section>
              <Title level={5}>Why you’re a match</Title>
              <Paragraph>{selectedTeam.matchReason}</Paragraph>
            </section>

            <section>
              <Title level={5}>Team composition</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space size="small" wrap>
                  <Tag icon={<TeamOutlined />}>
                    {selectedTeam.teamSize} member
                    {selectedTeam.teamSize > 1 ? 's' : ''}
                  </Tag>
                  {selectedTeam.isOpen ? (
                    <Tag color="green">Actively recruiting</Tag>
                  ) : (
                    <Tag color="default">Currently full</Tag>
                  )}
                </Space>
                <List
                  size="small"
                  bordered
                  dataSource={selectedTeam.members}
                  renderItem={(member, index) => (
                    <List.Item>
                      <Text>
                        {index + 1}. {member}
                      </Text>
                    </List.Item>
                  )}
                />
              </Space>
            </section>

            <section>
              <Title level={5}>Next steps</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  block
                  disabled
                  title="Join requests are unavailable until an AI matching membership contract exists."
                >
                  Join unavailable
                </Button>
                <Button block onClick={() => handleViewWorkspace(selectedTeam)}>
                  Preview team workspace
                </Button>
                <Button
                  type="dashed"
                  icon={<HeartOutlined />}
                  block
                  disabled
                  title="Saving AI-match recommendations is unavailable in this preview."
                >
                  Save unavailable
                </Button>
              </Space>
            </section>
          </Space>
        )}
      </Drawer>
    </KeenPage>
  );
};

export default FindTeamsPage;
