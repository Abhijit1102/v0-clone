"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, getProjectById, getProjects } from "../actions";

/* =========================
   GET ALL PROJECTS
========================= */
export function useGetProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  });
}

/* =========================
   CREATE PROJECT
========================= */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value) => createProject(value),

    onSuccess: () => {
      // ✅ React Query v5 correct syntax
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });
}

/* =========================
   GET PROJECT BY ID
========================= */
export function useGetProjectById(projectId) {
  return useQuery({
    queryKey: ["project", projectId], // ✅ FIXED
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId, // ✅ prevents unnecessary fetch
  });
}
