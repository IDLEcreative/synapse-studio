// Export test utilities
export * from "./render";
export * from "./mocks";

// Custom test helpers
export const waitForElement = async (
  callback: () => Promise<any>,
  timeout = 5000,
) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const result = await callback();
      if (result) return result;
    } catch (error) {
      // Continue waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timeout waiting for element after ${timeout}ms`);
};

export const mockFile = (name: string, size: number, type: string) => {
  const file = new File([""], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

export const mockVideoFile = (name = "test-video.mp4", size = 1024 * 1024) =>
  mockFile(name, size, "video/mp4");

export const mockImageFile = (name = "test-image.jpg", size = 512 * 1024) =>
  mockFile(name, size, "image/jpeg");

// Helper to create mock store state
export const createMockStoreState = (overrides = {}) => ({
  projects: [],
  currentProject: null,
  videos: [],
  currentVideo: null,
  isLoading: false,
  error: null,
  settings: {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    quality: "high",
  },
  ui: {
    leftPanelOpen: true,
    rightPanelOpen: true,
    isPlaying: false,
    currentTime: 0,
    selectedTool: "select",
  },
  ...overrides,
});
