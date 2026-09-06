// frontend/services/teambuilder/index.ts
import api from '@/services/_request';

import {
  IBuilderSession,
  ICreateProblemRequest,
  ICreateSessionRequest,
  IProblemDetailResponse,
  ITeambuilderProblem,
  ITeam,
  IUpdateProblemRequest,
} from './types';

const BASE_URL = '/teambuilder';

export const teambuilderService = {
  /**
   * Fetch all team building sessions (history).
   */
  async getSessions(): Promise<IBuilderSession[]> {
    return api.get<IBuilderSession[]>(`${BASE_URL}/sessions/`);
  },

  /**
   * Get a single session by ID, including its generated teams.
   */
  async getSessionById(sessionId: string): Promise<IBuilderSession> {
    return api.get<IBuilderSession>(`${BASE_URL}/sessions/${sessionId}/`);
  },

  /**
   * Create a new configuration for a team building session.
   */
  async createSession(data: ICreateSessionRequest): Promise<IBuilderSession> {
    return api.post<IBuilderSession>(`${BASE_URL}/sessions/`, data);
  },

  /**
   * Trigger the algorithm to generate teams for a specific session.
   */
  async generateTeams(sessionId: string): Promise<IBuilderSession> {
    return api.post<IBuilderSession>(`${BASE_URL}/sessions/${sessionId}/generate/`);
  },


  /**
   * Reusable TeamBuilder problem templates.
   */
  async getProblems(): Promise<ITeambuilderProblem[]> {
    return api.get<ITeambuilderProblem[]>(`${BASE_URL}/problems/`);
  },

  async getProblemDetail(problemId: string): Promise<IProblemDetailResponse> {
    return api.get<IProblemDetailResponse>(`${BASE_URL}/problems/${problemId}/`);
  },

  async createProblem(data: ICreateProblemRequest): Promise<ITeambuilderProblem> {
    return api.post<ITeambuilderProblem>(`${BASE_URL}/problems/`, data);
  },

  async updateProblem(
    problemId: string,
    data: IUpdateProblemRequest,
  ): Promise<ITeambuilderProblem> {
    return api.patch<ITeambuilderProblem>(
      `${BASE_URL}/problems/${problemId}/`,
      data,
    );
  },

  /**
   * Fetch specific teams (optional, can filter by session_id in params if needed).
   */
  async getTeams(sessionId?: string): Promise<ITeam[]> {
    const params = sessionId ? { session: sessionId } : {};
    return api.get<ITeam[]>(`${BASE_URL}/teams/`, { params });
  },
};
