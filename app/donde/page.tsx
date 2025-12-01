import { ProjectDashboard } from "@/components/project-dashboard"
import { resolveProjectConfig } from "@/lib/config"
import { fetchLinearProjectIssues } from "@/lib/linear"
import type { Metadata } from "next"

export const revalidate = 0

export const metadata: Metadata = {
  title: "Donde",
}

async function loadProject() {
  const config = resolveProjectConfig("DONDE")
  let stateMessage = ""
  let projectData = null

  if (!config.projectId) {
    stateMessage = "Set DONDE_PROJECT_ID in your environment to load project issues."
    return { projectData, stateMessage }
  }

  try {
    projectData = await fetchLinearProjectIssues(config.projectId, { config })
  } catch (error) {
    stateMessage = error instanceof Error ? error.message : "Unable to load Linear issues."
  }

  return { projectData, stateMessage }
}

export default async function DondePage() {
  const { projectData, stateMessage } = await loadProject()
  return <ProjectDashboard projectData={projectData} stateMessage={stateMessage} />
}
