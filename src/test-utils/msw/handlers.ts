import { http, HttpResponse } from "msw";
import {
  mockFalResponse,
  mockProject,
  mockUser,
  mockVideoData,
} from "../mocks";

export const handlers = [
  // Auth endpoints
  http.get("/api/auth/session", () => {
    return HttpResponse.json({
      user: mockUser,
      expires: "2024-12-31T23:59:59.999Z",
    });
  }),

  http.post("/api/auth/signin", () => {
    return HttpResponse.json({ user: mockUser });
  }),

  http.post("/api/auth/signout", () => {
    return HttpResponse.json({ success: true });
  }),

  // Fal.ai API endpoints
  http.post("/api/fal/*", async ({ request, params }) => {
    const body = await request.json();

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return HttpResponse.json({
      ...mockFalResponse,
      request_id: `test-${Date.now()}`,
    });
  }),

  // UploadThing endpoints
  http.post("/api/uploadthing", async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    return HttpResponse.json({
      data: [
        {
          key: "test-upload-key",
          name: file?.name || "test-file.mp4",
          size: file?.size || 1024,
          url: `https://utfs.io/f/test-upload-key`,
          customId: null,
          type: file?.type || "video/mp4",
        },
      ],
    });
  }),

  // Project API endpoints
  http.get("/api/projects", () => {
    return HttpResponse.json([mockProject]);
  }),

  http.post("/api/projects", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockProject,
      ...body,
      id: `project-${Date.now()}`,
    });
  }),

  http.get("/api/projects/:id", ({ params }) => {
    return HttpResponse.json({
      ...mockProject,
      id: params.id,
    });
  }),

  http.put("/api/projects/:id", async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockProject,
      ...body,
      id: params.id,
    });
  }),

  http.delete("/api/projects/:id", () => {
    return HttpResponse.json({ success: true });
  }),

  // Video API endpoints
  http.get("/api/videos", () => {
    return HttpResponse.json([mockVideoData]);
  }),

  http.post("/api/videos", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...mockVideoData,
      ...body,
      id: `video-${Date.now()}`,
    });
  }),

  http.get("/api/videos/:id", ({ params }) => {
    return HttpResponse.json({
      ...mockVideoData,
      id: params.id,
    });
  }),

  http.delete("/api/videos/:id", () => {
    return HttpResponse.json({ success: true });
  }),

  // Rate limiting endpoint (for testing)
  http.get("/api/rate-limit", () => {
    return HttpResponse.json({
      remaining: 100,
      reset: Date.now() + 3600000, // 1 hour
    });
  }),

  // External API mocks
  http.get("https://api.fal.ai/models", () => {
    return HttpResponse.json([
      {
        id: "fal-ai/flux-pro",
        name: "Flux Pro",
        description: "High-quality image generation",
      },
      {
        id: "fal-ai/flux-dev",
        name: "Flux Dev",
        description: "Fast image generation",
      },
    ]);
  }),

  // Supabase Storage mock
  http.post(
    "https://*.supabase.co/storage/v1/object/*",
    async ({ request }) => {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      return HttpResponse.json({
        Key: `uploads/${file?.name || "test-file.mp4"}`,
        path: `uploads/${file?.name || "test-file.mp4"}`,
      });
    },
  ),

  http.post("https://*.supabase.co/storage/v1/object/sign/*", () => {
    return HttpResponse.json({
      signedURL: "https://example.com/signed-url",
    });
  }),

  // Error scenarios for testing
  http.post("/api/test/error", () => {
    return new HttpResponse(null, { status: 500 });
  }),

  http.post("/api/test/timeout", async () => {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    return HttpResponse.json({ success: true });
  }),

  http.post("/api/test/rate-limit", () => {
    return new HttpResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
      },
    });
  }),
];

export { handlers as mockHandlers };
