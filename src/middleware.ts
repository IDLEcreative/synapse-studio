import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { addSecurityHeaders, isOriginAllowed } from "@/lib/security";
import { logger } from "@/lib/logger";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply security headers to all responses
  let response = NextResponse.next();

  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    response = new NextResponse(null, { status: 200 });
    return addSecurityHeaders(response);
  }

  // Check origin for API routes
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    if (origin && !isOriginAllowed(origin)) {
      return new NextResponse(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
      });
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/signin",
    "/auth/signup",
    "/auth/error",
    "/api/auth",
    "/",
    "/favicon.ico",
    "/_next",
    "/public",
  ];

  // Check if route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname.startsWith(route) || pathname === "/",
  );

  if (isPublicRoute) {
    return addSecurityHeaders(response);
  }

  // Protected API routes - require authentication
  if (pathname.startsWith("/api/")) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token) {
        return new NextResponse(
          JSON.stringify({ error: "Authentication required" }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }
    } catch (error) {
      logger.error("Middleware auth error", error, {
        operation: "middleware_auth",
      });
      return new NextResponse(
        JSON.stringify({ error: "Authentication error" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  } else {
    // Protected pages - redirect to signin
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token) {
        const signInUrl = new URL("/auth/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", request.url);
        return NextResponse.redirect(signInUrl);
      }
    } catch (error) {
      logger.error("Middleware auth error", error, {
        operation: "middleware_auth",
      });
      const signInUrl = new URL("/auth/signin", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
