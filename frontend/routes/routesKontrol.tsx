// FILE: frontend/routes/routesKontrol.tsx
'use client';

import {
  BarChartOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  LineChartOutlined,
  LockOutlined,
  PieChartOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import React from 'react';

// Explicit scope metadata for Kontrol navigation
// - "platform": affects the whole platform / all modules
// - "module": focused on operations over module content (Ethikos, Konnected, etc.)
type Scope = 'platform' | 'module';

type Route = {
  path?: string;
  name: string;
  icon?: React.ReactNode;
  views?: Route[];

  // Optional scope metadata used by the Kontrol UI to show badges / grouping
  scope?: Scope;

  // Optional: when scope === "module", this can be used later
  // to specialise labels or filters (e.g. Ethikos, Konnected, …).
  // For now it’s informational only.
  moduleKey?:
    | 'ekoh'
    | 'ethikos'
    | 'keenkonnect'
    | 'konnected'
    | 'kreative'
    | 'teambuilder'
    | 'multi';
};

// 1. Dashboard (The Homepage) – platform-wide overview
const dashboard: Route = {
  path: '/kontrol/dashboard',
  name: 'Overview',
  icon: <DashboardOutlined />,
  scope: 'platform',
};

// 2. Module Operations (moderation & user content) – module-focused scope
const operationsGroup: Route = {
  name: 'Module Operations',
  views: [
    {
      path: '/kontrol/users/all',
      name: 'User Database',
      icon: <UserOutlined />,
      scope: 'platform', // user base across all modules
    },
    {
      path: '/kontrol/moderation/queue',
      name: 'Moderation Queue',
      icon: <WarningOutlined />,
      scope: 'module', // operates on module content (Ethikos, Konnected, Kreative…)
      moduleKey: 'multi',
    },
    {
      path: '/kontrol/moderation/community',
      name: 'Community Contexts',
      icon: <TeamOutlined />,
      scope: 'module', // defines contexts for module communities
      moduleKey: 'multi',
    },
  ],
};

// 3. Platform Governance (configuration & logs) – platform scope
const governanceGroup: Route = {
  name: 'Platform Governance',
  views: [
    {
      path: '/kontrol/konsensus',
      name: 'Konsensus Rules',
      icon: <FileProtectOutlined />,
      scope: 'platform',
    },
    {
      path: '/kontrol/roles',
      name: 'Roles & Permissions',
      icon: <LockOutlined />,
      scope: 'platform',
    },
    {
      path: '/kontrol/audit-log',
      name: 'System Audit Log',
      icon: <FileSearchOutlined />,
      scope: 'platform',
    },
  ],
};

// 4. Analytics & Insights (reporting) – platform scope over all modules
const insightsGroup: Route = {
  name: 'Analytics & Reports',
  views: [
    {
      path: '/reports',
      name: 'Insights Overview',
      icon: <LineChartOutlined />,
      scope: 'platform',
    },
    {
      path: '/reports/smart-vote',
      name: 'Smart Vote Impact',
      icon: <PieChartOutlined />,
      scope: 'platform',
    },
    {
      path: '/reports/usage',
      name: 'Adoption & Usage',
      icon: <BarChartOutlined />,
      scope: 'platform',
    },
    {
      path: '/reports/perf',
      name: 'System Performance',
      icon: <ThunderboltOutlined />,
      scope: 'platform',
    },
    {
      path: '/reports/custom',
      name: 'Custom Reports',
      icon: <FileTextOutlined />,
      scope: 'platform',
    },
  ],
};

const routes: Route[] = [dashboard, operationsGroup, governanceGroup, insightsGroup];

export default routes;
