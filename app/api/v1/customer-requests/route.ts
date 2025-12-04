import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { ZodError } from "zod"
import { createCustomerRequestSchema, listCustomerRequestsQuerySchema } from "@/lib/validations/customer-request"
import { getD1Client } from "@/lib/db/get-client"
import { CUSTOMER_REQUESTS_TABLE } from "@/lib/db/schema"
import { createLinearIssue } from "@/lib/linear"
import { formatErrorResponse, ValidationError, LinearApiError, UnauthorizedError } from "@/lib/errors"
import { requireBearerAuth } from "@/lib/auth/middleware"
import type { CustomerRequest } from "@/lib/types/customer-request"

export async function POST(request: NextRequest) {
  try {
    requireBearerAuth(request)

    const body = await request.json()
    let validated
    try {
      validated = createCustomerRequestSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError("Validation failed", error.issues)
      }
      throw error
    }

    const db = getD1Client()
    const id = randomUUID()
    const now = new Date().toISOString()

    // Generate AI-structured issue suggestion if enabled
    const metadata = validated.metadata || {}


    // Insert customer request with status = "pending"
    const insertSql = `
      INSERT INTO ${CUSTOMER_REQUESTS_TABLE} (
        id, created_at, updated_at, content, type, status,
        external_user_id, user_name, project_id, source, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const metadataJson = Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null

    await db.execute(insertSql, [
      id,
      now,
      now,
      validated.content,
      validated.type,
      "pending",
      validated.external_user_id,
      validated.user_name || null,
      validated.project_id,
      validated.source || null,
      metadataJson,
    ])

    // Create Linear issue
    let linearIssueId: string | null = null
    let linearIssueIdentifier: string | null = null
    try {
      const linearIssue = await createLinearIssue(
        validated.project_id,
        validated.content,
        validated.type,
        {
          reason: validated.reason,
          user_name: validated.user_name,
          external_user_id: validated.external_user_id,
        }
      )
      linearIssueId = linearIssue.id
      linearIssueIdentifier = linearIssue.identifier

      // Update with linear_issue_id
      const updateSql = `
        UPDATE ${CUSTOMER_REQUESTS_TABLE}
        SET linear_issue_id = ?, updated_at = ?
        WHERE id = ?
      `
      await db.execute(updateSql, [
        linearIssueId,
        new Date().toISOString(),
        id,
      ])
    } catch (error) {
      // On Linear failure, roll back the database transaction
      // Since D1 doesn't support transactions in the same way, we'll delete the record
      await db.execute(`DELETE FROM ${CUSTOMER_REQUESTS_TABLE} WHERE id = ?`, [id])
      throw new LinearApiError(
        `Failed to create Linear issue: ${error instanceof Error ? error.message : "Unknown error"}`,
        502,
        error
      )
    }

    // Fetch the complete record
    const result = await db.query<CustomerRequest>(
      `SELECT * FROM ${CUSTOMER_REQUESTS_TABLE} WHERE id = ?`,
      [id]
    )

    if (result.results.length === 0) {
      throw new Error("Failed to retrieve created customer request")
    }

    const customerRequest = parseCustomerRequest(result.results[0]?.results?.[0])

    return NextResponse.json(customerRequest, { status: 201 })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 })
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 })
    }

    if (error instanceof LinearApiError) {
      return NextResponse.json(formatErrorResponse(error), { status: error.statusCode || 502 })
    }

    const errorResponse = formatErrorResponse(error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    requireBearerAuth(request)

    const searchParams = request.nextUrl.searchParams
    const query = {
      status: searchParams.get("status") || undefined,
      external_user_id: searchParams.get("external_user_id") || undefined,
      limit: searchParams.get("limit") || undefined,
      cursor: searchParams.get("cursor") || undefined,
    }

    let validated
    try {
      validated = listCustomerRequestsQuerySchema.parse(query)
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError("Validation failed", error.issues)
      }
      throw error
    }
    const db = getD1Client()

    // Build WHERE clause
    const conditions: string[] = ["deleted_at IS NULL"]
    const params: unknown[] = []

    if (validated.status) {
      conditions.push("status = ?")
      params.push(validated.status)
    }

    if (validated.external_user_id) {
      conditions.push("external_user_id = ?")
      params.push(validated.external_user_id)
    }

    // Cursor-based pagination (using id as cursor)
    if (validated.cursor) {
      conditions.push("id > ?")
      params.push(validated.cursor)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
    const limit = validated.limit || 20

    const sql = `
      SELECT * FROM ${CUSTOMER_REQUESTS_TABLE}
      ${whereClause}
      ORDER BY id ASC
      LIMIT ?
    `
    params.push(limit + 1) // Fetch one extra to determine if there's a next page

    const result = await db.query<CustomerRequest>(sql, params)
    const results = result.results[0]?.results || []

    const items = results.slice(0, limit).map(parseCustomerRequest)
    const nextCursor = results.length > limit ? results[limit - 1].id : null

    return NextResponse.json({
      items,
      next_cursor: nextCursor,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 })
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 })
    }

    const errorResponse = formatErrorResponse(error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
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

