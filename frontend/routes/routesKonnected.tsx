// FILE: frontend/routes/routesKonnected.tsx
"use client";

import {
  AppstoreOutlined,
  AuditOutlined,
  BookOutlined,
  BuildOutlined,
  BulbOutlined,
  CommentOutlined,
  DashboardOutlined,
  DownloadOutlined,
  EditOutlined,
  FileDoneOutlined,
  FormOutlined,
  LikeOutlined,
  MessageOutlined,
  ProfileOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SolutionOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import React from "react";

import type { Route } from "./types";

/**
 * KonnectED module navigation.
 *
 * Keep every sidebar path aligned with an existing Next.js app route page.
 * Old learn, certs, and course paths are not exposed unless matching pages exist.
 */
export const KONNECTED_ROUTES = {
  overview: "/konnected/dashboard",

  learningLibrary: {
    browse: "/konnected/learning-library/browse-resources",
    search: "/konnected/learning-library/search-filters",
    recommendations: "/konnected/learning-library/recommended-resources",
    offline: "/konnected/learning-library/offline-content",
  },

  learningPaths: {
    mine: "/konnected/learning-paths/my-learning-path",
    create: "/konnected/learning-paths/create-learning-path",
    manage: "/konnected/learning-paths/manage-existing-paths",
  },

  certifications: {
    programs: "/konnected/certifications/certification-programs",
    examDashboard: "/konnected/certifications/exam-dashboard-results",
    preparation: "/konnected/certifications/exam-preparation",
    registration: "/konnected/certifications/exam-registration",
  },

  community: {
    activeThreads: "/konnected/community-discussions/active-threads",
    startDiscussion: "/konnected/community-discussions/start-new-discussion",
    moderation: "/konnected/community-discussions/moderation",
  },

  collaboration: {
    myTeams: "/konnected/teams-collaboration/my-teams",
    activityPlanner: "/konnected/teams-collaboration/activity-planner",
    projectWorkspaces: "/konnected/teams-collaboration/project-workspaces",
    teamBuilder: "/konnected/teams-collaboration/team-builder",
  },

  knowledge: {
    contribute: "/konnected/knowledge/contribute",
  },

  mentorship: "/konnected/mentorship",
} as const;

const konnectedDashboard: Route = {
  path: KONNECTED_ROUTES.overview,
  name: "KonnectED – Overview",
  icon: <DashboardOutlined />,
};

const learningLibraryGroup: Route = {
  name: "Learning Library",
  views: [
    {
      path: KONNECTED_ROUTES.learningLibrary.browse,
      name: "Browse resources",
      icon: <BookOutlined />,
    },
    {
      path: KONNECTED_ROUTES.learningLibrary.search,
      name: "Search / filters",
      icon: <SearchOutlined />,
    },
    {
      path: KONNECTED_ROUTES.learningLibrary.recommendations,
      name: "Recommended resources",
      icon: <LikeOutlined />,
    },
    {
      path: KONNECTED_ROUTES.learningLibrary.offline,
      name: "Offline content",
      icon: <DownloadOutlined />,
    },
  ],
};

const learningPathsGroup: Route = {
  name: "Learning Paths",
  views: [
    {
      path: KONNECTED_ROUTES.learningPaths.mine,
      name: "My learning path",
      icon: <ProfileOutlined />,
    },
    {
      path: KONNECTED_ROUTES.learningPaths.create,
      name: "Create learning path",
      icon: <FormOutlined />,
    },
    {
      path: KONNECTED_ROUTES.learningPaths.manage,
      name: "Manage paths",
      icon: <BuildOutlined />,
    },
  ],
};

const certificationsGroup: Route = {
  name: "CertifiKation",
  views: [
    {
      path: KONNECTED_ROUTES.certifications.programs,
      name: "Certification programs",
      icon: <SafetyCertificateOutlined />,
    },
    {
      path: KONNECTED_ROUTES.certifications.examDashboard,
      name: "Exam dashboard / results",
      icon: <TrophyOutlined />,
    },
    {
      path: KONNECTED_ROUTES.certifications.preparation,
      name: "Exam preparation",
      icon: <BulbOutlined />,
    },
    {
      path: KONNECTED_ROUTES.certifications.registration,
      name: "Exam registration",
      icon: <AuditOutlined />,
    },
  ],
};

const communityGroup: Route = {
  name: "Community Discussions",
  views: [
    {
      path: KONNECTED_ROUTES.community.activeThreads,
      name: "Active threads",
      icon: <CommentOutlined />,
    },
    {
      path: KONNECTED_ROUTES.community.startDiscussion,
      name: "Start discussion",
      icon: <EditOutlined />,
    },
    {
      path: KONNECTED_ROUTES.community.moderation,
      name: "Moderation",
      icon: <FileDoneOutlined />,
    },
  ],
};

const collaborationGroup: Route = {
  name: "Teams & Collaboration",
  views: [
    {
      path: KONNECTED_ROUTES.collaboration.myTeams,
      name: "My teams",
      icon: <TeamOutlined />,
    },
    {
      path: KONNECTED_ROUTES.collaboration.activityPlanner,
      name: "Activity planner",
      icon: <FormOutlined />,
    },
    {
      path: KONNECTED_ROUTES.collaboration.projectWorkspaces,
      name: "Project workspaces",
      icon: <AppstoreOutlined />,
    },
    {
      path: KONNECTED_ROUTES.collaboration.teamBuilder,
      name: "Team builder",
      icon: <MessageOutlined />,
    },
  ],
};

const knowledgeGroup: Route = {
  name: "Knowledge Contribution",
  views: [
    {
      path: KONNECTED_ROUTES.knowledge.contribute,
      name: "Contribute",
      icon: <ReadOutlined />,
    },
    {
      path: KONNECTED_ROUTES.mentorship,
      name: "Mentorship",
      icon: <SolutionOutlined />,
    },
  ],
};

const routes: Route[] = [
  konnectedDashboard,
  learningLibraryGroup,
  learningPathsGroup,
  certificationsGroup,
  communityGroup,
  collaborationGroup,
  knowledgeGroup,
];

export default routes;