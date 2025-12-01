"use client"

import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { LinearIssue } from "@/lib/linear"

function formatDueDate(date?: string | null) {
  if (!date) return "No due date"
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  } catch {
    return date
  }
}

function formatPriority(priorityLabel?: string | null, priority?: number | null) {
  if (priorityLabel) return priorityLabel
  if (typeof priority === "number") return `P${priority}`
  return "No priority"
}

type PrioritySort = "default" | "high-low" | "low-high"
type StatusSort = "default" | "az" | "za"

export function ProjectIssues({ issues }: { issues: LinearIssue[] }) {
  const [prioritySort, setPrioritySort] = useState<PrioritySort>("default")
  const [statusSort, setStatusSort] = useState<StatusSort>("default")

  const sortedIssues = useMemo(() => {
    const comparator = (a: LinearIssue, b: LinearIssue) => {
      const priorityComparator = getPriorityComparator(prioritySort)
      const statusComparator = getStatusComparator(statusSort)

      if (priorityComparator) {
        const result = priorityComparator(a, b)
        if (result !== 0) return result
      }

      if (statusComparator) {
        const result = statusComparator(a, b)
        if (result !== 0) return result
      }

      return a.identifier.localeCompare(b.identifier)
    }

    return [...issues].sort(comparator)
  }, [issues, prioritySort, statusSort])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 rounded-lg border bg-card/50 p-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Priority sort
          </Label>
          <Select value={prioritySort} onValueChange={(value) => setPrioritySort(value as PrioritySort)}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default order</SelectItem>
              <SelectItem value="high-low">Highest priority first</SelectItem>
              <SelectItem value="low-high">Lowest priority first</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status sort
          </Label>
          <Select value={statusSort} onValueChange={(value) => setStatusSort(value as StatusSort)}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default order</SelectItem>
              <SelectItem value="az">Status A → Z</SelectItem>
              <SelectItem value="za">Status Z → A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedIssues.map((issue) => (
          <Card key={issue.id} className="transition-colors hover:border-primary/40">
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {issue.identifier}
                </p>
                <CardTitle className="text-xl leading-tight">
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {issue.title}
                  </a>
                </CardTitle>
              </div>
              <Badge
                className="uppercase tracking-wide"
                style={
                  issue.state.color
                    ? {
                        backgroundColor: issue.state.color,
                        borderColor: issue.state.color,
                        color: "#0a0a0a",
                      }
                    : undefined
                }
              >
                {issue.state.name}
              </Badge>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <dt className="text-[11px] uppercase tracking-wide">Assignee</dt>
                  <dd className="text-base text-foreground">{issue.assignee?.name ?? "Unassigned"}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[11px] uppercase tracking-wide">Priority</dt>
                  <dd className="text-base text-foreground">
                    {formatPriority(issue.priorityLabel, issue.priority)}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[11px] uppercase tracking-wide">Due</dt>
                  <dd className="text-base text-foreground">{formatDueDate(issue.dueDate)}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-[11px] uppercase tracking-wide">Link</dt>
                  <dd>
                    <Button variant="link" asChild className="px-0 text-base">
                      <a href={issue.url} target="_blank" rel="noreferrer">
                        Open issue
                      </a>
                    </Button>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function getPriorityComparator(sort: PrioritySort) {
  if (sort === "default") return undefined
  return (a: LinearIssue, b: LinearIssue) => {
    const priorityA = typeof a.priority === "number" ? a.priority : Number.POSITIVE_INFINITY
    const priorityB = typeof b.priority === "number" ? b.priority : Number.POSITIVE_INFINITY

    if (sort === "high-low") {
      return priorityA - priorityB
    }

    if (sort === "low-high") {
      return priorityB - priorityA
    }

    return 0
  }
}

function getStatusComparator(sort: StatusSort) {
  if (sort === "default") return undefined
  return (a: LinearIssue, b: LinearIssue) => {
    const nameA = a.state.name ?? ""
    const nameB = b.state.name ?? ""

    if (sort === "az") {
      return nameA.localeCompare(nameB)
    }

    if (sort === "za") {
      return nameB.localeCompare(nameA)
    }

    return 0
  }
}
