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
import type { LinearProjectIssues } from "@/lib/linear"
import { SmileIcon } from "lucide-react"

export function ProjectDashboard({
  projectData,
  stateMessage,
}: {
  projectData: LinearProjectIssues | null
  stateMessage: string
}) {
  const activeIssues = projectData?.issues ?? []
  const completedIssues = projectData?.completedIssues ?? []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Tabs defaultValue="active" className="w-full">
        <div className="sticky inset-x-0 top-0 z-10 border-b border-border/60 bg-background/70 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            <div className="flex flex-col">
              <strong className="text-lg font-semibold">
                {projectData?.projectName ?? "Linear project"}
              </strong>
            </div>
            <div className="flex items-center gap-3">
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Completed</TabsTrigger>
              </TabsList>
              <ThemeToggle />
            </div>
          </div>
        </div>
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-10 pt-6">
          {projectData ? (
            <section className="space-y-6">
              <TabsContent value="active">
                {activeIssues.length ? (
                  <ProjectIssues issues={activeIssues} />
                ) : (
                  <Empty className="border border-dashed border-muted-foreground/40 bg-muted/30">
                    <EmptyHeader>
                      <EmptyTitle>No active tasks</EmptyTitle>
                      <EmptyDescription>
                        This project does not have any open issues right now.
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
            </section>
          ) : (
            <Empty className="border border-dashed border-muted-foreground/40 bg-muted/30">
              <EmptyHeader>
                <SmileIcon className="mb-2 size-10 text-muted-foreground" aria-hidden="true" />
                <EmptyTitle>Nothing to show yet</EmptyTitle>
                <EmptyDescription>
                  {stateMessage || "We’ll share updates here as soon as there’s something new."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </main>
      </Tabs>
    </div>
  )
}
