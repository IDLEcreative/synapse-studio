import { NextRequest, NextResponse } from "next/server";

// Rate limiting with in-memory store
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimit {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  public check(
    identifier: string,
    maxRequests: number,
    windowMs: number,
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window has expired
      const resetTime = now + windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.store.set(identifier, entry);

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  public destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimit();

// Rate limiting middleware for API routes
export function withRateLimit(
  maxRequests: number = 10,
  windowMs: number = 60 * 1000, // 1 minute default
) {
  return function rateLimit(req: NextRequest): NextResponse | null {
    // Use IP address and user agent for rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(/, /)[0] : "anonymous";
    const userAgent = req.headers.get("user-agent") || "";
    const identifier = `${ip}:${userAgent.substring(0, 50)}`;

    const { allowed, remaining, resetTime } = rateLimiter.check(
      identifier,
      maxRequests,
      windowMs,
    );

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
            "Retry-After": Math.ceil(
              (resetTime - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    // Add rate limit headers to successful responses
    const headers = {
      "X-RateLimit-Limit": maxRequests.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
    };

    // Store headers to be added by the handler
    (
      req as Request & { rateLimitHeaders?: Record<string, string> }
    ).rateLimitHeaders = headers;

    return null; // No rate limit response, continue
  };
}

// CORS and security headers
export function addSecurityHeaders(response: Response): Response {
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS || "http://localhost:3000"
  ).split(",");

  // Set CORS headers
  response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With",
  );
  response.headers.set("Access-Control-Max-Age", "86400");

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  // Remove sensitive headers
  response.headers.delete("Server");
  response.headers.delete("X-Powered-By");

  return response;
}

// Check if origin is allowed
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // Allow requests without origin (like from curl)

  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS || "http://localhost:3000"
  ).split(",");
  return allowedOrigins.includes(origin);
}

// Validate API key is server-side only
export function validateApiKeyUsage(req: NextRequest): {
  isValid: boolean;
  error?: string;
} {
  const userAgent = req.headers.get("user-agent") || "";
  const referer = req.headers.get("referer") || "";

  // Check if request is coming from a browser (potential client-side usage)
  const isBrowser =
    userAgent.includes("Mozilla/") &&
    (userAgent.includes("Chrome/") ||
      userAgent.includes("Safari/") ||
      userAgent.includes("Firefox/"));

  // Allow if it's not a browser request
  if (!isBrowser) return { isValid: true };

  // Allow if referer is from allowed origins (server-side API calls from our app)
  if (referer && isOriginAllowed(new URL(referer).origin)) {
    return { isValid: true };
  }

  // Block direct browser access to API endpoints with sensitive data
  return {
    isValid: false,
    error: "Direct browser access to this endpoint is not allowed",
  };
}
