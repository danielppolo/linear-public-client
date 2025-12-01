import { ProjectConfig } from "@/lib/config"

type LinearIssueState = {
  id: string
  name: string
  color?: string | null
}

export type LinearIssueLabel = {
  id: string
  name: string
  color?: string | null
}

export type LinearIssue = {
  id: string
  identifier: string
  title: string
  url: string
  dueDate?: string | null
  priority?: number | null
  priorityLabel?: string | null
  completedAt?: string | null
  assignee?: {
    id: string
    name: string
  } | null
  state: LinearIssueState
  labels: LinearIssueLabel[]
}

export type LinearProjectIssues = {
  projectId: string
  projectName: string
  projectUrl?: string | null
  issues: LinearIssue[]
  completedIssues: LinearIssue[]
}

export type LinearProjectSummary = {
  id: string
  name: string
  slug?: string | null
  state?: string | null
  targetDate?: string | null
  url?: string | null
  color?: string | null
}

const LINEAR_GRAPHQL_ENDPOINT = "https://api.linear.app/graphql"
const PAGE_SIZE = 100

function getPageSize(options?: { first?: number }): number {
  return options?.first ?? PAGE_SIZE
}

export function getLinearApiKey(config?: ProjectConfig): string | undefined {
  const raw = config?.apiKey?.trim() ?? process.env.LINEAR_API_KEY?.trim()
  if (!raw) return undefined
  const normalized = raw.toLowerCase()
  if (normalized === "undefined" || normalized === "null") {
    return undefined
  }
  return raw
}

function requireLinearApiKey(config?: ProjectConfig) {
  const apiKey = getLinearApiKey(config)
  if (!apiKey) {
    throw new Error("Missing LINEAR_API_KEY. Add it to your environment to query Linear.")
  }
  return apiKey
}

const PROJECT_ISSUES_QUERY = /* GraphQL */ `
  query ProjectIssues($projectId: String!, $first: Int = 25, $completedFirst: Int = 25) {
    project(id: $projectId) {
      id
      name
      url
      issues(
        first: $first
        orderBy: updatedAt
        filter: { completedAt: { null: true }, state: { name: { neq: "Canceled" } } }
      ) {
        nodes {
          id
          identifier
          title
          url
          dueDate
          priority
          priorityLabel
          completedAt
          state {
            id
            name
            color
          }
          assignee {
            id
            name
          }
          labels(first: 5) {
            nodes {
              id
              name
              color
            }
          }
        }
      }
      completedIssues: issues(
        first: $completedFirst
        orderBy: updatedAt
        filter: { completedAt: { null: false }, state: { name: { neq: "Canceled" } } }
      ) {
        nodes {
          id
          identifier
          title
          url
          dueDate
          priority
          priorityLabel
          completedAt
          state {
            id
            name
            color
          }
          assignee {
            id
            name
          }
          labels(first: 5) {
            nodes {
              id
              name
              color
            }
          }
        }
      }
    }
  }
`

const TEAM_ISSUES_QUERY = /* GraphQL */ `
  query TeamIssues($teamId: String!, $first: Int = 25, $completedFirst: Int = 25) {
    team(id: $teamId) {
      id
      name
      issues(
        first: $first
        orderBy: updatedAt
        filter: { completedAt: { null: true }, state: { name: { neq: "Canceled" } } }
      ) {
        nodes {
          id
          identifier
          title
          url
          dueDate
          priority
          priorityLabel
          completedAt
          state {
            id
            name
            color
          }
          assignee {
            id
            name
          }
          labels(first: 5) {
            nodes {
              id
              name
              color
            }
          }
        }
      }
      completedIssues: issues(
        first: $completedFirst
        orderBy: updatedAt
        filter: { completedAt: { null: false }, state: { name: { neq: "Canceled" } } }
      ) {
        nodes {
          id
          identifier
          title
          url
          dueDate
          priority
          priorityLabel
          completedAt
          state {
            id
            name
            color
          }
          assignee {
            id
            name
          }
          labels(first: 5) {
            nodes {
              id
              name
              color
            }
          }
        }
      }
    }
  }
`

