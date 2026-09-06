// FILE: frontend/modules/konsultations/hooks/useSuggestions.ts
﻿// modules/konsultations/hooks/useSuggestions.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import apiRequest from '@/services/_request';

/**
 * Raw Ethikos argument shape as returned by /api/ethikos/arguments/.
 * Parent fields are optional and may or may not be present depending
 * on how the serializer is configured.
 */
interface EthikosArgumentApi {
  id: number;
  topic: number;
  user: string;
  content: string;
  created_at: string;
  parent?: number | null;
  parent_id?: number | null;
}

/**
 * Normalized suggestion used by the Konsultations UI.
 */
export interface Suggestion {
  id: string;
  consultationId: string;
  author: string;
  body: string;
  createdAt: string;
  parentId: string | null;
}

/**
 * Payload for creating a new suggestion.
 * `parentId` can be used for threaded replies.
 */
export interface CreateSuggestionInput {
  body: string;
  parentId?: string | number | null;
}

export interface UseSuggestionsResult {
  suggestions: Suggestion[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  /**
   * Refetch the suggestion list from the backend.
   * Returns the freshly loaded items (or undefined on error).
   */
  refetch: () => Promise<Suggestion[] | undefined>;
  /**
   * Create a new suggestion for the current consultation.
   */
  submit: (input: CreateSuggestionInput) => Promise<void>;
  isSubmitting: boolean;
}

const QUERY_KEY = 'konsultations-suggestions';

async function fetchSuggestionsForConsultation(
  topicId: number,
): Promise<Suggestion[]> {
  const rows = await apiRequest.get<EthikosArgumentApi[]>(
    'ethikos/arguments/',
    { params: { topic: topicId } },
  );

  return rows.map((arg) => {
    const parentRaw =
      arg.parent != null
        ? arg.parent
        : arg.parent_id != null
        ? arg.parent_id
        : null;

    return {
      id: String(arg.id),
      consultationId: String(arg.topic),
      author: arg.user,
      body: arg.content,
      createdAt: arg.created_at,
      parentId: parentRaw == null ? null : String(parentRaw),
    };
  });
}

async function createSuggestionForConsultation(
  topicId: number,
  input: CreateSuggestionInput,
): Promise<void> {
  const payload: {
    topic: number;
    content: string;
    parent?: number;
  } = {
    topic: topicId,
    content: input.body,
  };

  if (input.parentId != null) {
    const parentNumeric = Number(input.parentId);
    if (Number.isFinite(parentNumeric)) {
      payload.parent = parentNumeric;
    }
  }

  await apiRequest.post('ethikos/arguments/', payload);
}

/**
 * Konsultations suggestions hook.
 *
 * - Reads suggestions from the Ethikos arguments endpoint for a given topic id.
 * - Exposes a mutation to submit new suggestions (and optional replies).
 */
export default function useSuggestions(
  consultationId: string | number | null | undefined,
): UseSuggestionsResult {
  const queryClient = useQueryClient();

  const topicId = (() => {
    if (consultationId == null) return NaN;
    const n = Number(consultationId);
    return Number.isFinite(n) ? n : NaN;
  })();

  const canUseTopic = Number.isFinite(topicId);

  const query = useQuery<Suggestion[], Error>({
    queryKey: [QUERY_KEY, topicId],
    enabled: canUseTopic,
    staleTime: 30_000,
    retry: 1,
    queryFn: () => {
      if (!canUseTopic) {
        return Promise.resolve<Suggestion[]>([]);
      }
      return fetchSuggestionsForConsultation(topicId as number);
    },
  });

  const mutation = useMutation<void, Error, CreateSuggestionInput>({
    mutationFn: (input) => {
      if (!canUseTopic) {
        return Promise.reject(
          new Error('Cannot submit suggestion without a consultation id.'),
        );
      }
      return createSuggestionForConsultation(topicId as number, input);
    },
    onSuccess: async () => {
      if (!canUseTopic) return;
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, topicId],
      });
    },
  });

  return {
    suggestions: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: (query.error as Error) ?? null,
    refetch: async () => {
      const res = await query.refetch();
      return res.data;
    },
    submit: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
  };
}
