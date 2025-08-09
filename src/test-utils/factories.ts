import { nanoid } from "nanoid";

// Type definitions for our mock data
export interface MockUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockProject {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    resolution: { width: number; height: number };
    fps: number;
    duration: number;
    quality?: string;
  };
  metadata?: Record<string, any>;
}

export interface MockVideo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
  projectId: string;
  userId: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface MockGenerateRequest {
  id: string;
  endpoint: string;
  parameters: Record<string, any>;
  status: "pending" | "processing" | "completed" | "failed";
  userId: string;
  createdAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

// Factory functions
export const createMockUser = (
  overrides: Partial<MockUser> = {},
): MockUser => ({
  id: nanoid(),
  email: "test@example.com",
  name: "Test User",
  image: "https://example.com/avatar.jpg",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockProject = (
  overrides: Partial<MockProject> = {},
): MockProject => ({
  id: nanoid(),
  name: "Test Project",
  description: "A test project for video editing",
  userId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  settings: {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    duration: 30,
    quality: "high",
  },
  metadata: {},
  ...overrides,
});

export const createMockVideo = (
  overrides: Partial<MockVideo> = {},
): MockVideo => ({
  id: nanoid(),
  url: "https://example.com/video.mp4",
  thumbnailUrl: "https://example.com/thumbnail.jpg",
  duration: 30,
  width: 1920,
  height: 1080,
  size: 10 * 1024 * 1024, // 10MB
  format: "mp4",
  projectId: "project-1",
  userId: "user-1",
  createdAt: new Date(),
  metadata: {},
  ...overrides,
});

export const createMockGenerateRequest = (
  overrides: Partial<MockGenerateRequest> = {},
): MockGenerateRequest => ({
  id: nanoid(),
  endpoint: "fal-ai/flux-pro",
  parameters: {
    prompt: "A beautiful landscape",
    width: 1024,
    height: 1024,
  },
  status: "completed",
  userId: "user-1",
  createdAt: new Date(),
  completedAt: new Date(),
  result: {
    images: [
      {
        url: "https://example.com/generated-image.jpg",
        width: 1024,
        height: 1024,
      },
    ],
  },
  ...overrides,
});

// Batch factory functions
export const createMockUsers = (
  count: number,
  overrides: Partial<MockUser> = {},
): MockUser[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockUser({
      email: `user${index + 1}@example.com`,
      name: `User ${index + 1}`,
      ...overrides,
    }),
  );
};

export const createMockProjects = (
  count: number,
  userId?: string,
  overrides: Partial<MockProject> = {},
): MockProject[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockProject({
      name: `Project ${index + 1}`,
      userId: userId || "user-1",
      ...overrides,
    }),
  );
};

export const createMockVideos = (
  count: number,
  projectId?: string,
  overrides: Partial<MockVideo> = {},
): MockVideo[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockVideo({
      url: `https://example.com/video-${index + 1}.mp4`,
      projectId: projectId || "project-1",
      ...overrides,
    }),
  );
};

// Realistic data factories
export const createRealisticProject = (
  overrides: Partial<MockProject> = {},
): MockProject => {
  const projectTypes = [
    { name: "Marketing Video", description: "Product promotion video" },
    { name: "Tutorial Series", description: "Educational content" },
    {
      name: "Social Media Clips",
      description: "Short form content for social platforms",
    },
    { name: "Documentary", description: "Long form documentary project" },
  ];

  const randomType =
    projectTypes[Math.floor(Math.random() * projectTypes.length)];

  return createMockProject({
    name: randomType.name,
    description: randomType.description,
    settings: {
      resolution:
        Math.random() > 0.5
          ? { width: 1920, height: 1080 }
          : { width: 3840, height: 2160 },
      fps: Math.random() > 0.7 ? 60 : 30,
      duration: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
      quality: Math.random() > 0.5 ? "high" : "medium",
    },
    ...overrides,
  });
};

export const createRealisticVideo = (
  overrides: Partial<MockVideo> = {},
): MockVideo => {
  const formats = ["mp4", "mov", "avi", "mkv"];
  const resolutions = [
    { width: 1920, height: 1080 },
    { width: 3840, height: 2160 },
    { width: 1280, height: 720 },
    { width: 2560, height: 1440 },
  ];

  const randomFormat = formats[Math.floor(Math.random() * formats.length)];
  const randomResolution =
    resolutions[Math.floor(Math.random() * resolutions.length)];
  const randomDuration = Math.floor(Math.random() * 600) + 10; // 10-610 seconds
  const randomSize = Math.floor(Math.random() * 100) * 1024 * 1024; // Up to 100MB

  return createMockVideo({
    format: randomFormat,
    width: randomResolution.width,
    height: randomResolution.height,
    duration: randomDuration,
    size: randomSize,
    ...overrides,
  });
};

// Error scenarios for testing
export const createErrorScenarios = () => ({
  networkError: new Error("Network request failed"),
  timeoutError: new Error("Request timeout"),
  validationError: new Error("Invalid input data"),
  authError: new Error("Unauthorized"),
  rateLimitError: new Error("Too many requests"),
  serverError: new Error("Internal server error"),
});

// Test data sets
export const createTestDataSet = () => ({
  users: createMockUsers(5),
  projects: createMockProjects(10),
  videos: createMockVideos(20),
  generateRequests: Array.from({ length: 15 }, () =>
    createMockGenerateRequest(),
  ),
});

export const createLargeTestDataSet = () => ({
  users: createMockUsers(50),
  projects: createMockProjects(100),
  videos: createMockVideos(500),
  generateRequests: Array.from({ length: 200 }, () =>
    createMockGenerateRequest(),
  ),
});