const LIST_PROJECTS_QUERY = /* GraphQL */ `
  query Projects($first: Int = 25) {
    projects(first: $first, orderBy: updatedAt) {
      nodes {
        id
        name
        slug
        state
        targetDate
        url
        color
      }
    }
  }
`

type LinearIssueNode = Omit<LinearIssue, "labels"> & {
  labels?: {
    nodes?: Array<LinearIssueLabel | null> | null
  } | null
}

 type ProjectIssuesResponse = {
  data?: {
    project?: {
      id: string
      name: string
      url?: string | null
      issues: {
        nodes: LinearIssueNode[]
      }
      completedIssues: {
        nodes: LinearIssueNode[]
      }
    } | null
  }
  errors?: Array<{ message: string }>
}

type ProjectsResponse = {
  data?: {
    projects?: {
      nodes: LinearProjectSummary[]
    } | null
  }
  errors?: Array<{ message: string }>
}

type TeamIssuesResponse = {
  data?: {
    team?: {
      id: string
      name: string
      issues: { nodes: LinearIssueNode[] }
      completedIssues: { nodes: LinearIssueNode[] }
    } | null
  }
  errors?: Array<{ message: string }>
}

export async function fetchLinearProjectIssues(
  projectId: string,
  options?: { first?: number; config?: ProjectConfig }
): Promise<LinearProjectIssues> {
  const { config, ...rest } = options ?? {}
  const apiKey = requireLinearApiKey(config)

  const response = await fetch(LINEAR_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: PROJECT_ISSUES_QUERY,
      variables: {
        projectId,
        first: getPageSize(rest),
        completedFirst: getPageSize(rest),
      },
    }),
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    throw new Error(`Linear request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as ProjectIssuesResponse

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "))
  }

  const project = payload.data?.project

  if (!project) {
    throw new Error(`Linear project ${projectId} not found`)
  }

  const mapIssueNodes = (nodes?: LinearIssueNode[]): LinearIssue[] =>
    nodes?.map(({ labels, ...issue }) => ({
      ...issue,
      labels:
        labels?.nodes?.filter((label): label is LinearIssueLabel => Boolean(label)) ?? [],
    })) ?? []

  const activeIssues = mapIssueNodes(project.issues.nodes)
  const completedIssues = mapIssueNodes(project.completedIssues?.nodes)

  return {
    projectId: project.id,
    projectName: project.name,
    projectUrl: project.url,
    issues: activeIssues,
    completedIssues,
  }
}

export async function fetchLinearTeamIssues(
  teamId: string,
  options?: { first?: number; config?: ProjectConfig }
): Promise<LinearProjectIssues> {
  const { config, ...rest } = options ?? {}
  const apiKey = requireLinearApiKey(config)

  const response = await fetch(LINEAR_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: TEAM_ISSUES_QUERY,
      variables: {
        teamId,
        first: getPageSize(rest),
        completedFirst: getPageSize(rest),
      },
    }),
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    throw new Error(`Linear request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as TeamIssuesResponse

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "))
  }

  const team = payload.data?.team

  if (!team) {
    throw new Error(`Linear team ${teamId} not found`)
  }

  const mapIssueNodes = (nodes?: LinearIssueNode[]): LinearIssue[] =>
    nodes?.map(({ labels, ...issue }) => ({
      ...issue,
      labels:
        labels?.nodes?.filter((label): label is LinearIssueLabel => Boolean(label)) ?? [],
    })) ?? []

  return {
    projectId: team.id,
    projectName: team.name,
    issues: mapIssueNodes(team.issues.nodes),
    completedIssues: mapIssueNodes(team.completedIssues?.nodes),
  }
}

export async function fetchLinearProjects(options?: {
  first?: number
  config?: ProjectConfig
}): Promise<LinearProjectSummary[]> {
  const apiKey = requireLinearApiKey(options?.config)

  const response = await fetch(LINEAR_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: LIST_PROJECTS_QUERY,
      variables: { first: getPageSize(options) },
    }),
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    throw new Error(`Linear request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as ProjectsResponse

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "))
  }

  return payload.data?.projects?.nodes ?? []
}
