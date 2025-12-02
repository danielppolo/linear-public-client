import type { NextRequest } from "next/server"
import { verifyBearerToken } from "./bearer"
import { UnauthorizedError } from "@/lib/errors"

export function requireBearerAuth(request: NextRequest): void {
  const token = process.env.API_BEARER_TOKEN?.trim()

  if (!token) {
    throw new UnauthorizedError("API_BEARER_TOKEN is not configured")
  }

  if (!verifyBearerToken(request, token)) {
    throw new UnauthorizedError("Invalid or missing bearer token")
  }
}

