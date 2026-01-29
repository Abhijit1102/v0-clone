import {useQuery, useMutation, useQueryClient, QueryClient} from "@tanstack/react-query";
import { createProject, getProjectById, getProjects} from "../actions";

export function useGetProjects() {
    return useQuery({
        queryKey: ["projects"],
        queryFn:() => getProjects()
    })
};

export function useCreateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:(value) => createProject(value),
        onSuccess:() => QueryClient.invalidateQueries(["projects"])
    })
};

export function useGetProjectById(projectId){
    return useQuery({
        queryKey:["project", "projectId"],
        queryFn:() => getProjectById(projectId)
    })
};