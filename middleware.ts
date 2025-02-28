import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth";

// Add routes that don't require authentication
const publicRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for token
  const token = request.cookies.get("token");

  // If no token, redirect to login
  if (!token) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  try {
    // Verify token
    const payload = await verifyJWT(token.value);
    if (!payload) {
      throw new Error("Invalid token");
    }

    // Token is valid, continue
    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    const url = new URL("/login", request.url);
    const response = NextResponse.redirect(url);

    // Clear invalid token
    response.cookies.delete("token");

    return response;
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (authentication routes)
     * 2. /_next/* (Next.js internals)
     * 3. /fonts/* (inside public directory)
     * 4. /favicon.ico, /sitemap.xml (public files)
     */
    "/((?!api/auth|_next|fonts|favicon.ico|sitemap.xml).*)",
  ],
};
