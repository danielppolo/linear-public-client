import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { getD1Client } from "@/lib/db/get-client"
import { CUSTOMER_REQUESTS_TABLE } from "@/lib/db/schema"
import { mapLinearStateToStatus, addLabelToLinearIssue, fetchLinearIssueComments } from "@/lib/linear"
import { formatErrorResponse, WebhookAuthError } from "@/lib/errors"
import { verifyBearerToken } from "@/lib/auth/bearer"
import { generateResolutionResponse } from "@/lib/openai/responses"
import type { CustomerRequest } from "@/lib/types/customer-request"

type LinearWebhookEvent = {
  type: string
  action: string
  data: {
    id: string
    identifier?: string
    title?: string
    state?: {
      id: string
      name: string
    }
    team?: {
      id: string
    }
    comments?: {
      nodes?: Array<{
        id: string
        body: string
        createdAt: string
        user?: {
          id: string
          name: string
        }
      }>
    }
  }
}

function verifyWebhookHmacSignature(request: NextRequest, body: string): boolean {
  const secret = process.env.LINEAR_WEBHOOK_SECRET?.trim()
  if (!secret) {
    return false
  }

  const signature = request.headers.get("linear-signature")
  if (!signature) {
    return false
  }

  // Linear uses HMAC-SHA256 for webhook signatures
  // The signature is typically in the format: sha256=<hex_digest>
  const expectedSignature = createHmac("sha256", secret).update(body).digest("hex")
  
  // Linear may send the signature with a prefix, so we check both formats
  const signatureWithoutPrefix = signature.replace(/^sha256=/, "")
  const signatureMatch = signatureWithoutPrefix === expectedSignature || signature === expectedSignature

  return signatureMatch
}

function verifyWebhookAuth(request: NextRequest, body: string): boolean {
  // Option 1: Bearer token authentication
  const bearerToken = process.env.WEBHOOK_BEARER_TOKEN?.trim()
  if (bearerToken && verifyBearerToken(request, bearerToken)) {
    return true
  }

  // Option 2: HMAC-SHA256 signature verification
  if (verifyWebhookHmacSignature(request, body)) {
    return true
  }

  // If neither method is configured, allow the request (for development)
  // In production, at least one should be configured
  const hasAnyConfig = bearerToken || process.env.LINEAR_WEBHOOK_SECRET?.trim()
  if (!hasAnyConfig) {
    return true
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    // Verify webhook authentication (bearer token or HMAC signature)
    if (!verifyWebhookAuth(request, body)) {
      throw new WebhookAuthError("Invalid webhook authentication")
    }

    const event = JSON.parse(body) as LinearWebhookEvent

    // Handle different event types
    if (event.type === "Issue") {
      if (event.action === "create" || event.action === "update") {
        await handleIssueEvent(event)
      } else if (event.action === "remove" || event.action === "delete") {
        await handleIssueDeletion(event)
      }
    } else if (event.type === "Comment" && event.action === "create") {
      await handleCommentEvent(event)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    if (error instanceof WebhookAuthError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 })
    }

    // Always return 200 for webhook errors to prevent retries
    // Log the error for debugging
    console.error("Webhook error:", error)
    return NextResponse.json({ success: false, error: formatErrorResponse(error) }, { status: 200 })
  }
}

