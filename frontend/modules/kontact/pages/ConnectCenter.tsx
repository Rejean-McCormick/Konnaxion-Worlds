// FILE: frontend/modules/kontact/pages/ConnectCenter.tsx
﻿// frontend/modules/kontact/pages/ConnectCenter.tsx
'use client';

import {
  AppstoreOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Badge,
  Col,
  Empty,
  Input,
  Row,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React, { useMemo, useState } from 'react';

import usePageTitle from '@/hooks/usePageTitle';
import { OpportunityList, ProfileCard } from '@/kontact/components';
import { useOpportunities, useProfiles } from '@/kontact/hooks';

const { Text, Title } = Typography;
const { Search } = Input;

type TabKey = 'people' | 'opportunities' | 'all';
type ProfileView = React.ComponentProps<typeof ProfileCard>['profile'];
type OpportunityView = NonNullable<
  React.ComponentProps<typeof OpportunityList>['opportunities']
>[number];

export default function ConnectCenter(): JSX.Element {
  usePageTitle('Kontact · Connect center');

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('people');

  const profilesQuery = useProfiles();
  const opportunitiesQuery = useOpportunities();

  const profiles = useMemo<ProfileView[]>(
    () =>
      (profilesQuery.data ?? []).map((profile) => ({
        id: profile.id,
        name: profile.displayName,
        headline: profile.headline,
        avatarUrl: profile.avatarUrl,
        location: profile.location,
        bio: profile.shortBio,
        expertiseTags: profile.expertiseTags,
        ekohScore: profile.reputationScore,
        isOpenToCollab: Boolean(profile.availability),
      })),
    [profilesQuery.data],
  );

  const opportunities = useMemo<OpportunityView[]>(
    () =>
      (opportunitiesQuery.data ?? []).map((opportunity) => ({
        id: opportunity.id,
        title: opportunity.title,
        summary: opportunity.summary,
        organisation: opportunity.organisation,
        location: opportunity.location,
        tags: opportunity.tags,
        commitmentLevel: opportunity.commitment,
        closingDate: opportunity.deadline,
      })),
    [opportunitiesQuery.data],
  );

  const profilesLoading = profilesQuery.isLoading;
  const opportunitiesLoading = opportunitiesQuery.isLoading;
  const loading = profilesLoading || opportunitiesLoading;
  const error = profilesQuery.error ?? opportunitiesQuery.error;

  const lowerSearch = searchTerm.trim().toLowerCase();

  const filteredProfiles = useMemo(
    () =>
      !lowerSearch
        ? profiles
        : profiles.filter((p) => {
            const tags = p.expertiseTags?.join(' ') ?? '';
            const haystack = `${p.name} ${p.headline ?? ''} ${tags}`.toLowerCase();
            return haystack.includes(lowerSearch);
          }),
    [profiles, lowerSearch],
  );

  const filteredOpportunities = useMemo(
    () =>
      !lowerSearch
        ? opportunities
        : opportunities.filter((o) => {
            const tags = Array.isArray(o.tags) ? o.tags.join(' ') : '';
            const haystack = `${o.title} ${o.organisation ?? ''} ${tags}`.toLowerCase();
            return haystack.includes(lowerSearch);
          }),
    [opportunities, lowerSearch],
  );

  const totalMatches = filteredProfiles.length + filteredOpportunities.length;

  const renderPeopleTab = () => {
    if (loading && profiles.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      );
    }

    if (!loading && filteredProfiles.length === 0) {
      return <Empty description="No matching people yet" />;
    }

    return (
      <Row gutter={[16, 16]}>
        {filteredProfiles.map((profile) => (
          <Col
            key={profile.id}
            xs={24}
            sm={12}
            xl={8}
          >
            {/* ProfileCard will be implemented to accept a `profile` prop */}
            <ProfileCard profile={profile} />
          </Col>
        ))}
      </Row>
    );
  };

  const renderOpportunitiesTab = () => {
    if (loading && opportunities.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      );
    }

    if (!loading && filteredOpportunities.length === 0) {
      return <Empty description="No matching opportunities yet" />;
    }

    // OpportunityList will be implemented to accept these props
    return (
      <OpportunityList
        opportunities={filteredOpportunities}
        loading={opportunitiesLoading}
      />
    );
  };

  const renderAllTabChildren = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text type="secondary">People</Text>
          {renderPeopleTab()}
        </Space>
      </Col>
      <Col xs={24} lg={12}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text type="secondary">Opportunities</Text>
          {renderOpportunitiesTab()}
        </Space>
      </Col>
    </Row>
  );

  const tabItems = [
    {
      key: 'people',
      label: (
        <span>
          <UserOutlined /> People
          {filteredProfiles.length > 0 && (
            <Badge
              style={{ marginLeft: 8 }}
              count={filteredProfiles.length}
              overflowCount={99}
            />
          )}
        </span>
      ),
      children: renderPeopleTab(),
    },
    {
      key: 'opportunities',
      label: (
        <span>
          <AppstoreOutlined /> Opportunities
          {filteredOpportunities.length > 0 && (
            <Badge
              style={{ marginLeft: 8 }}
              count={filteredOpportunities.length}
              overflowCount={99}
            />
          )}
        </span>
      ),
      children: renderOpportunitiesTab(),
    },
    {
      key: 'all',
      label: (
        <span>
          <TeamOutlined /> Combined
        </span>
      ),
      children: renderAllTabChildren(),
    },
  ];

  return (
    <PageContainer ghost>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header + search */}
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Title level={3} style={{ marginBottom: 0 }}>
            Connect center
          </Title>
          <Text type="secondary">
            Discover people to collaborate with and opportunities that match your skills,
            interests, and impact goals.
          </Text>

          <Space
            align="center"
            style={{
              marginTop: 12,
              width: '100%',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <Search
              placeholder="Search people or opportunities…"
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={(value) => setSearchTerm(value)}
              style={{ maxWidth: 420, flex: 1 }}
              prefix={<SearchOutlined />}
            />

            <Space size="small" wrap>
              <Tag color="blue">
                People&nbsp;
                {filteredProfiles.length}
              </Tag>
              <Tag color="green">
                Opportunities&nbsp;
                {filteredOpportunities.length}
              </Tag>
              <Tag>{totalMatches} total matches</Tag>
            </Space>
          </Space>
        </Space>

        {/* Error state */}
        {error && (
          <Alert
            type="error"
            showIcon
            message="Unable to load connect data"
            description={error.message ?? 'Please try again in a moment.'}
          />
        )}

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          items={tabItems}
        />
      </Space>
    </PageContainer>
  );
}
