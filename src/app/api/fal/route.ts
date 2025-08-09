import { route } from "@fal-ai/server-proxy/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createFalClient } from "@fal-ai/client";
import {
  withRateLimit,
  addSecurityHeaders,
  validateApiKeyUsage,
} from "@/lib/security";
import {
  safeParseJSON,
  validateURLParams,
  falApiRequestSchema,
  falStatusRequestSchema,
} from "@/lib/validation";
import { logger } from "@/lib/logger";

// Enhanced route handlers with error handling
const enhancedRoute = () => {
  const { GET: originalGET, POST: originalPOST, PUT: originalPUT } = route;

  // Wrap the original handlers with error handling
  const GET = async (req: NextRequest) => {
    try {
      // Apply rate limiting (5 requests per minute for GET)
      const rateLimitResponse = withRateLimit(5, 60 * 1000)(req);
      if (rateLimitResponse) {
        return addSecurityHeaders(rateLimitResponse);
      }

      // Validate API key usage
      const keyValidation = validateApiKeyUsage(req);
      if (!keyValidation.isValid) {
        return addSecurityHeaders(
          new NextResponse(JSON.stringify({ error: keyValidation.error }), {
            status: 403,
          }),
        );
      }

      // Validate URL parameters
      const paramValidation = validateURLParams(
        req.url,
        falStatusRequestSchema.partial(),
      );
      if (!paramValidation.success) {
        return addSecurityHeaders(
          new NextResponse(JSON.stringify({ error: paramValidation.error }), {
            status: 400,
          }),
        );
      }

      const { requestId } = paramValidation.data;

      if (requestId) {
        // This is a request for a specific job status
        const apiKey = process.env.FAL_KEY; // Only use server-side key
        if (!apiKey) {
          logger.error("FAL API Key is missing", undefined, {
            operation: "fal_status_check",
          });
          return addSecurityHeaders(
            new NextResponse(
              JSON.stringify({ error: "API key is missing" }),
              { status: 500 }, // Changed to 500 as this is a server config issue
            ),
          );
        }

        // Create a direct client with the API key
        const directClient = createFalClient({
          credentials: apiKey,
        });

        try {
          // Try to get the result
          logger.debug("Checking status for request ID", {
            requestId,
            operation: "fal_status_check",
          });

          // First check the status to see if it's completed
          const status = await directClient.queue.status("", {
            requestId,
            logs: true,
          });
          logger.debug("Job status retrieved", {
            status: status.status,
            requestId,
            operation: "fal_status_check",
          });

          if (status.status === "COMPLETED") {
            // If completed, get the result
            logger.info("Job completed, fetching result", {
              requestId,
              operation: "fal_result_fetch",
            });
            const result = await directClient.queue.result("", { requestId });
            logger.info("Job result retrieved successfully", {
              requestId,
              operation: "fal_result_fetch",
            });
            const response = new NextResponse(JSON.stringify(result.data), {
              status: 200,
              headers: (req as any).rateLimitHeaders || {},
            });
            return addSecurityHeaders(response);
          } else {
            // If not completed, return the current status
            // Safely handle logs which might not exist on all status types
            const responseData: {
              status: string;
              requestId: string;
              logs?: Array<{ message: string; timestamp?: string }>;
            } = {
              status: status.status,
              requestId,
            };

            // Only include logs if they exist
            if ("logs" in status && status.logs) {
              responseData.logs = status.logs;
            }

            const response = new NextResponse(JSON.stringify(responseData), {
              status: 202,
              headers: (req as any).rateLimitHeaders || {},
            });
            return addSecurityHeaders(response);
          }
        } catch (error) {
          logger.error("Error checking job status", error, {
            requestId,
            operation: "fal_status_check",
          });
          // If there's an error, assume it's still in progress
          const response = new NextResponse(
            JSON.stringify({ status: "IN_PROGRESS", requestId }),
            {
              status: 202,
              headers: (req as any).rateLimitHeaders || {},
            },
          );
          return addSecurityHeaders(response);
        }
      }

      const response = await originalGET(req);
      return addSecurityHeaders(response);
    } catch (error) {
      logger.error("FAL API GET Error", error, { operation: "fal_get" });
      const response = new NextResponse(
        JSON.stringify({
          error: "Failed to process request",
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

  const POST = async (req: NextRequest) => {
    try {
      // Apply rate limiting (2 requests per minute for POST - AI calls are expensive)
      const rateLimitResponse = withRateLimit(2, 60 * 1000)(req);
      if (rateLimitResponse) {
        return addSecurityHeaders(rateLimitResponse);
      }

      // Validate API key usage
      const keyValidation = validateApiKeyUsage(req);
      if (!keyValidation.isValid) {
        return addSecurityHeaders(
          new NextResponse(JSON.stringify({ error: keyValidation.error }), {
            status: 403,
          }),
        );
      }

      // Parse and validate request body
      const bodyValidation = await safeParseJSON(req, falApiRequestSchema);
      if (!bodyValidation.success) {
        return addSecurityHeaders(
          new NextResponse(JSON.stringify({ error: bodyValidation.error }), {
            status: 400,
          }),
        );
      }

      const body = bodyValidation.data;
      logger.apiRequest(req.method, req.url, {
        endpoint: body.endpoint,
        inputKeys: Object.keys(body.input || {}),
        operation: "fal_api_request",
      });

      // Make sure the API key is available (server-side only)
      const apiKey = process.env.FAL_KEY; // Remove fallback to public key
      if (!apiKey) {
        logger.error("FAL API Key is missing", undefined, {
          operation: "fal_api_post",
        });
        return addSecurityHeaders(
          new NextResponse(
            JSON.stringify({ error: "API key is missing" }),
            { status: 500 }, // Server configuration error
          ),
        );
      }

      // Check if this is a request for a specific endpoint
      if (body.endpoint) {
        logger.debug("Processing FAL API endpoint", {
          endpoint: body.endpoint,
          operation: "fal_endpoint_request",
        });

        // Create a direct client with the API key
        const directClient = createFalClient({
          credentials: apiKey,
        });

        try {
          // Log the request for debugging (consolidated duplicate logs)
          logger.debug("FAL API Request details", {
            endpoint: body.endpoint,
            inputStructure: Object.keys(body.input || {}),
            operation: "fal_direct_client",
          });

          // Submit the request to the specified endpoint
          let result;

          // Special handling for Veo 2 endpoints
          if (
            body.endpoint === "fal-ai/veo2" ||
            body.endpoint === "fal-ai/veo2/image-to-video"
          ) {
            logger.info("Processing Veo 2 endpoint", {
              endpoint: body.endpoint,
              operation: "veo2_queue_submit",
            });

            // For Veo 2, we need to use queue.submit
            const queueResult = await directClient.queue.submit(body.endpoint, {
              input: body.input,
            });

            logger.info("Veo 2 queue submitted successfully", {
              requestId: queueResult.request_id,
              operation: "veo2_queue_submit",
            });

            // Return a standardized response
            const response = new NextResponse(
              JSON.stringify({
                requestId: queueResult.request_id,
                status: "IN_PROGRESS",
              }),
              {
                status: 202,
                headers: (req as any).rateLimitHeaders || {},
              },
            );
            return addSecurityHeaders(response);
          } else {
            // Use the standard format for other endpoints
            result = await directClient.subscribe(body.endpoint, {
              input: body.input,
              logs: body.logs || false,
              onQueueUpdate: undefined, // Not supported in server-side
            });
          }

          // Log the response for debugging
          logger.info("FAL API Response received", {
            operation: "fal_subscribe_response",
            hasData: !!result?.data,
          });

          // Return the result
          const response = new NextResponse(JSON.stringify(result.data), {
            status: 200,
            headers: (req as any).rateLimitHeaders || {},
          });
          return addSecurityHeaders(response);
        } catch (error) {
          logger.error("FAL API Direct Client Error", error, {
            endpoint: body.endpoint,
            operation: "fal_direct_client",
          });
          const response = new NextResponse(
            JSON.stringify({
              error: "Failed to process request with direct client",
              details: error instanceof Error ? error.message : String(error),
            }),
            {
              status: 500,
              headers: (req as any).rateLimitHeaders || {},
            },
          );
          return addSecurityHeaders(response);
        }
      }

      // Process the request using the server proxy
      const response = await originalPOST(req);

      // Log the response status for debugging
      logger.apiResponse(req.method, req.url, response.status, undefined, {
        operation: "fal_server_proxy",
      });

      // Add rate limit headers if available
      const headers = (req as any).rateLimitHeaders || {};
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value as string);
      });

      return addSecurityHeaders(response);
    } catch (error) {
      logger.error("FAL API POST Error", error, { operation: "fal_api_post" });
      const response = new NextResponse(
        JSON.stringify({
          error: "Failed to process request",
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

  const PUT = async (req: NextRequest) => {
    try {
      // Apply rate limiting for PUT requests
      const rateLimitResponse = withRateLimit(5, 60 * 1000)(req);
      if (rateLimitResponse) {
        return addSecurityHeaders(rateLimitResponse);
      }

      const response = await originalPUT(req);

      // Add rate limit headers if available
      const headers = (req as any).rateLimitHeaders || {};
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value as string);
      });

      return addSecurityHeaders(response);
    } catch (error) {
      logger.error("FAL API PUT Error", error, { operation: "fal_api_put" });
      const response = new NextResponse(
        JSON.stringify({
          error: "Failed to process request",
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

  return { GET, POST, PUT };
};

export const { GET, POST, PUT } = enhancedRoute();
