"use client"

import { useMemo, useState } from "react"

import { IssueTitle } from "@/components/project-issues"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { LinearIssue } from "@/lib/linear"
import { ChevronDownIcon, FilterIcon } from "lucide-react"

const RANGE_OPTIONS = [
  { label: "Last 7 days", value: "week", days: 7 },
  { label: "Last 30 days", value: "month", days: 30 },
] as const

type RangeValue = (typeof RANGE_OPTIONS)[number]["value"]
const DEFAULT_RANGE: RangeValue = "week"

export function CompletedIssues({ issues }: { issues: LinearIssue[] }) {
  const [range, setRange] = useState<RangeValue>(DEFAULT_RANGE)

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
      <div className="flex flex-wrap gap-3">
        <CompletedFilter range={range} onRangeChange={setRange} />
      </div>

      <ScrollArea className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIssues.length ? (
              filteredIssues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="max-w-[280px] whitespace-normal break-words">
                    <div className="flex flex-col gap-1">
                      <IssueTitle title={issue.title} description={issue.description} />
                      {issue.labels.length ? (
                        <div className="flex flex-wrap gap-1">
                          {issue.labels.map((label) => (
                            <Badge
                              key={label.id}
                              variant="outline"
                              className="rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide"
                            >
                              {label.color ? (
                                <>
                                  <span
                                    aria-hidden="true"
                                    className="h-[6px] w-[6px] rounded-full"
                                    style={{ backgroundColor: label.color }}
                                  />
                                  <span>{label.name}</span>
                                </>
                              ) : (
                                label.name
                              )}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{issue.assignee?.name ?? "Unassigned"}</TableCell>
                  <TableCell>{formatCompletedDate(issue.completedAt)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
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

function CompletedFilter({
  range,
  onRangeChange,
}: {
  range: RangeValue
  onRangeChange: (value: RangeValue) => void
}) {
  const isActive = range !== DEFAULT_RANGE
  const triggerClass = cn(
    "min-w-[220px] justify-between",
    isActive ? "border-primary bg-primary/5 text-primary shadow-sm" : undefined
  )

  const handleReset = () => onRangeChange(DEFAULT_RANGE)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={triggerClass}>
          <span className="flex items-center gap-2 font-semibold">
            <FilterIcon className="size-4" aria-hidden="true" />
            Completed within
          </span>
          <ChevronDownIcon className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Completed within</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={range}
          onValueChange={(value) => onRangeChange(value as RangeValue)}
        >
          {RANGE_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!isActive}
          onSelect={(event) => {
            event.preventDefault()
            if (!isActive) return
            handleReset()
          }}
        >
          Reset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
