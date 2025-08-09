import { IS_SHARE_ENABLED, shareVideo, ShareVideoParams } from "@/lib/share";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, addSecurityHeaders } from "@/lib/security";
import { safeParseJSON, shareRequestSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

/**
 * API route for sharing videos.
 * Using Edge Runtime for faster global response times and reduced latency.
 */
export const runtime = "edge";

export const POST = async (req: NextRequest) => {
  try {
    // Apply rate limiting (3 shares per minute)
    const rateLimitResponse = withRateLimit(3, 60 * 1000)(req);
    if (rateLimitResponse) {
      return addSecurityHeaders(rateLimitResponse);
    }

    if (!IS_SHARE_ENABLED) {
      return addSecurityHeaders(
        NextResponse.json(
          { error: "Sharing is disabled" },
          {
            status: 503,
            headers: (req as any).rateLimitHeaders || {},
          },
        ),
      );
    }

    // Validate request body
    const bodyValidation = await safeParseJSON(req, shareRequestSchema);
    if (!bodyValidation.success) {
      return addSecurityHeaders(
        new NextResponse(JSON.stringify({ error: bodyValidation.error }), {
          status: 400,
          headers: (req as any).rateLimitHeaders || {},
        }),
      );
    }

    const payload = bodyValidation.data as unknown as ShareVideoParams;
    const id = await shareVideo({
      ...payload,
      createdAt: Date.now(),
    });

    const response = NextResponse.json(
      {
        id,
        params: payload,
      },
      {
        headers: (req as any).rateLimitHeaders || {},
      },
    );

    return addSecurityHeaders(response);
  } catch (error) {
    logger.error("Share API Error", error, { operation: "share_video" });
    const response = new NextResponse(
      JSON.stringify({
        error: "Failed to share video",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: (req as any).rateLimitHeaders || {},
      },
    );
    return addSecurityHeaders(response);
  }
};
