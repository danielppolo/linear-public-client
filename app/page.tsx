import { ThemeToggle } from "@/components/theme-toggle"
import { ProjectIssues } from "@/components/project-issues"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { fetchLinearProjectIssues } from "@/lib/linear"

export const revalidate = 0

export default async function Home() {
  const projectId = process.env.LINEAR_PROJECT_ID
  let stateMessage = ""

  if (!projectId) {
    stateMessage = "Set LINEAR_PROJECT_ID in your environment to load project issues."
  }

  let projectData = null

  if (projectId) {
    try {
      projectData = await fetchLinearProjectIssues(projectId)
    } catch (error) {
      stateMessage = error instanceof Error ? error.message : "Unable to load Linear issues."
    }
  }

  const issues = projectData?.issues ?? []
  console.log(issues)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        {projectData ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Active issues</p>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold">{projectData.projectName}</h1>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Showing {issues.length} open task{issues.length === 1 ? "" : "s"}
              </p>
            </div>

            {issues.length ? (
              <ProjectIssues issues={issues} />
            ) : (
              <Empty className="border border-dashed border-muted-foreground/40 bg-muted/30">
                <EmptyHeader>
                  <EmptyTitle>No open tasks</EmptyTitle>
                  <EmptyDescription>
                    This project does not have any open issues right now. Try updating the filters in Linear.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </section>
        ) : (
          <Empty className="border border-dashed border-muted-foreground/40 bg-muted/30">
            <EmptyHeader>
              <EmptyTitle>{stateMessage}</EmptyTitle>
              <EmptyDescription>
                Generate a personal API key in Linear (Settings → API) and add the variables to <code>.env.local</code>,
                then restart <code>npm run dev</code>.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>
    </div>
  )
}
