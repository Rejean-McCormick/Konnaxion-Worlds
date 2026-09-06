// FILE: frontend/routes/routesEkoh.tsx
"use client";

import {
  AuditOutlined,
  BarChartOutlined,
  BorderOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  FieldTimeOutlined,
  LineChartOutlined,
  StarOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import React from "react";

import type { Route } from "./types";

export const EKOH_ROUTES = {
  ekoh: {
    dashboard: "/ekoh/dashboard",
    score: "/ekoh/overview-analytics/current-ekoh-score",
    expertise: "/ekoh/expertise-areas/view-current-expertise",
    badges: "/ekoh/achievements-badges/earned-badges-display",
    votingWeight: "/ekoh/voting-influence/current-voting-weight",
  },

  konsensus: {
    center: "/konsensus",
    dashboard: "/konsensus/dashboard",
    activityFeed: "/konsensus/activity-feed",
    leaderboards: "/konsensus/leaderboards",
  },

  reports: {
    smartVote: "/reports/smart-vote",
  },
} as const;

const ekohDashboard: Route = {
  path: EKOH_ROUTES.ekoh.dashboard,
  name: "EkoH – Overview",
  icon: <DashboardOutlined />,
};

const reputationGroup: Route = {
  name: "Reputation",
  views: [
    {
      path: EKOH_ROUTES.ekoh.score,
      name: "EkoH profile analytics",
      icon: <LineChartOutlined />,
    },
    {
      path: EKOH_ROUTES.ekoh.expertise,
      name: "Current expertise",
      icon: <DeploymentUnitOutlined />,
    },
    {
      path: EKOH_ROUTES.ekoh.badges,
      name: "Achievements & badges",
      icon: <StarOutlined />,
    },
  ],
};

const smartVoteGroup: Route = {
  name: "Smart Vote",
  views: [
    {
      path: EKOH_ROUTES.konsensus.center,
      name: "Konsensus Center",
      icon: <UsergroupAddOutlined />,
    },
    {
      path: EKOH_ROUTES.konsensus.dashboard,
      name: "Konsensus dashboard",
      icon: <BarChartOutlined />,
    },
    {
      path: EKOH_ROUTES.ekoh.votingWeight,
      name: "Contextual influence",
      icon: <BorderOutlined />,
    },
    {
      path: EKOH_ROUTES.konsensus.activityFeed,
      name: "Activity feed",
      icon: <FieldTimeOutlined />,
    },
    {
      path: EKOH_ROUTES.konsensus.leaderboards,
      name: "Leaderboards",
      icon: <TrophyOutlined />,
    },
    {
      path: EKOH_ROUTES.reports.smartVote,
      name: "Smart Vote reports",
      icon: <AuditOutlined />,
    },
  ],
};

const routes: Route[] = [
  ekohDashboard,
  reputationGroup,
  smartVoteGroup,
];

export default routes;
