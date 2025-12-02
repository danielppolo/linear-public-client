import { z } from "zod"

export const customerRequestTypeSchema = z.enum(["bug", "feature"])

export const customerRequestStatusSchema = z.enum([
  "pending",
  "triaged",
  "in_progress",
  "resolved",
  "closed",
  "cancelled",
  "error",
])

export const customerRequestMetadataSchema = z.record(z.string(), z.unknown()).optional()

export const createCustomerRequestSchema = z.object({
  content: z.string().min(1, "Content is required"),
  type: customerRequestTypeSchema,
  external_user_id: z.string().min(1, "external_user_id is required"),
  user_name: z.string().optional(),
  project_id: z.string().min(1, "project_id is required"),
  source: z.string().optional(),
  metadata: customerRequestMetadataSchema,
})

export const updateCustomerRequestSchema = z.object({
  status: customerRequestStatusSchema.optional(),
  content: z.string().min(1).optional(),
  type: customerRequestTypeSchema.optional(),
  response: z.string().optional(),
  metadata: customerRequestMetadataSchema,
})

export const listCustomerRequestsQuerySchema = z.object({
  status: customerRequestStatusSchema.optional(),
  external_user_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
})

export type CreateCustomerRequestInput = z.infer<typeof createCustomerRequestSchema>
export type UpdateCustomerRequestInput = z.infer<typeof updateCustomerRequestSchema>
export type ListCustomerRequestsQuery = z.infer<typeof listCustomerRequestsQuerySchema>

