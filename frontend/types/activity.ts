// FILE: frontend/types/activity.ts
// types/activity.ts
import type React from 'react';

export interface ActivityUser {
  userId: string;
  nickname?: string;
  name?: string;
  picture: string;
}

export interface ActivitySculptureImage {
  url: string;
  created: string | Date;
}

export interface ActivitySculpture {
  accessionId?: string;
  name: string;
  images?: ActivitySculptureImage[];
}

export interface ActivityCommentItem {
  commentId: string;
  content: string;
  createdTime: string | Date;
  user: ActivityUser;
  sculpture: ActivitySculpture;
}

export interface ActivityLikeItem {
  likedTime: string | Date;
  user: ActivityUser;
  sculptureId?: string;
  sculpture: ActivitySculpture;
}

export interface ActivityVisitItem {
  visitTime: string | Date;
  user: ActivityUser;
  sculptureId?: string;
  sculpture: ActivitySculpture;
}

export interface ActivityListItemView {
  key?: string;
  author: React.ReactNode;
  avatar: React.ReactNode;
  content: React.ReactNode;
  datetime?: React.ReactNode;
}
