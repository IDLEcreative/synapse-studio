import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { GET, POST, PUT } from "../fal/route";

// Mock dependencies
jest.mock("@fal-ai/server-proxy/nextjs", () => ({
  route: {
    GET: jest.fn(),
    POST: jest.fn(),
    PUT: jest.fn(),
  },
}));

jest.mock("@fal-ai/client", () => ({
  createFalClient: jest.fn(() => ({
    subscribe: jest.fn(),
    queue: {
      status: jest.fn(),
      result: jest.fn(),
      submit: jest.fn(),
    },
  })),
}));

jest.mock("@/lib/security", () => ({
  withRateLimit: jest.fn(() => jest.fn(() => null)),
  addSecurityHeaders: jest.fn((response) => response),
  validateApiKeyUsage: jest.fn(() => ({ isValid: true })),
}));

jest.mock("@/lib/validation", () => ({
  safeParseJSON: jest.fn(),
  validateURLParams: jest.fn(),
  falApiRequestSchema: {
    parseAsync: jest.fn(),
  },
  falStatusRequestSchema: {
    partial: jest.fn(() => ({
      parse: jest.fn(),
    })),
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    apiRequest: jest.fn(),
    apiResponse: jest.fn(),
  },
}));

const createMockRequest = (
  url: string,
  options: Partial<{
    method: string;
    body: string;
    headers: Record<string, string>;
  }> = {},
) => {
  const headers = new Map(Object.entries(options.headers || {}));

  return {
    url,
    method: options.method || "GET",
    json: jest.fn().mockResolvedValue(JSON.parse(options.body || "{}")),
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()) || null,
    },
    rateLimitHeaders: {},
  } as unknown as NextRequest;
};

