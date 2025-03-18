import { route } from "@fal-ai/server-proxy/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createFalClient } from "@fal-ai/client";

// Enhanced route handlers with error handling
const enhancedRoute = () => {
  const { GET: originalGET, POST: originalPOST, PUT: originalPUT } = route;

  // Wrap the original handlers with error handling
  const GET = async (req: NextRequest) => {
    try {
      // Check if this is a request for a specific requestId
      const url = new URL(req.url);
      const requestId = url.searchParams.get("requestId");
      
      if (requestId) {
        // This is a request for a specific job status
        const apiKey = process.env.FAL_KEY || process.env.NEXT_PUBLIC_FAL_KEY;
        if (!apiKey) {
          console.error("FAL API Key is missing");
          return new NextResponse(
            JSON.stringify({ error: "API key is missing" }),
            { status: 401 },
          );
        }

        // Create a direct client with the API key
        const directClient = createFalClient({
          credentials: apiKey,
        });

        try {
          // Try to get the result
          const result = await directClient.queue.result("", { requestId });
          return new NextResponse(JSON.stringify(result.data), { status: 200 });
        } catch (error) {
          // If the result is not ready yet, return a 202 status
          return new NextResponse(
            JSON.stringify({ status: "IN_PROGRESS", requestId }),
            { status: 202 },
          );
        }
      }

      return await originalGET(req);
    } catch (error) {
      console.error("FAL API GET Error:", error);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to process request",
          details: error instanceof Error ? error.message : String(error),
        }),
        { status: 500 },
      );
    }
  };

  const POST = async (req: NextRequest) => {
    try {
      // Log the request for debugging
      const clonedReq = req.clone();
      const body = await clonedReq.json().catch((error) => {
        console.error("Error parsing request body:", error);
        return {};
      });
      console.log("FAL API Request:", {
        url: req.url,
        method: req.method,
        body: JSON.stringify(body, null, 2),
      });

      // Make sure the API key is available
      const apiKey = process.env.FAL_KEY || process.env.NEXT_PUBLIC_FAL_KEY;
      if (!apiKey) {
        console.error("FAL API Key is missing");
        return new NextResponse(
          JSON.stringify({ error: "API key is missing" }),
          { status: 401 },
        );
      }

      // Check if this is a request for a specific endpoint
      if (body.endpoint) {
        console.log("FAL API Endpoint:", body.endpoint);
        
        // Create a direct client with the API key
        const directClient = createFalClient({
          credentials: apiKey,
        });

        try {
          // Log the request for debugging
          console.log("FAL API Request to endpoint:", body.endpoint);
          console.log("FAL API Request input:", JSON.stringify(body.input, null, 2));
          
          // Submit the request to the specified endpoint
          const result = await directClient.subscribe(body.endpoint, {
            input: body.input,
            logs: body.logs || false,
            onQueueUpdate: undefined, // Not supported in server-side
          });

          // Log the response for debugging
          console.log("FAL API Response:", JSON.stringify(result.data, null, 2));

          // Return the result
          return new NextResponse(JSON.stringify(result.data), { status: 200 });
        } catch (error) {
          console.error("FAL API Direct Client Error:", error);
          return new NextResponse(
            JSON.stringify({
              error: "Failed to process request with direct client",
              details: error instanceof Error ? error.message : String(error),
            }),
            { status: 500 },
          );
        }
      }

      // Process the request using the server proxy
      const response = await originalPOST(req);

      // Log the response status for debugging
      console.log("FAL API Response Status:", response.status);

      return response;
    } catch (error) {
      console.error("FAL API POST Error:", error);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to process request",
          details: error instanceof Error ? error.message : String(error),
        }),
        { status: 500 },
      );
    }
  };

  const PUT = async (req: NextRequest) => {
    try {
      return await originalPUT(req);
    } catch (error) {
      console.error("FAL API PUT Error:", error);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to process request",
          details: error instanceof Error ? error.message : String(error),
        }),
        { status: 500 },
      );
    }
  };

  return { GET, POST, PUT };
};

export const { GET, POST, PUT } = enhancedRoute();
