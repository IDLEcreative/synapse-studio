import { NextRequest, NextResponse } from "next/server";

/**
 * Media proxy API route to handle CORS issues with external media files.
 * This route fetches media from external domains server-side (where CORS doesn't apply)
 * and streams it back to the client with proper headers.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameters
    const url = new URL(request.url);
    const mediaUrl = url.searchParams.get("url");

    // Validate the URL
    if (!mediaUrl) {
      return new NextResponse(
        JSON.stringify({ error: "Missing 'url' parameter" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

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
      mediaUrlObj.hostname.endsWith(domain)
    );

    if (!isAllowedDomain) {
      return new NextResponse(
        JSON.stringify({
          error: "Proxying is only allowed for specific domains",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(`Proxying media from: ${mediaUrl}`);

    // Fetch the media from the external domain
    const response = await fetch(mediaUrl);

    if (!response.ok) {
      return new NextResponse(
        JSON.stringify({
          error: `Failed to fetch media: ${response.statusText}`,
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get the content type from the response
    const contentType = response.headers.get("Content-Type") || "application/octet-stream";
    
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
    
    // Stream the response back to the client
    const blob = await response.blob();
    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Media proxy error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to proxy media",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
