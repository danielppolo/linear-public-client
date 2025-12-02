export type StructuredIssueSuggestion = {
  title: string
  description: string
  labels: string[]
  priority: number
}

export type UserResponse = {
  response_text: string
}

export type IssueStructureInput = {
  content: string
  type: "bug" | "feature"
  metadata?: {
    env?: string
    app_version?: string
    [key: string]: unknown
  }
}

export type CreationResponseInput = {
  user_name?: string | null
  type: "bug" | "feature"
  interpreted_request_summary: string
  linear_issue_identifier: string
}

export type ResolutionResponseInput = {
  user_name?: string | null
  original_content: string
  latest_comment_text?: string
  linear_issue_identifier: string
}

