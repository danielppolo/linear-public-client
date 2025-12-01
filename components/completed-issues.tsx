"use client"

import { useMemo, useState } from "react"

import { StatusBadge } from "@/components/project-issues"
import { Badge } from "@/components/ui/badge"
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

const RANGE_OPTIONS = [
  { label: "Last 7 days", value: "week", days: 7 },
  { label: "Last 30 days", value: "month", days: 30 },
] as const

type RangeValue = (typeof RANGE_OPTIONS)[number]["value"]

export function CompletedIssues({ issues }: { issues: LinearIssue[] }) {
  const [range, setRange] = useState<RangeValue>("week")

  const filteredIssues = useMemo(() => {
    const option = RANGE_OPTIONS.find((item) => item.value === range) ?? RANGE_OPTIONS[0]
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - option.days)

    return issues.filter((issue) => {
      if (!issue.completedAt) return false
      const completedDate = new Date(issue.completedAt)
      return completedDate >= threshold
    })
  }, [issues, range])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Completed issues
          </p>
          <p className="text-base text-muted-foreground">
            Showing {filteredIssues.length} of {issues.length} completed tasks
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Completed within
          </Label>
          <Select value={range} onValueChange={(value) => setRange(value as RangeValue)}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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
              <TableHead>Completed</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIssues.length ? (
              filteredIssues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="max-w-[280px] whitespace-normal break-words">
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
                      {issue.labels.length ? (
                        <div className="flex flex-wrap gap-1">
                          {issue.labels.map((label) => (
                            <Badge
                              key={label.id}
                              variant="outline"
                              className="rounded-full border-dashed px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
                              style={
                                label.color
                                  ? {
                                      borderColor: label.color,
                                      color: label.color,
                                    }
                                  : undefined
                              }
                            >
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{issue.assignee?.name ?? "Unassigned"}</TableCell>
                  <TableCell>{formatCompletedDate(issue.completedAt)}</TableCell>
                  <TableCell>
                    <StatusBadge name={issue.state.name} color={issue.state.color} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  No completed issues in this timeframe
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}

function formatCompletedDate(date?: string | null) {
  if (!date) return "Unknown"
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  } catch {
    return date
  }
}
