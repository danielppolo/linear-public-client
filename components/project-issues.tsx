"use client"

import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const statusOptions = useMemo(() => {
    const labels = new Set<string>()
    issues.forEach((issue) => {
      if (issue.state?.name) {
        labels.add(issue.state.name)
      }
    })
    return Array.from(labels).sort((a, b) => a.localeCompare(b))
  }, [issues])

  const filteredIssues = useMemo(() => {
    if (statusFilter === "all") return issues
    return issues.filter((issue) => issue.state?.name === statusFilter)
  }, [issues, statusFilter])

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

    return [...filteredIssues].sort(comparator)
  }, [filteredIssues, prioritySort, statusSort])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 rounded-lg border bg-card/40 p-4">
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
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status filter
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIssues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="max-w-[280px]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {issue.identifier}
                    </span>
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {issue.title}
                    </a>
                  </div>
                </TableCell>
                <TableCell>{issue.assignee?.name ?? "Unassigned"}</TableCell>
                <TableCell>{formatPriority(issue.priorityLabel, issue.priority)}</TableCell>
                <TableCell>{formatDueDate(issue.dueDate)}</TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
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
