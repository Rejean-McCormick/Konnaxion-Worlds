// FILE: frontend/services/projects.ts
// services/projects.ts
// Thin service layer around the backend /api/projects/ endpoints.

import { del, get, post, put } from './_request';

export type ProjectId = number | string;

export type ProjectStatusApi = 'idea' | 'progress' | 'completed' | 'validated';

export interface ApiProject {
  id: number;
  creator: string;
  title: string;
  description: string;
  category: string;
  status: ProjectStatusApi;
  created_at: string;
  updated_at: string;
  tags: number[];
}

const PROJECTS_ENDPOINT = 'projects/';

/**
 * Fetch list of collaborative projects.
 * Backend: GET /api/projects/
 */
export async function fetchProjects(): Promise<ApiProject[]> {
  // baseURL is provided by NEXT_PUBLIC_API_BASE (e.g. http://localhost:8000/api)
  return get<ApiProject[]>(PROJECTS_ENDPOINT);
}

/**
 * Fetch a single project by id.
 * Backend: GET /api/projects/:id/
 */
export async function fetchProject(id: ProjectId): Promise<ApiProject> {
  return get<ApiProject>(`${PROJECTS_ENDPOINT}${id}/`);
}

export interface CreateProjectPayload {
  title: string;
  description?: string;
  category?: string;
  status?: ProjectStatusApi;
  tags?: number[];
}

/**
 * Create a new project.
 * Backend: POST /api/projects/
 * The authenticated user is taken from the session/cookie.
 */
export async function createProject(
  payload: CreateProjectPayload,
): Promise<ApiProject> {
  return post<ApiProject>(PROJECTS_ENDPOINT, payload);
}

/**
 * Update an existing project.
 * Backend: PUT /api/projects/:id/
 */
export async function updateProject(
  id: ProjectId,
  payload: Partial<CreateProjectPayload>,
): Promise<ApiProject> {
  return put<ApiProject>(`${PROJECTS_ENDPOINT}${id}/`, payload);
}

/**
 * Delete an existing project.
 * Backend: DELETE /api/projects/:id/
 */
export async function deleteProject(id: ProjectId): Promise<void> {
  await del<void>(`${PROJECTS_ENDPOINT}${id}/`);
}
