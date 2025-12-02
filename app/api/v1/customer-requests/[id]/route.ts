import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { updateCustomerRequestSchema } from "@/lib/validations/customer-request"
import { getD1Client } from "@/lib/db/get-client"
import { CUSTOMER_REQUESTS_TABLE } from "@/lib/db/schema"
import { formatErrorResponse, ValidationError, NotFoundError, UnauthorizedError } from "@/lib/errors"
import { requireBearerAuth } from "@/lib/auth/middleware"
import type { CustomerRequest } from "@/lib/types/customer-request"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireBearerAuth(request)

    const { id } = await params
    const db = getD1Client()

    const result = await db.query<CustomerRequest>(
      `SELECT * FROM ${CUSTOMER_REQUESTS_TABLE} WHERE id = ? AND deleted_at IS NULL`,
      [id]
    )

    if (result.results.length === 0) {
      throw new NotFoundError(`Customer request with id ${id} not found`)
    }

    const customerRequest = parseCustomerRequest(result.results[0])

    return NextResponse.json(customerRequest)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 })
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(formatErrorResponse(error), { status: 404 })
    }

    const errorResponse = formatErrorResponse(error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireBearerAuth(request)

    const { id } = await params
    const body = await request.json()
    let validated
    try {
      validated = updateCustomerRequestSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError("Validation failed", error.issues)
      }
      throw error
    }

    const db = getD1Client()

    // Check if record exists
    const existing = await db.query<CustomerRequest>(
      `SELECT * FROM ${CUSTOMER_REQUESTS_TABLE} WHERE id = ? AND deleted_at IS NULL`,
      [id]
    )

    if (existing.results.length === 0) {
      throw new NotFoundError(`Customer request with id ${id} not found`)
    }

    // Build UPDATE clause
    const updates: string[] = ["updated_at = ?"]
    const params: unknown[] = [new Date().toISOString()]

    if (validated.status !== undefined) {
      updates.push("status = ?")
      params.push(validated.status)
    }

    if (validated.content !== undefined) {
      updates.push("content = ?")
      params.push(validated.content)
    }

    if (validated.type !== undefined) {
      updates.push("type = ?")
      params.push(validated.type)
    }

    if (validated.response !== undefined) {
      updates.push("response = ?")
      params.push(validated.response)
    }

    if (validated.metadata !== undefined) {
      updates.push("metadata = ?")
      params.push(JSON.stringify(validated.metadata))
    }

    params.push(id)

    const updateSql = `
      UPDATE ${CUSTOMER_REQUESTS_TABLE}
      SET ${updates.join(", ")}
      WHERE id = ?
    `

    await db.execute(updateSql, params)

    // Fetch updated record
    const result = await db.query<CustomerRequest>(
      `SELECT * FROM ${CUSTOMER_REQUESTS_TABLE} WHERE id = ?`,
      [id]
    )

    if (result.results.length === 0) {
      throw new Error("Failed to retrieve updated customer request")
    }

    const customerRequest = parseCustomerRequest(result.results[0])

    return NextResponse.json(customerRequest)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 })
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 })
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(formatErrorResponse(error), { status: 404 })
    }

    const errorResponse = formatErrorResponse(error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireBearerAuth(request)

    const { id } = await params
    const db = getD1Client()

    // Check if record exists
    const existing = await db.query<CustomerRequest>(
      `SELECT * FROM ${CUSTOMER_REQUESTS_TABLE} WHERE id = ? AND deleted_at IS NULL`,
      [id]
    )

    if (existing.results.length === 0) {
      throw new NotFoundError(`Customer request with id ${id} not found`)
    }

    // Soft delete
    await db.execute(
      `UPDATE ${CUSTOMER_REQUESTS_TABLE} SET deleted_at = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    )

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 })
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(formatErrorResponse(error), { status: 404 })
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
    team_id: String(r.team_id),
    linear_issue_id: r.linear_issue_id ? String(r.linear_issue_id) : null,
    response: r.response ? String(r.response) : null,
    source: r.source ? String(r.source) : null,
    metadata: r.metadata ? (JSON.parse(String(r.metadata)) as CustomerRequest["metadata"]) : null,
    deleted_at: r.deleted_at ? String(r.deleted_at) : null,
  }
}

