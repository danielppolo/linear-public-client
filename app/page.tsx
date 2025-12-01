import { CompletedIssues } from "@/components/completed-issues"
import { ProjectIssues } from "@/components/project-issues"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  const activeIssues = projectData?.issues ?? []
  const completedIssues = projectData?.completedIssues ?? []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        {projectData ? (
          <section className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Project issues</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold">{projectData.projectName}</h1>
                  {projectData.projectUrl ? (
                    <a
                      href={projectData.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary underline-offset-4 hover:underline"
                    >
                      View in Linear
                    </a>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  Active: {activeIssues.length} · Completed: {completedIssues.length}
                </p>
              </div>
            </div>

            <Tabs defaultValue="active" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Development</TabsTrigger>
                <TabsTrigger value="inactive">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                {activeIssues.length ? (
                  <ProjectIssues issues={activeIssues} />
                ) : (
                  <Empty className="border border-dashed border-muted-foreground/40 bg-muted/30">
                    <EmptyHeader>
                      <EmptyTitle>No active tasks</EmptyTitle>
                      <EmptyDescription>
                        This project does not have any open issues right now. Try updating the filters in Linear.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </TabsContent>
              <TabsContent value="inactive">
                {completedIssues.length ? (
                  <CompletedIssues issues={completedIssues} />
                ) : (
                  <Empty className="border border-dashed border-muted-foreground/40 bg-muted/30">
                    <EmptyHeader>
                      <EmptyTitle>No recently completed work</EmptyTitle>
                      <EmptyDescription>
                        Completed issues will appear here once tasks have been closed in the selected timeframe.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </TabsContent>
            </Tabs>
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
