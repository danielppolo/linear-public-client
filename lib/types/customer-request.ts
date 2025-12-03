export type CustomerRequestType = "bug" | "feature"

export type CustomerRequestStatus =
| "triaged"
 | "pending"
 | "in_progress"
  | "in_review"
  | "resolved"
  | "closed"
  | "cancelled"
  | "error"

export type CustomerRequestMetadata = {
  env?: string
  app_version?: string
  cancel_reason?: string
  latest_comment?: {
    id: string
    body: string
    createdAt: string
    user?: {
      id: string
      name: string
    }
  }
  model_issue_suggestion?: {
    title: string
    description: string
    labels: string[]
    priority: number
  }
  linear_state?: {
    id: string
    name: string
    updated_at: string
  }
  [key: string]: unknown
}

export interface CustomerRequest {
  id: string
  created_at: string
  updated_at: string
  content: string
  type: CustomerRequestType
  status: CustomerRequestStatus
  external_user_id: string
  user_name: string | null
  project_id: string
  linear_issue_id: string | null
  response: string | null
  source: string | null
  metadata: CustomerRequestMetadata | null
  deleted_at: string | null
}

export interface CreateCustomerRequestInput {
  content: string
  type: CustomerRequestType
  external_user_id: string
  user_name?: string
  project_id: string
  source?: string
  metadata?: CustomerRequestMetadata
}

export interface UpdateCustomerRequestInput {
  status?: CustomerRequestStatus
  content?: string
  type?: CustomerRequestType
  response?: string
  metadata?: CustomerRequestMetadata
}

export interface ListCustomerRequestsQuery {
  status?: CustomerRequestStatus
  external_user_id?: string
  limit?: number
  cursor?: string
}

export interface ListCustomerRequestsResponse {
  items: CustomerRequest[]
  next_cursor: string | null
}

