// FILE: frontend/routes/routesKeenkonnect.tsx
"use client";

import {
  BarChartOutlined,
  CrownOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileAddOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FilterOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  HeartOutlined,
  HistoryOutlined,
  NotificationOutlined,
  ProjectOutlined,
  RocketOutlined,
  SettingOutlined,
  TagsOutlined,
  TeamOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import React from "react";

import type { Route } from "./types";

/**
 * KeenKonnect module navigation.
 *
 * Keep every sidebar path aligned with an existing Next.js app route page.
 * Old projects conceptual routes are not exposed unless matching pages exist.
 */
export const KEENKONNECT_ROUTES = {
  dashboard: "/keenkonnect/dashboard",

  projects: {
    browse: "/keenkonnect/projects/browse-projects",
    create: "/keenkonnect/projects/create-new-project",
    mine: "/keenkonnect/projects/my-projects",
    workspace: "/keenkonnect/projects/project-workspace",
  },

  workspaces: {
    browse: "/keenkonnect/workspaces/browse-available-workspaces",
    mine: "/keenkonnect/workspaces/my-workspaces",
    launch: "/keenkonnect/workspaces/launch-new-workspace",
  },

  matching: {
    findTeams: "/keenkonnect/ai-team-matching/find-teams",
    preferences: "/keenkonnect/ai-team-matching/match-preferences",
    myMatches: "/keenkonnect/ai-team-matching/my-matches",
  },

  knowledge: {
    browseRepository: "/keenkonnect/knowledge/browse-repository",
    searchDocuments: "/keenkonnect/knowledge/search-filter-documents",
    documentManagement: "/keenkonnect/knowledge/document-management",
    uploadDocument: "/keenkonnect/knowledge/upload-new-document",
  },

  impact: {
    dashboard: "/keenkonnect/sustainability-impact/sustainability-dashboard",
    track: "/keenkonnect/sustainability-impact/track-project-impact",
    submit: "/keenkonnect/sustainability-impact/submit-impact-reports",
  },

  reputation: {
    view: "/keenkonnect/user-reputation/view-reputation-ekoh",
    manageExpertise: "/keenkonnect/user-reputation/manage-expertise-areas",
    accountPreferences: "/keenkonnect/user-reputation/account-preferences",
  },

  konsensus: {
    activityFeed: "/konsensus/activity-feed",
    leaderboards: "/konsensus/leaderboards",
  },
} as const;

const keenDashboard: Route = {
  path: KEENKONNECT_ROUTES.dashboard,
  name: "KeenKonnect – Overview",
  icon: <DashboardOutlined />,
};

const projectStudioGroup: Route = {
  name: "Project Studio",
  views: [
    {
      path: KEENKONNECT_ROUTES.projects.browse,
      name: "Browse projects",
      icon: <ProjectOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.projects.create,
      name: "Create project",
      icon: <FileAddOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.projects.mine,
      name: "My projects",
      icon: <FolderOpenOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.projects.workspace,
      name: "Project workspace",
      icon: <FileTextOutlined />,
    },
  ],
};

const workspaceGroup: Route = {
  name: "Workspaces",
  views: [
    {
      path: KEENKONNECT_ROUTES.workspaces.browse,
      name: "Browse workspaces",
      icon: <GlobalOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.workspaces.mine,
      name: "My workspaces",
      icon: <FolderOpenOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.workspaces.launch,
      name: "Launch workspace",
      icon: <RocketOutlined />,
    },
  ],
};

const matchingGroup: Route = {
  name: "AI Team Matching",
  views: [
    {
      path: KEENKONNECT_ROUTES.matching.findTeams,
      name: "Find teams",
      icon: <TeamOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.matching.preferences,
      name: "Match preferences",
      icon: <SettingOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.matching.myMatches,
      name: "My matches",
      icon: <HeartOutlined />,
    },
  ],
};

const stockageGroup: Route = {
  name: "Stockage",
  views: [
    {
      path: KEENKONNECT_ROUTES.knowledge.browseRepository,
      name: "Browse repository",
      icon: <DatabaseOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.knowledge.searchDocuments,
      name: "Search documents",
      icon: <FilterOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.knowledge.documentManagement,
      name: "Document management",
      icon: <FileSearchOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.knowledge.uploadDocument,
      name: "Upload document",
      icon: <UploadOutlined />,
    },
  ],
};

const impactGroup: Route = {
  name: "Sustainability Impact",
  views: [
    {
      path: KEENKONNECT_ROUTES.impact.dashboard,
      name: "Impact dashboard",
      icon: <BarChartOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.impact.track,
      name: "Track project impact",
      icon: <HistoryOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.impact.submit,
      name: "Submit impact reports",
      icon: <FileTextOutlined />,
    },
  ],
};

const reputationGroup: Route = {
  name: "Reputation",
  views: [
    {
      path: KEENKONNECT_ROUTES.reputation.view,
      name: "View reputation / EkoH",
      icon: <CrownOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.reputation.manageExpertise,
      name: "Manage expertise areas",
      icon: <TagsOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.reputation.accountPreferences,
      name: "Account preferences",
      icon: <SettingOutlined />,
    },
  ],
};

const projectSignalsGroup: Route = {
  name: "Project Signals",
  views: [
    {
      path: KEENKONNECT_ROUTES.konsensus.activityFeed,
      name: "Activity feed",
      icon: <NotificationOutlined />,
    },
    {
      path: KEENKONNECT_ROUTES.konsensus.leaderboards,
      name: "Leaderboards",
      icon: <CrownOutlined />,
    },
  ],
};

const routes: Route[] = [
  keenDashboard,
  projectStudioGroup,
  workspaceGroup,
  matchingGroup,
  stockageGroup,
  impactGroup,
  reputationGroup,
  projectSignalsGroup,
];

export default routes;