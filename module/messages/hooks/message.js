"use client"

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query"

import { createMessages, getMessages } from "../actions"

/* -------------------------------------------------
   SERVER / SHARED UTILITY
-------------------------------------------------- */

export async function prefetchMessages({ queryClient, projectId }) {
  await queryClient.prefetchQuery({
    queryKey: ["messages", projectId],
    queryFn: () => getMessages(projectId),
    staleTime: 10000,
  })
}

/* -------------------------------------------------
   CLIENT HOOKS (NOT ASYNC)
-------------------------------------------------- */

export function useGetMessages(projectId) {
  return useQuery({
    queryKey: ["messages", projectId],
    queryFn: () => getMessages(projectId),
    enabled: Boolean(projectId),
    staleTime: 10000,
    refetchInterval: (data) => (data?.length ? 5000 : false),
  });
}


export function useCreateMessages(projectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value) => {
      const result = await createMessages({ value, projectId });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", projectId],
      });
    },
  });
}