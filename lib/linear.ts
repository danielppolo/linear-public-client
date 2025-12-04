import { ProjectConfig } from "@/lib/config"
import type { CustomerRequestStatus, CustomerRequestMetadata } from "@/lib/types/customer-request"

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
  description?: string | null
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
          description
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
          description
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
          description
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
          description
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

const CREATE_ISSUE_MUTATION = /* GraphQL */ `
  mutation CreateIssue($teamId: String!, $projectId: String!, $title: String!, $description: String, $priority: Int, $labelIds: [String!]) {
    issueCreate(
      input: {
        teamId: $teamId
        projectId: $projectId
        title: $title
        description: $description
        priority: $priority
        labelIds: $labelIds
      }
    ) {
      success
      issue {
        id
        identifier
        title
        url
      }
    }
  }
`

type CreateIssueResponse = {
  data?: {
    issueCreate?: {
      success: boolean
      issue?: {
        id: string
        identifier: string
        title: string
        url: string
      } | null
    } | null
  }
  errors?: Array<{ message: string }>
}

export type CreateLinearIssueResult = {
  id: string
  identifier: string
  url: string
}

export type StructuredIssueFields = {
  title: string
  description: string
  labels?: string[]
  priority?: number
}

// Default label ID to add to all issues. (#Customer)
const DEFAULT_LABEL_ID = "428763e6-ffb4-4963-90d7-a3f3074537d0"

export async function createLinearIssue(
  projectId: string,
  content: string,
  type: "bug" | "feature",
  options?: {
    reason?: string,
    user_name?: string,
    external_user_id?: string,
  },
  metadata?: CustomerRequestMetadata
): Promise<CreateLinearIssueResult> {
  const apiKey = requireLinearApiKey()
  
  // Get teamId from environment variable (required by Linear API)
  const teamId = process.env.LINEAR_TEAM_ID?.trim()
  if (!teamId) {
    throw new Error("Missing LINEAR_TEAM_ID. Add it to your environment to create Linear issues.")
  }

  // Use content directly as title, no AI conversion
  const title: string = content
  const labelIds: string[] = [DEFAULT_LABEL_ID] // Always include the default label

  // Build description with user information, reason, and metadata
  const descriptionParts: string[] = []

  // Add user information (external_user_id is required, user_name is optional)
  const userInfo: string[] = []
  if (options?.external_user_id) {
    userInfo.push(`**User ID:** ${options.external_user_id}`)
  }
  if (options?.user_name) {
    userInfo.push(`**User Name:** ${options.user_name}`)
  }
  if (userInfo.length > 0) {
    descriptionParts.push(userInfo.join("\n"))
  }

  // Add reason if provided
  if (options?.reason) {
    descriptionParts.push(`**Reason:**\n${options.reason}`)
  }

  // Add metadata if present
  if (metadata && Object.keys(metadata).length > 0) {
    const metadataSection = `**Metadata:**\n\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``
    descriptionParts.push(metadataSection)
  }

  // Join all parts with separators
  const description: string = descriptionParts.join("\n\n---\n\n")

  const variables: {
    teamId: string
    projectId: string
    title: string
    description: string
    labelIds?: string[]
  } = {
    teamId,
    projectId,
    title,
    description,
    labelIds, // Always include the default label
  }

  const response = await fetch(LINEAR_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: CREATE_ISSUE_MUTATION,
      variables,
    }),
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    console.error(await response.json())
    throw new Error(`Linear request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as CreateIssueResponse

  if (payload.errors?.length) {
    console.error(payload.errors)
    throw new Error(payload.errors.map((error) => error.message).join(", "))
  }

  const issueCreate = payload.data?.issueCreate

  if (!issueCreate?.success || !issueCreate.issue) {
    console.error(issueCreate)
    throw new Error("Failed to create Linear issue")
  }
  console.log(issueCreate)

  return {
    id: issueCreate.issue.id,
    identifier: issueCreate.issue.identifier,
    url: issueCreate.issue.url,
  }
}

const UPDATE_ISSUE_LABELS_MUTATION = /* GraphQL */ `
  mutation UpdateIssueLabels($issueId: String!, $labelIds: [String!]!) {
    issueUpdate(
      id: $issueId
      input: {
        labelIds: $labelIds
      }
    ) {
      success
      issue {
        id
        identifier
      }
    }
  }
`

type UpdateIssueLabelsResponse = {
  data?: {
    issueUpdate?: {
      success: boolean
      issue?: {
        id: string
        identifier: string
      } | null
    } | null
  }
  errors?: Array<{ message: string }>
}

export async function addLabelToLinearIssue(
  issueId: string,
  options?: { config?: ProjectConfig }
): Promise<void> {
  const apiKey = requireLinearApiKey(options?.config)

  // First, fetch the issue to get existing labels
  const GET_ISSUE_QUERY = /* GraphQL */ `
    query GetIssue($issueId: String!) {
      issue(id: $issueId) {
        id
        labels {
          nodes {
            id
          }
        }
      }
    }
  `

  const getIssueResponse = await fetch(LINEAR_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: GET_ISSUE_QUERY,
      variables: { issueId },
    }),
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!getIssueResponse.ok) {
    throw new Error(`Linear request failed with status ${getIssueResponse.status}`)
  }

  const getIssuePayload = (await getIssueResponse.json()) as {
    data?: {
      issue?: {
        id: string
        labels?: {
          nodes?: Array<{ id: string } | null> | null
        } | null
      } | null
    }
    errors?: Array<{ message: string }>
  }

  if (getIssuePayload.errors?.length) {
    throw new Error(getIssuePayload.errors.map((error) => error.message).join(", "))
  }

  const issue = getIssuePayload.data?.issue
  if (!issue) {
    throw new Error(`Linear issue ${issueId} not found`)
  }

  // Get existing label IDs
  const existingLabelIds =
    issue.labels?.nodes?.filter((label): label is { id: string } => Boolean(label)).map((label) => label.id) ?? []

  // Check if the default label is already present
  if (existingLabelIds.includes(DEFAULT_LABEL_ID)) {
    return // Label already exists, no need to update
  }

  // Add the default label to existing labels
  const updatedLabelIds = [...existingLabelIds, DEFAULT_LABEL_ID]

  // Update the issue with the new labels
  const updateResponse = await fetch(LINEAR_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: UPDATE_ISSUE_LABELS_MUTATION,
      variables: {
        issueId,
        labelIds: updatedLabelIds,
      },
    }),
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!updateResponse.ok) {
    throw new Error(`Linear request failed with status ${updateResponse.status}`)
  }

  const updatePayload = (await updateResponse.json()) as UpdateIssueLabelsResponse

  if (updatePayload.errors?.length) {
    throw new Error(updatePayload.errors.map((error) => error.message).join(", "))
  }

  const issueUpdate = updatePayload.data?.issueUpdate

  if (!issueUpdate?.success) {
    throw new Error("Failed to update Linear issue labels")
  }
}

