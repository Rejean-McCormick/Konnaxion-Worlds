// FILE: frontend/routes/routesTeambuilder.tsx
'use client';

import {
  BookOutlined,
  DashboardOutlined,
  GlobalOutlined,
  PartitionOutlined,
  PlusCircleOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import React from 'react';

import type { Route } from './types';

/* ---------- Sessions ---------- */

const sessionsGroup: Route = {
  name: 'Sessions',
  scope: 'module',
  moduleKey: 'teambuilder',
  views: [
    {
      path: '/teambuilder',
      name: 'All sessions',
      icon: <DashboardOutlined />,
      scope: 'module',
      moduleKey: 'teambuilder',
    },
    {
      path: '/teambuilder/create',
      name: 'New session',
      icon: <PlusCircleOutlined />,
      scope: 'module',
      moduleKey: 'teambuilder',
    },
    // NOTE: /teambuilder/[sessionId] is dynamic and intentionally
    // not exposed directly in the sidebar.
  ],
};

/* ---------- Humans submodule ---------- */

const humansGroup: Route = {
  name: 'Humans',
  scope: 'module',
  moduleKey: 'teambuilder',
  views: [
    {
      path: '/teambuilder/humans',
      name: 'Overview',
      icon: <TeamOutlined />,
      scope: 'module',
      moduleKey: 'teambuilder',
    },
    {
      path: '/teambuilder/humans/constraints',
      name: 'Language, geo & schedule',
      icon: <GlobalOutlined />,
      scope: 'module',
      moduleKey: 'teambuilder',
    },
    {
      path: '/teambuilder/humans/conflicts',
      name: 'Conflicts & pairing',
      icon: <WarningOutlined />,
      scope: 'module',
      moduleKey: 'teambuilder',
    },
    {
      path: '/teambuilder/humans/modes',
      name: 'Team modes',
      icon: <UserSwitchOutlined />,
      scope: 'module',
      moduleKey: 'teambuilder',
    },
  ],
};

/* ---------- Problems submodule ---------- */

const problemsGroup: Route = {
  name: 'Problems',
  scope: 'module',
  moduleKey: 'teambuilder',
  views: [
    {
      path: '/teambuilder/problems',
      name: 'Problem library',
      icon: <BookOutlined />,
      scope: 'module',
      moduleKey: 'teambuilder',
    },
    {
      path: '/teambuilder/problems/create',
      name: 'New problem',
      icon: <PlusCircleOutlined />,
      scope: 'module',
      moduleKey: 'teambuilder',
    },
    {
      path: '/teambuilder/problems/taxonomy',
      name: 'UNESCO taxonomy',
      icon: <PartitionOutlined />,
      scope: 'module',
      moduleKey: 'teambuilder',
    },
    // NOTE: /teambuilder/problems/[problemId] is dynamic and not
    // directly exposed in the sidebar.
  ],
};

const routes: Route[] = [
  sessionsGroup,
  humansGroup,
  problemsGroup,
];

export default routes;
