import ProjectView from "@/module/project/components/project-view";

export default async function Project({params}) {
    const {projectId} = await params;

    return (
       <ProjectView projectId={projectId} />
    )
}