export function mapLinearStateToStatus(linearStateName: string): CustomerRequestStatus {
  const normalized = linearStateName.toLowerCase().trim()

  if (normalized === "backlog") {
    return "triaged"
  }

  if (normalized === "todo") {
    return "pending"
  }

  if (normalized === "in progress" || normalized === "in_progress") {
    return "in_progress"
  }

  if (normalized === "in review" || normalized === "in_review") {
    return "in_review"
  }

  if (normalized === "done") {
    return "resolved"
  }

  if (normalized === "canceled" || normalized === "cancelled") {
    return "cancelled"
  }

  // Default to pending for unknown states
  return "pending"
}

const GET_ISSUE_COMMENTS_QUERY = /* GraphQL */ `
  query GetIssueComments($issueId: String!) {
    issue(id: $issueId) {
      id
      comments(first: 10, orderBy: createdAt) {
        nodes {
          id
          body
          createdAt
          user {
            id
            name
          }
        }
      }
    }
  }
`

type GetIssueCommentsResponse = {
  data?: {
    issue?: {
      id: string
      comments?: {
        nodes?: Array<{
          id: string
          body: string
          createdAt: string
          user?: {
            id: string
            name: string
          } | null
        } | null> | null
      } | null
    } | null
  }
  errors?: Array<{ message: string }>
}

export async function fetchLinearIssueComments(issueId: string): Promise<string | null> {
  const apiKey = requireLinearApiKey()

  const response = await fetch(LINEAR_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: GET_ISSUE_COMMENTS_QUERY,
      variables: { issueId },
    }),
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    throw new Error(`Linear request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as GetIssueCommentsResponse

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "))
  }

  const issue = payload.data?.issue
  if (!issue) {
    return null
  }

  const comments = issue.comments?.nodes?.filter((comment): comment is NonNullable<typeof comment> => Boolean(comment)) ?? []
  
  // Return the latest comment body, or null if no comments
  if (comments.length === 0) {
    return null
  }

  // Comments are ordered by createdAt, so the last one is the latest
  const latestComment = comments[comments.length - 1]
  return latestComment.body || null
}

