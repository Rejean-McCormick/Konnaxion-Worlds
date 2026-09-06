// FILE: frontend/modules/konsultations/hooks/useConsultationVote.ts
﻿// modules/konsultations/hooks/useConsultationVote.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { submitPublicVote } from "@/services/decide";

export interface ConsultationVotePayload {
  id: string;
  option: string;
}

export interface UseConsultationVoteOptions {
  onSuccess?: (
    data: { ok: true },
    variables: ConsultationVotePayload,
  ) => void | Promise<void>;
  onError?: (
    error: Error,
    variables: ConsultationVotePayload,
  ) => void | Promise<void>;
}

/**
 * Hook to submit a vote on a public consultation (Ethikos topic).
 *
 * Wraps services/decide.submitPublicVote() and exposes a mutation API.
 */
export default function useConsultationVote(opts?: UseConsultationVoteOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation<{ ok: true }, Error, ConsultationVotePayload>({
    mutationKey: ["consultation-vote"],
    mutationFn: async ({ id, option }) => submitPublicVote(id, option),
    onSuccess: async (data, variables) => {
      // Keep related views in sync
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      queryClient.invalidateQueries({
        queryKey: ["consultation", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["consultation-results", variables.id],
      });

      if (opts?.onSuccess) {
        await opts.onSuccess(data, variables);
      }
    },
    onError: async (error, variables) => {
      if (opts?.onError) {
        await opts.onError(error, variables);
      }
    },
  });

  return {
    ...mutation,
    /** Fire-and-forget vote submission */
    castVote: mutation.mutate,
    /** Async variant returning the mutation promise */
    castVoteAsync: mutation.mutateAsync,
  };
}
