import { ProjectDashboard } from "@/components/project-dashboard"
import { resolveProjectConfig } from "@/lib/config"
import { fetchLinearTeamIssues } from "@/lib/linear"

export const revalidate = 0

async function loadProject() {
  const config = resolveProjectConfig("ONDAMX")
  let stateMessage = ""
  let projectData = null

  if (!config.teamId) {
    stateMessage = "Set ONDAMX_TEAM_ID in your environment to load team issues."
    return { projectData, stateMessage }
  }

  try {
    projectData = await fetchLinearTeamIssues(config.teamId, { config })
  } catch (error) {
    stateMessage = error instanceof Error ? error.message : "Unable to load Linear issues."
  }

  return { projectData, stateMessage }
}

export default async function OndamxPage() {
  const { projectData, stateMessage } = await loadProject()
  return <ProjectDashboard projectData={projectData} stateMessage={stateMessage} />
}
