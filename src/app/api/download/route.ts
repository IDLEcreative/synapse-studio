import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, addSecurityHeaders } from "@/lib/security";
import { validateURLParams, downloadRequestSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export const GET = async (req: NextRequest) => {
  try {
    // Apply rate limiting (10 downloads per minute)
    const rateLimitResponse = withRateLimit(10, 60 * 1000)(req);
    if (rateLimitResponse) {
      return addSecurityHeaders(rateLimitResponse);
    }

    // Validate URL parameters
    const paramValidation = validateURLParams(req.url, downloadRequestSchema);
    if (!paramValidation.success) {
      return addSecurityHeaders(
        new NextResponse(JSON.stringify({ error: paramValidation.error }), {
          status: 400,
          headers: (req as any).rateLimitHeaders || {},
        }),
      );
    }

    const { url } = paramValidation.data;

    // Additional security check: only allow certain domains/schemes
    const parsedUrl = new URL(url);
    const allowedProtocols = ["https:", "http:"];
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return addSecurityHeaders(
        new NextResponse(JSON.stringify({ error: "Invalid URL protocol" }), {
          status: 400,
          headers: (req as any).rateLimitHeaders || {},
        }),
      );
    }

    // Block private IP ranges and localhost
    const hostname = parsedUrl.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1";
    const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(
      hostname,
    );

    if (isLocalhost || isPrivateIP) {
      return addSecurityHeaders(
        new NextResponse(
          JSON.stringify({
            error: "Access to private/local resources not allowed",
          }),
          {
            status: 403,
            headers: (req as any).rateLimitHeaders || {},
          },
        ),
      );
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "Synapse-Studio/1.0",
      },
      // Set a timeout to prevent long-hanging requests
      signal: AbortSignal.timeout(30000), // 30 seconds
    });

    if (!response.ok) {
      return addSecurityHeaders(
        new NextResponse(
          JSON.stringify({
            error: `Download failed: ${response.status} ${response.statusText}`,
          }),
          {
            status: 502,
            headers: (req as any).rateLimitHeaders || {},
          },
        ),
      );
    }

    // Clone the response and add rate limit headers
    const clonedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    // Add rate limit headers
    const rateLimitHeaders = (req as any).rateLimitHeaders || {};
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      clonedResponse.headers.set(key, value as string);
    });

    return addSecurityHeaders(clonedResponse);
  } catch (error) {
    let errorMessage = "Failed to download file";
    let status = 500;

    if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage = "Network error or invalid URL";
      status = 502;
      logger.warn("Download network error", { operation: "download_api" });
    } else if (error instanceof DOMException && error.name === "TimeoutError") {
      errorMessage = "Download timeout";
      status = 504;
      logger.warn("Download timeout", { operation: "download_api" });
    } else {
      logger.error("Download API Error", error, { operation: "download_api" });
    }

    const response = new NextResponse(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status,
        headers: (req as any).rateLimitHeaders || {},
      },
    );
    return addSecurityHeaders(response);
  }
};
