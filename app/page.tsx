import { ProjectDashboard } from "@/components/project-dashboard"
import { resolveProjectConfig } from "@/lib/config"
import { fetchLinearProjectIssues } from "@/lib/linear"
import type { Metadata } from "next"

export const revalidate = 0

export const metadata: Metadata = {
  title: "Home",
}

async function loadProject(envPrefix?: string) {
  const config = resolveProjectConfig(envPrefix ?? "LINEAR")
  let stateMessage = ""
  let projectData = null

  if (!config.projectId) {
    stateMessage = "Set the project ID in your environment to load project issues."
    return { projectData, stateMessage }
  }

  try {
    projectData = await fetchLinearProjectIssues(config.projectId, { config })
  } catch (error) {
    stateMessage = error instanceof Error ? error.message : "Unable to load Linear issues."
  }

  return { projectData, stateMessage }
}

export default async function Home() {
  const { projectData, stateMessage } = await loadProject()
  return <ProjectDashboard projectData={projectData} stateMessage={stateMessage} />
}
