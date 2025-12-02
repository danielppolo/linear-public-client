import type { NextRequest } from "next/server"

export function verifyBearerToken(request: NextRequest, expectedToken: string): boolean {
  const authHeader = request.headers.get("authorization")

  if (!authHeader) {
    return false
  }

  // Handle "Bearer <token>" format
  const parts = authHeader.trim().split(/\s+/)
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return false
  }

  const token = parts[1]
  return token === expectedToken
}

