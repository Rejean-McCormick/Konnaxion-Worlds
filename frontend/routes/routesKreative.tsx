// FILE: frontend/routes/routesKreative.tsx
"use client";

import {
  BankOutlined,
  BulbOutlined,
  CloudUploadOutlined,
  CrownOutlined,
  DashboardOutlined,
  EyeOutlined,
  GlobalOutlined,
  HighlightOutlined,
  HomeOutlined,
  MessageOutlined,
  PictureOutlined,
  ProfileOutlined,
  SearchOutlined,
  StarOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import React from "react";

import type { Route } from "./types";

/**
 * Kreative module navigation.
 *
 * Keep every sidebar path aligned with an existing Next.js app route page.
 * Old archive, connect, art, and short Kreative paths are not exposed unless
 * matching pages exist.
 */
export const KREATIVE_ROUTES = {
  dashboard: "/kreative/dashboard",

  showcases: {
    featuredProjects: "/kreative/community-showcases/featured-projects",
    topCreators: "/kreative/community-showcases/top-creators",
    submitToShowcase: "/kreative/community-showcases/submit-to-showcase",
  },

  creativeHub: {
    exploreIdeas: "/kreative/creative-hub/explore-ideas",
    inspirationGallery: "/kreative/creative-hub/inspiration-gallery",
    submitCreativeWork: "/kreative/creative-hub/submit-creative-work",
  },

  incubator: {
    collaborateOnIdeas: "/kreative/idea-incubator/collaborate-on-ideas",
    createNewIdea: "/kreative/idea-incubator/create-new-idea",
    myIdeas: "/kreative/idea-incubator/my-ideas",
  },

  collaborativeSpaces: {
    findSpaces: "/kreative/collaborative-spaces/find-spaces",
    startNewSpace: "/kreative/collaborative-spaces/start-new-space",
    mySpaces: "/kreative/collaborative-spaces/my-spaces",
  },

  archive: {
    traditionsArchive: "/kreative/traditions-archive",
  },

  mentorship: "/kreative/mentorship",
} as const;

const kreativeDashboard: Route = {
  path: KREATIVE_ROUTES.dashboard,
  name: "Kreative – Overview",
  icon: <DashboardOutlined />,
};

const showcaseGroup: Route = {
  name: "Community Showcases",
  views: [
    {
      path: KREATIVE_ROUTES.showcases.featuredProjects,
      name: "Featured projects",
      icon: <StarOutlined />,
    },
    {
      path: KREATIVE_ROUTES.showcases.topCreators,
      name: "Top creators",
      icon: <CrownOutlined />,
    },
    {
      path: KREATIVE_ROUTES.showcases.submitToShowcase,
      name: "Submit to showcase",
      icon: <CloudUploadOutlined />,
    },
  ],
};

const creativeHubGroup: Route = {
  name: "Creative Hub",
  views: [
    {
      path: KREATIVE_ROUTES.creativeHub.exploreIdeas,
      name: "Explore ideas",
      icon: <BulbOutlined />,
    },
    {
      path: KREATIVE_ROUTES.creativeHub.inspirationGallery,
      name: "Inspiration gallery",
      icon: <PictureOutlined />,
    },
    {
      path: KREATIVE_ROUTES.creativeHub.submitCreativeWork,
      name: "Submit creative work",
      icon: <CloudUploadOutlined />,
    },
  ],
};

const incubatorGroup: Route = {
  name: "Idea Incubator",
  views: [
    {
      path: KREATIVE_ROUTES.incubator.collaborateOnIdeas,
      name: "Collaborate on ideas",
      icon: <TeamOutlined />,
    },
    {
      path: KREATIVE_ROUTES.incubator.createNewIdea,
      name: "Create new idea",
      icon: <HighlightOutlined />,
    },
    {
      path: KREATIVE_ROUTES.incubator.myIdeas,
      name: "My ideas",
      icon: <ProfileOutlined />,
    },
  ],
};

const collaborativeSpacesGroup: Route = {
  name: "Collaborative Spaces",
  views: [
    {
      path: KREATIVE_ROUTES.collaborativeSpaces.findSpaces,
      name: "Find spaces",
      icon: <SearchOutlined />,
    },
    {
      path: KREATIVE_ROUTES.collaborativeSpaces.startNewSpace,
      name: "Start new space",
      icon: <HomeOutlined />,
    },
    {
      path: KREATIVE_ROUTES.collaborativeSpaces.mySpaces,
      name: "My spaces",
      icon: <MessageOutlined />,
    },
  ],
};

const archiveGroup: Route = {
  name: "Archive & Mentorship",
  views: [
    {
      path: KREATIVE_ROUTES.archive.traditionsArchive,
      name: "Traditions archive",
      icon: <BankOutlined />,
    },
    {
      path: KREATIVE_ROUTES.mentorship,
      name: "Mentorship",
      icon: <UserSwitchOutlined />,
    },
  ],
};

const profileReferenceGroup: Route = {
  name: "Profiles",
  views: [
    {
      path: KREATIVE_ROUTES.showcases.topCreators,
      name: "Creator profiles",
      icon: <ProfileOutlined />,
    },
    {
      path: KREATIVE_ROUTES.collaborativeSpaces.mySpaces,
      name: "Collaboration rooms",
      icon: <GlobalOutlined />,
    },
    {
      path: KREATIVE_ROUTES.creativeHub.inspirationGallery,
      name: "Gallery",
      icon: <EyeOutlined />,
    },
  ],
};

const routes: Route[] = [
  kreativeDashboard,
  showcaseGroup,
  creativeHubGroup,
  incubatorGroup,
  collaborativeSpacesGroup,
  archiveGroup,
  profileReferenceGroup,
];

export default routes;