import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, addSecurityHeaders } from "@/lib/security";
import { validateURLParams, mediaProxyRequestSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

/**
 * Media proxy API route to handle CORS issues with external media files.
 * This route fetches media from external domains server-side (where CORS doesn't apply)
 * and streams it back to the client with proper headers.
 *
 * Using Edge Runtime for faster global response times and reduced latency.
 */
export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (20 requests per minute for media proxy)
    const rateLimitResponse = withRateLimit(20, 60 * 1000)(request);
    if (rateLimitResponse) {
      return addSecurityHeaders(rateLimitResponse);
    }

    // Validate URL parameters
    const paramValidation = validateURLParams(
      request.url,
      mediaProxyRequestSchema,
    );
    if (!paramValidation.success) {
      return addSecurityHeaders(
        new NextResponse(JSON.stringify({ error: paramValidation.error }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...((request as any).rateLimitHeaders || {}),
          },
        }),
      );
    }

    const { url: mediaUrl } = paramValidation.data;

    // Only allow proxying from specific domains for security
    const allowedDomains = [
      "fal.media",
      "v2.fal.media",
      "v3.fal.media",
      "cdn.fal.ai",
      "storage.googleapis.com",
      "replicate.delivery",
      "pbxt.replicate.delivery",
    ];

    const mediaUrlObj = new URL(mediaUrl);
    const isAllowedDomain = allowedDomains.some((domain) =>
      mediaUrlObj.hostname.endsWith(domain),
    );

    if (!isAllowedDomain) {
      return addSecurityHeaders(
        new NextResponse(
          JSON.stringify({
            error: "Proxying is only allowed for specific domains",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              ...((request as any).rateLimitHeaders || {}),
            },
          },
        ),
      );
    }

    logger.debug("Proxying media request", {
      mediaUrl,
      operation: "media_proxy",
    });

    // Fetch the media from the external domain
    const response = await fetch(mediaUrl, {
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
            error: `Failed to fetch media: ${response.statusText}`,
          }),
          {
            status: response.status,
            headers: {
              "Content-Type": "application/json",
              ...((request as any).rateLimitHeaders || {}),
            },
          },
        ),
      );
    }

    // Get the content type from the response
    const contentType =
      response.headers.get("Content-Type") || "application/octet-stream";

    // Get the content length if available
    const contentLength = response.headers.get("Content-Length");

    // Create headers for the response
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    // Add cache control headers for better performance
    headers.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours

    // Add rate limit headers
    const rateLimitHeaders = (request as any).rateLimitHeaders || {};
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      headers.set(key, value as string);
    });

    // Stream the response back to the client
    const blob = await response.blob();
    const finalResponse = new NextResponse(blob, {
      status: 200,
      headers,
    });

    return addSecurityHeaders(finalResponse);
  } catch (error) {
    let errorMessage = "Failed to proxy media";
    let status = 500;

    if (error instanceof DOMException && error.name === "TimeoutError") {
      errorMessage = "Media fetch timeout";
      status = 504;
      logger.warn("Media proxy timeout", { operation: "media_proxy" });
    } else {
      logger.error("Media proxy error", error, { operation: "media_proxy" });
    }

    const response = new NextResponse(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status,
        headers: {
          "Content-Type": "application/json",
          ...((request as any).rateLimitHeaders || {}),
        },
      },
    );
    return addSecurityHeaders(response);
  }
}
