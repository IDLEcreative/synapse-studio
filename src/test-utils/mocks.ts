import { jest } from "@jest/globals";

// Mock data for testing
export const mockUser = {
  id: "1",
  email: "test@example.com",
  name: "Test User",
  image: "https://example.com/avatar.jpg",
};

export const mockProject = {
  id: "project-1",
  name: "Test Project",
  description: "A test project",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  userId: "1",
  settings: {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    duration: 10,
  },
};

export const mockVideoData = {
  id: "video-1",
  url: "https://example.com/video.mp4",
  thumbnailUrl: "https://example.com/thumbnail.jpg",
  duration: 10,
  width: 1920,
  height: 1080,
  size: 1024 * 1024, // 1MB
  format: "mp4",
  createdAt: new Date("2024-01-01"),
  projectId: "project-1",
};

export const mockFalResponse = {
  request_id: "test-request-id",
  status: "completed",
  video: {
    url: "https://example.com/generated-video.mp4",
    content_type: "video/mp4",
    file_name: "generated-video.mp4",
    file_size: 1024 * 1024,
    width: 1920,
    height: 1080,
    duration: 10,
  },
};

// Mock functions
export const mockFetch = jest.fn();
export const mockPush = jest.fn();
export const mockReplace = jest.fn();
export const mockBack = jest.fn();

// Mock Next.js hooks
export const mockUseRouter = () => ({
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  pathname: "/",
  query: {},
  asPath: "/",
  prefetch: jest.fn() as any,
});

// Mock Supabase client
export const mockSupabase: any = {
  auth: {
    getUser: (jest.fn() as any).mockResolvedValue({ data: { user: mockUser } }),
    signIn: (jest.fn() as any).mockResolvedValue({ data: { user: mockUser } }),
    signOut: (jest.fn() as any).mockResolvedValue({ error: null }),
  },
  storage: {
    from: jest.fn(() => ({
      upload: (jest.fn() as any).mockResolvedValue({
        data: { path: "uploads/test-file.mp4" },
        error: null,
      }),
      createSignedUrl: (jest.fn() as any).mockResolvedValue({
        data: { signedUrl: "https://example.com/signed-url" },
        error: null,
      }),
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: (jest.fn() as any).mockResolvedValue({
      data: mockProject,
      error: null,
    }),
    then: (jest.fn() as any).mockResolvedValue([mockProject]),
  })),
};

// Mock fal.ai client
export const mockFal = {
  subscribe: jest.fn().mockImplementation((endpoint, options) => ({
    on: jest.fn((event, callback) => {
      if (event === "result") {
        setTimeout(() => (callback as any)(mockFalResponse), 100);
      }
    }),
  })),
  run: (jest.fn() as any).mockResolvedValue(mockFalResponse),
};

// Mock IndexedDB
export const mockIDB: any = {
  openDB: (jest.fn() as any).mockResolvedValue({
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue({
        add: jest.fn().mockResolvedValue("test-id"),
        put: jest.fn().mockResolvedValue("test-id"),
        get: jest.fn().mockResolvedValue(mockProject),
        delete: jest.fn().mockResolvedValue(undefined),
        getAll: jest.fn().mockResolvedValue([mockProject]),
      }),
    }),
    close: jest.fn(),
  }),
};

// Mock video element
export const mockVideoElement = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  currentTime: 0,
  duration: 10,
  paused: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

// Mock canvas context
export const mockCanvasContext = {
  drawImage: jest.fn(),
  getImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  }),
  putImageData: jest.fn(),
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  lineTo: jest.fn(),
  moveTo: jest.fn(),
};

// Reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  mockFetch.mockClear();
  mockPush.mockClear();
  mockReplace.mockClear();
  mockBack.mockClear();
};