async function handleIssueEvent(event: LinearWebhookEvent) {
  const issueId = event.data.id
  const state = event.data.state

  if (!issueId) {
    return
  }

  // If this is a new issue creation, add the default label
  if (event.action === "create") {
    try {
      await addLabelToLinearIssue(issueId)
    } catch (error) {
      // Log but don't fail - label addition is best effort
      console.error("Failed to add label to Linear issue:", error)
    }
  }

  // If there's no state, we can't update the status, so return early
  if (!state) {
    return
  }

  const db = getD1Client()

  // Find customer request by linear_issue_id
  const result = await db.query<CustomerRequest>(
    `SELECT * FROM ${CUSTOMER_REQUESTS_TABLE} WHERE linear_issue_id = ? AND deleted_at IS NULL`,
    [issueId]
  )

  if (result.results.length === 0) {
    // Issue not found in our database - this is okay, might be created outside our system
    return
  }

  const customerRequest = parseCustomerRequest(result.results[0]?.results?.[0])
  const newStatus = mapLinearStateToStatus(state.name)

  // Only update if status changed
  if (customerRequest.status !== newStatus) {
    const metadata = customerRequest.metadata || {}
    metadata.linear_state = {
      id: state.id,
      name: state.name,
      updated_at: new Date().toISOString(),
    }

    let responseText: string | null = customerRequest.response

    // Generate resolution response if status is now "resolved" (Done in Linear)
    if (newStatus === "resolved" && customerRequest.status !== "resolved") {
      try {
        // Fetch the latest comment from the Linear issue
        let latestCommentText: string | null = null
        try {
          latestCommentText = await fetchLinearIssueComments(issueId)
        } catch (error) {
          // Log but don't fail - comment fetching is optional
          console.error("Failed to fetch comments from Linear issue:", error)
        }

        if (latestCommentText) {
          const resolutionResponse = await generateResolutionResponse({
            user_name: customerRequest.user_name,
            original_content: customerRequest.content,
            latest_comment_text: latestCommentText || undefined,
            linear_issue_identifier: event.data.identifier || issueId,
          })
  
          if (resolutionResponse) {
            responseText = resolutionResponse
          }
        }
      } catch (error) {
        // Log but don't fail - response generation is optional
        console.error("Failed to generate resolution response with AI:", error)
      }
    }

    await db.execute(
      `UPDATE ${CUSTOMER_REQUESTS_TABLE} 
       SET status = ?, metadata = ?, response = ?, updated_at = ? 
       WHERE id = ?`,
      [
        newStatus,
        JSON.stringify(metadata),
        responseText,
        new Date().toISOString(),
        customerRequest.id,
      ]
    )
  }
}

async function handleIssueDeletion(event: LinearWebhookEvent) {
  const issueId = event.data.id

  if (!issueId) {
    return
  }

  const db = getD1Client()

  // Find customer request by linear_issue_id that hasn't been deleted yet
  const result = await db.query<CustomerRequest>(
    `SELECT * FROM ${CUSTOMER_REQUESTS_TABLE} WHERE linear_issue_id = ? AND deleted_at IS NULL`,
    [issueId]
  )

  if (result.results.length === 0) {
    // Issue not found in our database or already deleted - this is okay
    return
  }

  const customerRequest = parseCustomerRequest(result.results[0]?.results?.[0])
  const deletedAt = new Date().toISOString()

  // Soft delete by setting deleted_at timestamp
  await db.execute(
    `UPDATE ${CUSTOMER_REQUESTS_TABLE} 
     SET deleted_at = ?, updated_at = ? 
     WHERE id = ?`,
    [deletedAt, deletedAt, customerRequest.id]
  )
}

async function handleCommentEvent(event: LinearWebhookEvent) {
  const issueId = event.data.id
  const comments = event.data.comments?.nodes

  if (!issueId || !comments || comments.length === 0) {
    return
  }

  // Get the latest comment
  const latestComment = comments[comments.length - 1]

  const db = getD1Client()

  // Find customer request by linear_issue_id
  const result = await db.query<CustomerRequest>(
    `SELECT * FROM ${CUSTOMER_REQUESTS_TABLE} WHERE linear_issue_id = ? AND deleted_at IS NULL`,
    [issueId]
  )

  if (result.results.length === 0) {
    return
  }

  const customerRequest = parseCustomerRequest(result.results[0])
  const metadata = customerRequest.metadata || {}

  metadata.latest_comment = {
    id: latestComment.id,
    body: latestComment.body,
    createdAt: latestComment.createdAt,
    user: latestComment.user
      ? {
          id: latestComment.user.id,
          name: latestComment.user.name,
        }
      : undefined,
  }

  await db.execute(
    `UPDATE ${CUSTOMER_REQUESTS_TABLE} 
     SET metadata = ?, updated_at = ? 
     WHERE id = ?`,
    [JSON.stringify(metadata), new Date().toISOString(), customerRequest.id]
  )
}

function parseCustomerRequest(row: unknown): CustomerRequest {
  const r = row as Record<string, unknown>
  return {
    id: String(r.id),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
    content: String(r.content),
    type: r.type as "bug" | "feature",
    status: r.status as CustomerRequest["status"],
    external_user_id: String(r.external_user_id),
    user_name: r.user_name ? String(r.user_name) : null,
    project_id: String(r.project_id),
    linear_issue_id: r.linear_issue_id ? String(r.linear_issue_id) : null,
    response: r.response ? String(r.response) : null,
    source: r.source ? String(r.source) : null,
    metadata: r.metadata ? (JSON.parse(String(r.metadata)) as CustomerRequest["metadata"]) : null,
    deleted_at: r.deleted_at ? String(r.deleted_at) : null,
  }
}

