import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { NextRequest } from "next/server";
import {
  rateLimiter,
  withRateLimit,
  addSecurityHeaders,
  isOriginAllowed,
  validateApiKeyUsage,
} from "../security";

// Mock NextRequest
const createMockRequest = (
  overrides: Partial<{
    ip: string;
    userAgent: string;
    origin: string;
    referer: string;
    method: string;
  }> = {},
) => {
  const headers = new Map();

  if (overrides.ip) headers.set("x-forwarded-for", overrides.ip);
  if (overrides.userAgent) headers.set("user-agent", overrides.userAgent);
  if (overrides.origin) headers.set("origin", overrides.origin);
  if (overrides.referer) headers.set("referer", overrides.referer);

  return {
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()) || null,
    },
    method: overrides.method || "GET",
    url: "http://localhost:3000/api/test",
  } as NextRequest;
};

describe("Security Utilities", () => {
  beforeEach(() => {
    // Clear rate limiter between tests
    rateLimiter.destroy();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Rate Limiting", () => {
    it("should allow requests within the rate limit", () => {
      const result1 = rateLimiter.check("test-user", 5, 60000);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = rateLimiter.check("test-user", 5, 60000);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it("should block requests exceeding the rate limit", () => {
      // Make 5 requests (up to the limit)
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.check("test-user", 5, 60000);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const result = rateLimiter.check("test-user", 5, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset rate limit after window expires", () => {
      // Use a short window for testing
      const windowMs = 100;

      // Hit rate limit
      for (let i = 0; i < 2; i++) {
        rateLimiter.check("test-user", 2, windowMs);
      }

      const blockedResult = rateLimiter.check("test-user", 2, windowMs);
      expect(blockedResult.allowed).toBe(false);

      // Wait for window to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          const allowedResult = rateLimiter.check("test-user", 2, windowMs);
          expect(allowedResult.allowed).toBe(true);
          expect(allowedResult.remaining).toBe(1);
          resolve(undefined);
        }, windowMs + 10);
      });
    }, 1000);

    it("should handle different identifiers separately", () => {
      rateLimiter.check("user1", 2, 60000);
      rateLimiter.check("user1", 2, 60000);

      // user1 should be at limit
      const user1Result = rateLimiter.check("user1", 2, 60000);
      expect(user1Result.allowed).toBe(false);

      // user2 should still be allowed
      const user2Result = rateLimiter.check("user2", 2, 60000);
      expect(user2Result.allowed).toBe(true);
    });

    it("should clean up expired entries", () => {
      const windowMs = 50;

      // Add entry that will expire quickly
      rateLimiter.check("test-user", 5, windowMs);

      return new Promise((resolve) => {
        setTimeout(() => {
          // Trigger cleanup by calling cleanup method if accessible
          // Since cleanup is private, we'll test its effect indirectly
          const result = rateLimiter.check("test-user", 5, 60000);
          expect(result.remaining).toBe(4); // Should start fresh
          resolve(undefined);
        }, windowMs + 100);
      });
    }, 1000);
  });

  describe("Rate Limit Middleware", () => {
    it("should allow requests within rate limit", () => {
      const middleware = withRateLimit(5, 60000);
      const req = createMockRequest({
        ip: "127.0.0.1",
        userAgent: "test-agent",
      });

      const response = middleware(req);
      expect(response).toBeNull(); // No rate limit response
    });

    it("should block requests exceeding rate limit", () => {
      const middleware = withRateLimit(1, 60000);
      const req = createMockRequest({
        ip: "127.0.0.1",
        userAgent: "test-agent",
      });

      // First request should pass
      const firstResponse = middleware(req);
      expect(firstResponse).toBeNull();

      // Second request should be blocked
      const secondResponse = middleware(req);
      expect(secondResponse).not.toBeNull();
      expect(secondResponse!.status).toBe(429);
    });

    it("should include proper headers in rate limit response", () => {
      const middleware = withRateLimit(1, 60000);
      const req = createMockRequest({
        ip: "127.0.0.1",
        userAgent: "test-agent",
      });

      // Trigger rate limit
      middleware(req);
      const response = middleware(req);

      expect(response!.headers.get("X-RateLimit-Limit")).toBe("1");
      expect(response!.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response!.headers.get("Retry-After")).toBeTruthy();
    });

    it("should handle anonymous requests", () => {
      const middleware = withRateLimit(5, 60000);
      const req = createMockRequest({}); // No IP or user agent

      const response = middleware(req);
      expect(response).toBeNull();
    });

    it("should create unique identifiers for different clients", () => {
      const middleware = withRateLimit(1, 60000);

      const req1 = createMockRequest({ ip: "127.0.0.1", userAgent: "agent1" });
      const req2 = createMockRequest({ ip: "127.0.0.1", userAgent: "agent2" });

      // Both should be allowed initially
      expect(middleware(req1)).toBeNull();
      expect(middleware(req2)).toBeNull();

      // Both should be blocked on second request
      expect(middleware(req1)!.status).toBe(429);
      expect(middleware(req2)!.status).toBe(429);
    });
  });

  describe("Security Headers", () => {
    it("should add all required security headers", () => {
      const response = new Response("test");
      const secureResponse = addSecurityHeaders(response);

      expect(secureResponse.headers.get("X-Content-Type-Options")).toBe(
        "nosniff",
      );
      expect(secureResponse.headers.get("X-Frame-Options")).toBe("DENY");
      expect(secureResponse.headers.get("X-XSS-Protection")).toBe(
        "1; mode=block",
      );
      expect(secureResponse.headers.get("Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin",
      );
      expect(secureResponse.headers.get("Permissions-Policy")).toBe(
        "camera=(), microphone=(), geolocation=()",
      );
    });

    it("should add CORS headers", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com,https://test.com";

      const response = new Response("test");
      const secureResponse = addSecurityHeaders(response);

      expect(secureResponse.headers.get("Access-Control-Allow-Origin")).toBe(
        "https://example.com",
      );
      expect(secureResponse.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET,POST,PUT,DELETE,OPTIONS",
      );
      expect(secureResponse.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type,Authorization,X-Requested-With",
      );

      delete process.env.ALLOWED_ORIGINS;
    });

    it("should remove sensitive headers", () => {
      const response = new Response("test");
      response.headers.set("Server", "nginx/1.0");
      response.headers.set("X-Powered-By", "Next.js");

      const secureResponse = addSecurityHeaders(response);

      expect(secureResponse.headers.get("Server")).toBeNull();
      expect(secureResponse.headers.get("X-Powered-By")).toBeNull();
    });
  });

  describe("Origin Validation", () => {
    beforeEach(() => {
      process.env.ALLOWED_ORIGINS = "http://localhost:3000,https://example.com";
    });

    afterEach(() => {
      delete process.env.ALLOWED_ORIGINS;
    });

    it("should allow requests from allowed origins", () => {
      expect(isOriginAllowed("http://localhost:3000")).toBe(true);
      expect(isOriginAllowed("https://example.com")).toBe(true);
    });

    it("should block requests from disallowed origins", () => {
      expect(isOriginAllowed("https://malicious.com")).toBe(false);
      expect(isOriginAllowed("http://evil.example.com")).toBe(false);
    });

    it("should allow requests without origin", () => {
      expect(isOriginAllowed(null)).toBe(true);
    });

    it("should fall back to localhost when no origins configured", () => {
      delete process.env.ALLOWED_ORIGINS;
      expect(isOriginAllowed("http://localhost:3000")).toBe(true);
      expect(isOriginAllowed("https://example.com")).toBe(false);
    });
  });

  describe("API Key Usage Validation", () => {
    it("should allow non-browser requests", () => {
      const req = createMockRequest({
        userAgent: "curl/7.68.0",
      });

      const result = validateApiKeyUsage(req);
      expect(result.isValid).toBe(true);
    });

    it("should allow browser requests from allowed origins", () => {
      process.env.ALLOWED_ORIGINS = "http://localhost:3000";

      const req = createMockRequest({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        referer: "http://localhost:3000/dashboard",
      });

      const result = validateApiKeyUsage(req);
      expect(result.isValid).toBe(true);

      delete process.env.ALLOWED_ORIGINS;
    });

    it("should block direct browser access to API", () => {
      const req = createMockRequest({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      });

      const result = validateApiKeyUsage(req);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Direct browser access to this endpoint is not allowed",
      );
    });

    it("should detect Chrome browser", () => {
      const req = createMockRequest({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      });

      const result = validateApiKeyUsage(req);
      expect(result.isValid).toBe(false);
    });

    it("should detect Firefox browser", () => {
      const req = createMockRequest({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
      });

      const result = validateApiKeyUsage(req);
      expect(result.isValid).toBe(false);
    });

    it("should detect Safari browser", () => {
      const req = createMockRequest({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
      });

      const result = validateApiKeyUsage(req);
      expect(result.isValid).toBe(false);
    });

    it("should handle missing user agent", () => {
      const req = createMockRequest({});

      const result = validateApiKeyUsage(req);
      expect(result.isValid).toBe(true);
    });
  });
});
