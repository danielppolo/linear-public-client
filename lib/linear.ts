type LinearIssueState = {
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
  assignee?: {
    id: string
    name: string
  } | null
  state: LinearIssueState
}

export type LinearProjectIssues = {
  projectId: string
  projectName: string
  projectUrl?: string | null
  issues: LinearIssue[]
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

export function getLinearApiKey(): string | undefined {
  const raw = process.env.LINEAR_API_KEY?.trim()
  if (!raw) return undefined
  const normalized = raw.toLowerCase()
  if (normalized === "undefined" || normalized === "null") {
    return undefined
  }
  return raw
}

function requireLinearApiKey() {
  const apiKey = getLinearApiKey()
  if (!apiKey) {
    throw new Error("Missing LINEAR_API_KEY. Add it to your environment to query Linear.")
  }
  return apiKey
}

const PROJECT_ISSUES_QUERY = /* GraphQL */ `
  query ProjectIssues($projectId: String!, $first: Int = 25) {
    project(id: $projectId) {
      id
      name
      url
      issues(first: $first, orderBy: updatedAt, filter: { completedAt: { null: true } }) {
        nodes {
          id
          identifier
          title
          url
          dueDate
          priority
          priorityLabel
          state {
            id
            name
            color
          }
          assignee {
            id
            name
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

type ProjectIssuesResponse = {
  data?: {
    project?: {
      id: string
      name: string
      url?: string | null
      issues: {
        nodes: LinearIssue[]
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

export async function fetchLinearProjectIssues(
  projectId: string,
  options?: { first?: number }
): Promise<LinearProjectIssues> {
  const apiKey = requireLinearApiKey()

  const response = await fetch(LINEAR_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: PROJECT_ISSUES_QUERY,
      variables: { projectId, first: getPageSize(options) },
    }),
    // Never cache project data; reflect latest task state
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

  return {
    projectId: project.id,
    projectName: project.name,
    projectUrl: project.url,
    issues: project.issues.nodes ?? [],
  }
}

export async function fetchLinearProjects(options?: {
  first?: number
}): Promise<LinearProjectSummary[]> {
  const apiKey = requireLinearApiKey()

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

  console.log(response)
  if (!response.ok) {
    throw new Error(`Linear request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as ProjectsResponse

  console.log(payload)

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "))
  }

  return payload.data?.projects?.nodes ?? []
}