describe("FAL API Route Tests", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up default environment
    process.env.FAL_KEY = "test-fal-key";
  });

  afterEach(() => {
    delete process.env.FAL_KEY;
  });

  describe("GET /api/fal", () => {
    it("should handle basic GET requests", async () => {
      const {
        withRateLimit,
        addSecurityHeaders,
        validateApiKeyUsage,
      } = require("@/lib/security");
      const { validateURLParams } = require("@/lib/validation");
      const { route } = require("@fal-ai/server-proxy/nextjs");

      // Mock successful responses
      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({ isValid: true });
      validateURLParams.mockReturnValue({ success: true, data: {} });
      route.GET.mockResolvedValue(
        new NextResponse(JSON.stringify({ status: "ok" })),
      );

      const req = createMockRequest("http://localhost:3000/api/fal");
      const response = await GET(req);

      expect(response).toBeInstanceOf(NextResponse);
      expect(addSecurityHeaders).toHaveBeenCalled();
    });

    it("should handle rate limiting", async () => {
      const { withRateLimit, addSecurityHeaders } = require("@/lib/security");

      const rateLimitResponse = new NextResponse("Rate limited", {
        status: 429,
      });
      withRateLimit.mockReturnValue(() => rateLimitResponse);

      const req = createMockRequest("http://localhost:3000/api/fal");
      const response = await GET(req);

      expect(response).toBe(rateLimitResponse);
      expect(addSecurityHeaders).toHaveBeenCalledWith(rateLimitResponse);
    });

    it("should handle API key validation failure", async () => {
      const {
        withRateLimit,
        addSecurityHeaders,
        validateApiKeyUsage,
      } = require("@/lib/security");

      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({
        isValid: false,
        error: "Direct browser access not allowed",
      });

      const req = createMockRequest("http://localhost:3000/api/fal");
      const response = await GET(req);

      expect(response.status).toBe(403);
      expect(addSecurityHeaders).toHaveBeenCalled();
    });

    it("should handle URL parameter validation failure", async () => {
      const {
        withRateLimit,
        validateApiKeyUsage,
        addSecurityHeaders,
      } = require("@/lib/security");
      const { validateURLParams } = require("@/lib/validation");

      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({ isValid: true });
      validateURLParams.mockReturnValue({
        success: false,
        error: "Invalid parameters",
      });

      const req = createMockRequest(
        "http://localhost:3000/api/fal?invalid=param",
      );
      const response = await GET(req);

      expect(response.status).toBe(400);
    });

    it("should handle status check requests with requestId", async () => {
      const {
        withRateLimit,
        validateApiKeyUsage,
        addSecurityHeaders,
      } = require("@/lib/security");
      const { validateURLParams } = require("@/lib/validation");
      const { createFalClient } = require("@fal-ai/client");

      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({ isValid: true });
      validateURLParams.mockReturnValue({
        success: true,
        data: { requestId: "test-request-id" },
      });

      const mockClient = {
        queue: {
          status: jest.fn().mockResolvedValue({ status: "COMPLETED" }),
          result: jest.fn().mockResolvedValue({ data: { result: "test" } }),
        },
      };
      createFalClient.mockReturnValue(mockClient);

      const req = createMockRequest(
        "http://localhost:3000/api/fal?requestId=test-request-id",
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(mockClient.queue.status).toHaveBeenCalledWith("", {
        requestId: "test-request-id",
        logs: true,
      });
      expect(mockClient.queue.result).toHaveBeenCalledWith("", {
        requestId: "test-request-id",
      });
    });

    it("should handle in-progress status", async () => {
      const { withRateLimit, validateApiKeyUsage } = require("@/lib/security");
      const { validateURLParams } = require("@/lib/validation");
      const { createFalClient } = require("@fal-ai/client");

      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({ isValid: true });
      validateURLParams.mockReturnValue({
        success: true,
        data: { requestId: "test-request-id" },
      });

      const mockClient = {
        queue: {
          status: jest
            .fn()
            .mockResolvedValue({ status: "IN_PROGRESS", logs: [] }),
        },
      };
      createFalClient.mockReturnValue(mockClient);

      const req = createMockRequest(
        "http://localhost:3000/api/fal?requestId=test-request-id",
      );
      const response = await GET(req);

      expect(response.status).toBe(202);
      const responseData = await response.json();
      expect(responseData.status).toBe("IN_PROGRESS");
    });

    it("should handle missing FAL API key", async () => {
      delete process.env.FAL_KEY;

      const { withRateLimit, validateApiKeyUsage } = require("@/lib/security");
      const { validateURLParams } = require("@/lib/validation");

      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({ isValid: true });
      validateURLParams.mockReturnValue({
        success: true,
        data: { requestId: "test-request-id" },
      });

      const req = createMockRequest(
        "http://localhost:3000/api/fal?requestId=test-request-id",
      );
      const response = await GET(req);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe("API key is missing");
    });

    it("should handle client errors gracefully", async () => {
      const { withRateLimit, validateApiKeyUsage } = require("@/lib/security");
      const { validateURLParams } = require("@/lib/validation");
      const { createFalClient } = require("@fal-ai/client");

      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({ isValid: true });
      validateURLParams.mockReturnValue({
        success: true,
        data: { requestId: "test-request-id" },
      });

      const mockClient = {
        queue: {
          status: jest.fn().mockRejectedValue(new Error("Client error")),
        },
      };
      createFalClient.mockReturnValue(mockClient);

      const req = createMockRequest(
        "http://localhost:3000/api/fal?requestId=test-request-id",
      );
      const response = await GET(req);

      expect(response.status).toBe(202); // Should fall back to IN_PROGRESS
    });
  });

  describe("POST /api/fal", () => {
    it("should handle valid POST requests", async () => {
      const {
        withRateLimit,
        validateApiKeyUsage,
        addSecurityHeaders,
      } = require("@/lib/security");
      const { safeParseJSON } = require("@/lib/validation");
      const { createFalClient } = require("@fal-ai/client");

      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({ isValid: true });
      safeParseJSON.mockResolvedValue({
        success: true,
        data: { endpoint: "fal-ai/flux-pro", input: { prompt: "test" } },
      });

      const mockClient = {
        subscribe: jest.fn().mockResolvedValue({
          data: { images: [{ url: "https://example.com/image.jpg" }] },
        }),
      };
      createFalClient.mockReturnValue(mockClient);

      const req = createMockRequest("http://localhost:3000/api/fal", {
        method: "POST",
        body: JSON.stringify({
          endpoint: "fal-ai/flux-pro",
          input: { prompt: "test" },
        }),
      });

      const response = await POST(req);

      expect(response.status).toBe(200);
      expect(mockClient.subscribe).toHaveBeenCalledWith("fal-ai/flux-pro", {
        input: { prompt: "test" },
        logs: false,
        onQueueUpdate: undefined,
      });
      expect(addSecurityHeaders).toHaveBeenCalled();
    });

    it("should handle Veo2 endpoints specially", async () => {
      const { withRateLimit, validateApiKeyUsage } = require("@/lib/security");
      const { safeParseJSON } = require("@/lib/validation");
      const { createFalClient } = require("@fal-ai/client");

      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({ isValid: true });
      safeParseJSON.mockResolvedValue({
        success: true,
        data: { endpoint: "fal-ai/veo2", input: { prompt: "test video" } },
      });

      const mockClient = {
        queue: {
          submit: jest
            .fn()
            .mockResolvedValue({ request_id: "veo2-request-id" }),
        },
      };
      createFalClient.mockReturnValue(mockClient);

      const req = createMockRequest("http://localhost:3000/api/fal", {
        method: "POST",
        body: JSON.stringify({
          endpoint: "fal-ai/veo2",
          input: { prompt: "test video" },
        }),
      });

      const response = await POST(req);

      expect(response.status).toBe(202);
      expect(mockClient.queue.submit).toHaveBeenCalledWith("fal-ai/veo2", {
        input: { prompt: "test video" },
      });

      const responseData = await response.json();
      expect(responseData.requestId).toBe("veo2-request-id");
      expect(responseData.status).toBe("IN_PROGRESS");
    });

    it("should handle POST rate limiting", async () => {
      const { withRateLimit, addSecurityHeaders } = require("@/lib/security");

      const rateLimitResponse = new NextResponse("Rate limited", {
        status: 429,
      });
      withRateLimit.mockReturnValue(() => rateLimitResponse);

      const req = createMockRequest("http://localhost:3000/api/fal", {
        method: "POST",
      });
      const response = await POST(req);

      expect(response).toBe(rateLimitResponse);
      expect(addSecurityHeaders).toHaveBeenCalledWith(rateLimitResponse);
    });

    it("should handle validation errors", async () => {
      const { withRateLimit, validateApiKeyUsage } = require("@/lib/security");
      const { safeParseJSON } = require("@/lib/validation");

      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({ isValid: true });
      safeParseJSON.mockResolvedValue({
        success: false,
        error: "Missing required endpoint field",
      });

      const req = createMockRequest("http://localhost:3000/api/fal", {
        method: "POST",
        body: JSON.stringify({ invalid: "data" }),
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe("Missing required endpoint field");
    });

    it("should handle client subscribe errors", async () => {
      const { withRateLimit, validateApiKeyUsage } = require("@/lib/security");
      const { safeParseJSON } = require("@/lib/validation");
      const { createFalClient } = require("@fal-ai/client");

      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({ isValid: true });
      safeParseJSON.mockResolvedValue({
        success: true,
        data: { endpoint: "fal-ai/flux-pro", input: { prompt: "test" } },
      });

      const mockClient = {
        subscribe: jest.fn().mockRejectedValue(new Error("Client error")),
      };
      createFalClient.mockReturnValue(mockClient);

      const req = createMockRequest("http://localhost:3000/api/fal", {
        method: "POST",
        body: JSON.stringify({
          endpoint: "fal-ai/flux-pro",
          input: { prompt: "test" },
        }),
      });

      const response = await POST(req);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe(
        "Failed to process request with direct client",
      );
    });

    it("should fallback to server proxy when endpoint not specified", async () => {
      const { withRateLimit, validateApiKeyUsage } = require("@/lib/security");
      const { safeParseJSON } = require("@/lib/validation");
      const { route } = require("@fal-ai/server-proxy/nextjs");

      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({ isValid: true });
      safeParseJSON.mockResolvedValue({
        success: true,
        data: { input: { prompt: "test" } }, // No endpoint specified
      });

      route.POST.mockResolvedValue(
        new NextResponse(JSON.stringify({ result: "proxy" })),
      );

      const req = createMockRequest("http://localhost:3000/api/fal", {
        method: "POST",
        body: JSON.stringify({ input: { prompt: "test" } }),
      });

      const response = await POST(req);

      expect(route.POST).toHaveBeenCalledWith(req);
      expect(response).toBeInstanceOf(NextResponse);
    });

    it("should handle missing FAL API key in POST", async () => {
      delete process.env.FAL_KEY;

      const { withRateLimit, validateApiKeyUsage } = require("@/lib/security");
      const { safeParseJSON } = require("@/lib/validation");

      withRateLimit.mockReturnValue(() => null);
      validateApiKeyUsage.mockReturnValue({ isValid: true });
      safeParseJSON.mockResolvedValue({
        success: true,
        data: { endpoint: "fal-ai/flux-pro", input: { prompt: "test" } },
      });

      const req = createMockRequest("http://localhost:3000/api/fal", {
        method: "POST",
        body: JSON.stringify({
          endpoint: "fal-ai/flux-pro",
          input: { prompt: "test" },
        }),
      });

      const response = await POST(req);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe("API key is missing");
    });
  });

  describe("PUT /api/fal", () => {
    it("should handle PUT requests", async () => {
      const { withRateLimit, addSecurityHeaders } = require("@/lib/security");
      const { route } = require("@fal-ai/server-proxy/nextjs");

      withRateLimit.mockReturnValue(() => null);
      route.PUT.mockResolvedValue(
        new NextResponse(JSON.stringify({ updated: true })),
      );

      const req = createMockRequest("http://localhost:3000/api/fal", {
        method: "PUT",
      });
      const response = await PUT(req);

      expect(route.PUT).toHaveBeenCalledWith(req);
      expect(addSecurityHeaders).toHaveBeenCalled();
    });

    it("should handle PUT rate limiting", async () => {
      const { withRateLimit, addSecurityHeaders } = require("@/lib/security");

      const rateLimitResponse = new NextResponse("Rate limited", {
        status: 429,
      });
      withRateLimit.mockReturnValue(() => rateLimitResponse);

      const req = createMockRequest("http://localhost:3000/api/fal", {
        method: "PUT",
      });
      const response = await PUT(req);

      expect(response).toBe(rateLimitResponse);
      expect(addSecurityHeaders).toHaveBeenCalledWith(rateLimitResponse);
    });

    it("should handle PUT errors", async () => {
      const { withRateLimit } = require("@/lib/security");
      const { route } = require("@fal-ai/server-proxy/nextjs");

      withRateLimit.mockReturnValue(() => null);
      route.PUT.mockRejectedValue(new Error("PUT error"));

      const req = createMockRequest("http://localhost:3000/api/fal", {
        method: "PUT",
      });
      const response = await PUT(req);

      expect(response.status).toBe(500);
    });
  });

  describe("Error Handling", () => {
    it("should handle unexpected errors in GET", async () => {
      const { withRateLimit } = require("@/lib/security");

      withRateLimit.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const req = createMockRequest("http://localhost:3000/api/fal");
      const response = await GET(req);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe("Failed to process request");
    });

    it("should handle unexpected errors in POST", async () => {
      const { withRateLimit } = require("@/lib/security");

      withRateLimit.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const req = createMockRequest("http://localhost:3000/api/fal", {
        method: "POST",
      });
      const response = await POST(req);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe("Failed to process request");
    });
  });
});
