import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const secret = process.env.ACCESS_TOKEN?.trim()
  if (!secret) {
    return NextResponse.next()
  }

  const token = request.nextUrl.searchParams.get("token")
  if (token && token === secret) {
    return NextResponse.next()
  }

  return new NextResponse("Unauthorized", { status: 401 })
}

export const config = {
  matcher: ["/", "/donde", "/ondamx"],
}
