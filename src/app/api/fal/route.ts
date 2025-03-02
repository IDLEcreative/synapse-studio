import { route } from "@fal-ai/server-proxy/nextjs";
import { NextRequest, NextResponse } from "next/server";

// Enhanced route handlers with error handling
const enhancedRoute = () => {
  const { GET: originalGET, POST: originalPOST, PUT: originalPUT } = route;

  // Wrap the original handlers with error handling
  const GET = async (req: NextRequest) => {
    try {
      return await originalGET(req);
    } catch (error) {
      console.error("FAL API GET Error:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to process request", details: error instanceof Error ? error.message : String(error) }),
        { status: 500 }
      );
    }
  };

  const POST = async (req: NextRequest) => {
    try {
      // Log the request for debugging
      const clonedReq = req.clone();
      const body = await clonedReq.json().catch(() => ({}));
      console.log("FAL API Request:", {
        url: req.url,
        method: req.method,
        body: JSON.stringify(body),
      });

      // Make sure the API key is available
      const apiKey = process.env.FAL_KEY || process.env.NEXT_PUBLIC_FAL_KEY;
      if (!apiKey) {
        console.error("FAL API Key is missing");
        return new NextResponse(
          JSON.stringify({ error: "API key is missing" }),
          { status: 401 }
        );
      }

      // Process the request
      const response = await originalPOST(req);
      
      // Log the response status for debugging
      console.log("FAL API Response Status:", response.status);
      
      return response;
    } catch (error) {
      console.error("FAL API POST Error:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to process request", details: error instanceof Error ? error.message : String(error) }),
        { status: 500 }
      );
    }
  };

  const PUT = async (req: NextRequest) => {
    try {
      return await originalPUT(req);
    } catch (error) {
      console.error("FAL API PUT Error:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to process request", details: error instanceof Error ? error.message : String(error) }),
        { status: 500 }
      );
    }
  };

  return { GET, POST, PUT };
};

export const { GET, POST, PUT } = enhancedRoute();
