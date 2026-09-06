// FILE: frontend/routes/routesEthikos.tsx
'use client';

import {
  ApartmentOutlined,
  BellOutlined,
  BranchesOutlined,
  ColumnHeightOutlined,
  ColumnWidthOutlined,
  CrownOutlined,
  DashboardOutlined,
  DragOutlined,
  ExpandAltOutlined,
  HistoryOutlined,
  NodeIndexOutlined,
  ProfileOutlined,
  RadarChartOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SendOutlined,
  SmileOutlined,
  StarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import React from 'react';

// Minimal local type to avoid external coupling
type Route = {
  path?: string;
  name: string;
  icon?: React.ReactNode;
  views?: Route[];
};

// Overview
const ethikosDashboard: Route = {
  path: '/ethikos/insights',
  name: 'Overview',
  icon: <DashboardOutlined />,
};

// Deliberate: explore topics, arguments, and debate norms.
const deliberateGroup: Route = {
  name: 'Deliberate',
  views: [
    {
      path: '/ethikos/deliberate/elite',
      name: 'Expert deliberation',
      icon: <StarOutlined />,
    },
    {
      path: '/ethikos/deliberate/guidelines',
      name: 'Guidelines',
      icon: <NodeIndexOutlined />,
    },
    // Important: no dynamic placeholder like "/ethikos/deliberate/[topic]"
    // so that Next.js <Link> never receives a dynamic pattern as href.
  ],
};

// Decide: voting, consultations, results, and method.
const decideGroup: Route = {
  name: 'Decide',
  views: [
    {
      path: '/ethikos/decide/public',
      name: 'Public consultations',
      icon: <SafetyCertificateOutlined />,
    },
    {
      path: '/ethikos/decide/elite',
      name: 'Expert decisions',
      icon: <ApartmentOutlined />,
    },
    {
      path: '/ethikos/decide/results',
      name: 'Results',
      icon: <CrownOutlined />,
    },
    {
      path: '/ethikos/decide/methodology',
      name: 'Methodology',
      icon: <ProfileOutlined />,
    },
  ],
};

// Impact: what happened after deliberation and voting.
const impactGroup: Route = {
  name: 'Impact',
  views: [
    {
      path: '/ethikos/impact/tracker',
      name: 'Impact tracker',
      icon: <RadarChartOutlined />,
    },
    {
      path: '/ethikos/impact/outcomes',
      name: 'Outcomes',
      icon: <SendOutlined />,
    },
    {
      path: '/ethikos/impact/feedback',
      name: 'Feedback',
      icon: <BellOutlined />,
    },
  ],
};

// Pulse: live monitoring and health signals.
const pulseGroup: Route = {
  name: 'Pulse',
  views: [
    {
      path: '/ethikos/pulse/live',
      name: 'Live activity',
      icon: <ColumnWidthOutlined />,
    },
    {
      path: '/ethikos/pulse/health',
      name: 'Debate health',
      icon: <ColumnHeightOutlined />,
    },
    {
      path: '/ethikos/pulse/trends',
      name: 'Trends',
      icon: <ExpandAltOutlined />,
    },
    {
      path: '/ethikos/pulse/overview',
      name: 'Pulse overview',
      icon: <DragOutlined />,
    },
  ],
};

// Trust: credibility and expertise signals.
const trustGroup: Route = {
  name: 'Trust',
  views: [
    {
      path: '/ethikos/trust/profile',
      name: 'Trust profile',
      icon: <SmileOutlined />,
    },
    {
      path: '/ethikos/trust/badges',
      name: 'Badges',
      icon: <TrophyOutlined />,
    },
    {
      path: '/ethikos/trust/credentials',
      name: 'Credentials',
      icon: <SearchOutlined />,
    },
  ],
};

// Learn: help, definitions, and release notes.
const learnGroup: Route = {
  name: 'Learn',
  views: [
    {
      path: '/ethikos/learn/guides',
      name: 'Guides',
      icon: <BranchesOutlined />,
    },
    {
      path: '/ethikos/learn/glossary',
      name: 'Glossary',
      icon: <ProfileOutlined />,
    },
    {
      path: '/ethikos/learn/changelog',
      name: 'Changelog',
      icon: <HistoryOutlined />,
    },
  ],
};

// Community: cross-module consensus and recognition.
const communityGroup: Route = {
  name: 'Community',
  views: [
    {
      path: '/konsensus/leaderboards',
      name: 'Leaderboards',
      icon: <CrownOutlined />,
    },
  ],
};

const routes: Route[] = [
  ethikosDashboard,
  deliberateGroup,
  decideGroup,
  impactGroup,
  pulseGroup,
  trustGroup,
  learnGroup,
  communityGroup,
];

export default routes;