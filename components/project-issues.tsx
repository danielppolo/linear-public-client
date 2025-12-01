"use client"

import { useMemo, useState } from "react"

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
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CircleDashedIcon,
  CircleDotDashedIcon,
  CircleDotIcon,
  CircleIcon,
  CircleMinusIcon,
  CircleOffIcon,
  CircleSlashIcon,
  FlameIcon,
  MinusIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function formatPriority(priorityLabel?: string | null, priority?: number | null) {
  if (priorityLabel) return priorityLabel
  if (typeof priority === "number") return `P${priority}`
  return "No priority"
}

type PriorityTier = "urgent" | "high" | "medium" | "low" | "none"

type PrioritySort = "default" | "high-low" | "low-high"
type StatusSort = "default" | "az" | "za"

export function ProjectIssues({ issues }: { issues: LinearIssue[] }) {
  const [prioritySort, setPrioritySort] = useState<PrioritySort>("default")
  const [statusSort, setStatusSort] = useState<StatusSort>("default")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tagFilter, setTagFilter] = useState<string>("all")

  const statusOptions = useMemo(() => {
    const labels = new Set<string>()
    issues.forEach((issue) => {
      if (issue.state?.name) {
        labels.add(issue.state.name)
      }
    })
    return Array.from(labels).sort((a, b) => a.localeCompare(b))
  }, [issues])

  const tagOptions = useMemo(() => {
    const tags = new Set<string>()
    issues.forEach((issue) => {
      issue.labels.forEach((label) => {
        if (label.name) {
          tags.add(label.name)
        }
      })
    })
    return Array.from(tags).sort((a, b) => a.localeCompare(b))
  }, [issues])

  const filteredIssues = useMemo(() => {
    if (statusFilter === "all" && tagFilter === "all") return issues
    return issues.filter((issue) => {
      const matchesStatus = statusFilter === "all" || issue.state?.name === statusFilter
      const matchesTag =
        tagFilter === "all" || issue.labels.some((label) => label.name === tagFilter)
      return matchesStatus && matchesTag
    })
  }, [issues, statusFilter, tagFilter])

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

      if (statusSort === "default") {
        const result = compareStatusByDefaultOrder(a, b)
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
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tag filter
          </Label>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tagOptions.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
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
              <TableHead className="w-16 text-center">Status</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead className="w-24 text-center">Priority</TableHead>
              <TableHead className="w-28 text-center">Assignee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIssues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="text-center">
                  <StatusBadge name={issue.state.name} color={issue.state.color} />
                </TableCell>
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
                            className="rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
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
                <TableCell className="text-center">
                  <PriorityBadge
                    label={formatPriority(issue.priorityLabel, issue.priority)}
                    priorityValue={issue.priority}
                  />
                </TableCell>
                <TableCell className="text-center">
                  {issue.assignee?.name ?? "Unassigned"}
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

const PRIORITY_VISUALS: Record<PriorityTier, { Icon: LucideIcon; className: string }> = {
  urgent: { Icon: FlameIcon, className: "text-destructive" },
  high: { Icon: ArrowUpIcon, className: "text-orange-500" },
  medium: { Icon: MinusIcon, className: "text-yellow-500" },
  low: { Icon: ArrowDownIcon, className: "text-muted-foreground" },
  none: { Icon: CircleIcon, className: "text-muted-foreground" },
}

const STATUS_ORDER = [
  "In Review",
  "In Progress",
  "Todo",
  "Backlog",
  "Done",
  "Cancelled",
]

function compareStatusByDefaultOrder(a: LinearIssue, b: LinearIssue) {
  const rank = (state?: string | null) => {
    if (!state) return STATUS_ORDER.length
    const index = STATUS_ORDER.indexOf(state)
    return index === -1 ? STATUS_ORDER.length : index
  }

  return rank(a.state?.name) - rank(b.state?.name)
}

function PriorityBadge({
  label,
  priorityValue,
}: {
  label: string
  priorityValue?: number | null
}) {
  const tier = getPriorityTier(label, priorityValue)
  const visual = PRIORITY_VISUALS[tier]
  const Icon = visual.Icon

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center">
            <Icon className={`size-4 ${visual.className}`} aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function getPriorityTier(label: string, priorityValue?: number | null): PriorityTier {
  const normalized = label.toLowerCase()
  if (normalized.includes("urgent")) return "urgent"
  if (normalized.includes("high")) return "high"
  if (normalized.includes("medium")) return "medium"
  if (normalized.includes("low")) return "low"
  if (normalized.includes("no priority")) return "none"

  if (typeof priorityValue === "number") {
    if (priorityValue <= 1) return "urgent"
    if (priorityValue === 2) return "high"
    if (priorityValue === 3) return "medium"
    return "low"
  }

  return "none"
}

const STATUS_ICONS: Record<string, LucideIcon> = {
  Backlog: CircleDashedIcon,
  Todo: CircleDotDashedIcon,
  "In Progress": CircleDotIcon,
  "In Review": CircleSlashIcon,
  Done: CircleIcon,
  Cancelled: CircleMinusIcon,
}

function StatusBadge({ name, color }: { name?: string | null; color?: string | null }) {
  if (!name) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <CircleOffIcon className="size-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>Unknown</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const Icon = STATUS_ICONS[name] ?? CircleIcon

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center">
            <Icon
              className="size-4"
              aria-hidden="true"
              style={color ? { color } : undefined}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { StatusBadge }
