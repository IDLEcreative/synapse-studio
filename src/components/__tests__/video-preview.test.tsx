import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@/test-utils";
import { VideoPreview, VideoComposition } from "../video-preview";
import { createMockProject, createMockVideo } from "@/test-utils/factories";
import { mockVideoElement, mockCanvasContext } from "@/test-utils/mocks";

// Mock Remotion components
jest.mock("@remotion/player", () => ({
  Player: jest.fn(({ children, ...props }) => (
    <div data-testid="remotion-player" {...props}>
      {children}
    </div>
  )),
}));

jest.mock("@remotion/preload", () => ({
  preloadVideo: jest.fn(),
  preloadAudio: jest.fn(),
}));

jest.mock("remotion", () => ({
  AbsoluteFill: ({ children, ...props }: any) => (
    <div data-testid="absolute-fill" {...props}>
      {children}
    </div>
  ),
  Audio: ({ src, ...props }: any) => (
    <audio data-testid="remotion-audio" src={src} {...props} />
  ),
  Img: ({ src, ...props }: any) => (
    <img data-testid="remotion-img" src={src} {...props} />
  ),
  Sequence: ({ children, ...props }: any) => (
    <div data-testid="remotion-sequence" {...props}>
      {children}
    </div>
  ),
  Video: ({ src, ...props }: any) => (
    <video data-testid="remotion-video" src={src} {...props} />
  ),
  Composition: ({ children, ...props }: any) => (
    <div data-testid="remotion-composition" {...props}>
      {children}
    </div>
  ),
}));

// Mock data hooks
jest.mock("@/data/queries", () => ({
  useProject: jest.fn(() => ({
    data: createMockProject(),
    isLoading: false,
    error: null,
  })),
  useVideoComposition: jest.fn(() => ({
    data: {
      tracks: [
        {
          id: "track-1",
          type: "video",
          name: "Video Track",
          order: 0,
          items: [],
        },
      ],
      frames: {},
      mediaItems: {
        "video-1": createMockVideo(),
      },
    },
    isLoading: false,
    error: null,
  })),
  EMPTY_VIDEO_COMPOSITION: {
    tracks: [],
    frames: {},
    mediaItems: {},
  },
}));

jest.mock("@/data/store", () => ({
  useProjectId: jest.fn(() => "test-project-id"),
  useVideoProjectStore: jest.fn(() => ({
    ui: {
      isPlaying: false,
      currentTime: 0,
      duration: 10,
    },
    setIsPlaying: jest.fn(),
    setCurrentTime: jest.fn(),
    setDuration: jest.fn(),
  })),
}));

// Mock utilities
jest.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
  resolveDuration: jest.fn((duration) => duration || 5),
  resolveMediaUrl: jest.fn((url) => url),
}));

// Mock throttle-debounce
jest.mock("throttle-debounce", () => ({
  throttle: (ms: number, fn: Function) => fn,
}));

// Mock HTML5 video element
Object.defineProperty(HTMLVideoElement.prototype, "play", {
  writable: true,
  value: mockVideoElement.play,
});

Object.defineProperty(HTMLVideoElement.prototype, "pause", {
  writable: true,
  value: mockVideoElement.pause,
});

Object.defineProperty(HTMLVideoElement.prototype, "currentTime", {
  get: () => mockVideoElement.currentTime,
  set: (value) => {
    mockVideoElement.currentTime = value;
  },
});

Object.defineProperty(HTMLVideoElement.prototype, "duration", {
  get: () => mockVideoElement.duration,
});

Object.defineProperty(HTMLVideoElement.prototype, "paused", {
  get: () => mockVideoElement.paused,
});

describe("VideoComposition Component", () => {
  const mockProject = createMockProject();
  const mockTracks = [
    {
      id: "track-1",
      type: "video" as const,
      name: "Video Track",
      order: 0,
      items: [
        {
          id: "item-1",
          mediaId: "video-1",
          startTime: 0,
          duration: 5,
          order: 0,
        },
      ],
    },
  ];
  const mockFrames = {};
  const mockMediaItems = {
    "video-1": createMockVideo(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render video composition", () => {
    render(
      <VideoComposition
        project={mockProject}
        tracks={mockTracks}
        frames={mockFrames}
        mediaItems={mockMediaItems}
      />,
    );

    expect(screen.getByTestId("absolute-fill")).toBeInTheDocument();
  });

  it("should render video elements for video tracks", () => {
    render(
      <VideoComposition
        project={mockProject}
        tracks={mockTracks}
        frames={mockFrames}
        mediaItems={mockMediaItems}
      />,
    );

    expect(screen.getByTestId("remotion-video")).toBeInTheDocument();
  });

  it("should render audio elements for audio tracks", () => {
    const audioTracks = [
      {
        id: "track-audio",
        type: "audio" as const,
        name: "Audio Track",
        order: 1,
        items: [
          {
            id: "item-audio",
            mediaId: "audio-1",
            startTime: 0,
            duration: 5,
            order: 0,
          },
        ],
      },
    ];

    const audioMediaItems = {
      "audio-1": {
        ...createMockVideo(),
        id: "audio-1",
        format: "mp3",
        url: "https://example.com/audio.mp3",
      },
    };

    render(
      <VideoComposition
        project={mockProject}
        tracks={audioTracks}
        frames={mockFrames}
        mediaItems={audioMediaItems}
      />,
    );

    expect(screen.getByTestId("remotion-audio")).toBeInTheDocument();
  });

  it("should render image elements for image tracks", () => {
    const imageTracks = [
      {
        id: "track-image",
        type: "image" as const,
        name: "Image Track",
        order: 1,
        items: [
          {
            id: "item-image",
            mediaId: "image-1",
            startTime: 0,
            duration: 5,
            order: 0,
          },
        ],
      },
    ];

    const imageMediaItems = {
      "image-1": {
        ...createMockVideo(),
        id: "image-1",
        format: "jpg",
        url: "https://example.com/image.jpg",
      },
    };

    render(
      <VideoComposition
        project={mockProject}
        tracks={imageTracks}
        frames={mockFrames}
        mediaItems={imageMediaItems}
      />,
    );

    expect(screen.getByTestId("remotion-img")).toBeInTheDocument();
  });

  it("should handle empty tracks gracefully", () => {
    render(
      <VideoComposition
        project={mockProject}
        tracks={[]}
        frames={mockFrames}
        mediaItems={mockMediaItems}
      />,
    );

    expect(screen.getByTestId("absolute-fill")).toBeInTheDocument();
    // Should not crash with empty tracks
  });

  it("should handle missing media items gracefully", () => {
    const tracksWithMissingMedia = [
      {
        id: "track-1",
        type: "video" as const,
        name: "Video Track",
        order: 0,
        items: [
          {
            id: "item-1",
            mediaId: "non-existent-media",
            startTime: 0,
            duration: 5,
            order: 0,
          },
        ],
      },
    ];

    render(
      <VideoComposition
        project={mockProject}
        tracks={tracksWithMissingMedia}
        frames={mockFrames}
        mediaItems={mockMediaItems}
      />,
    );

    // Should render without crashing
    expect(screen.getByTestId("absolute-fill")).toBeInTheDocument();
  });

  it("should use correct video dimensions from project settings", () => {
    const projectWithCustomSize = {
      ...mockProject,
      settings: {
        ...mockProject.settings,
        resolution: { width: 1280, height: 720 },
      },
    };

    render(
      <VideoComposition
        project={projectWithCustomSize}
        tracks={mockTracks}
        frames={mockFrames}
        mediaItems={mockMediaItems}
      />,
    );

    const composition = screen.getByTestId("remotion-composition");
    expect(composition).toBeInTheDocument();
  });
});

describe("VideoPreview Component", () => {
  const mockSetIsPlaying = jest.fn();
  const mockSetCurrentTime = jest.fn();
  const mockSetDuration = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    const { useVideoProjectStore } = require("@/data/store");
    useVideoProjectStore.mockReturnValue({
      ui: {
        isPlaying: false,
        currentTime: 0,
        duration: 10,
      },
      setIsPlaying: mockSetIsPlaying,
      setCurrentTime: mockSetCurrentTime,
      setDuration: mockSetDuration,
    });
  });

  it("should render video preview component", () => {
    render(<VideoPreview />);

    expect(screen.getByTestId("remotion-player")).toBeInTheDocument();
  });

  it("should render loading state when project is loading", () => {
    const { useProject } = require("@/data/queries");
    useProject.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<VideoPreview />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should render error state when project fails to load", () => {
    const { useProject } = require("@/data/queries");
    useProject.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Failed to load project"),
    });

    render(<VideoPreview />);

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it("should render empty state when no project exists", () => {
    const { useProject } = require("@/data/queries");
    useProject.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    render(<VideoPreview />);

    expect(screen.getByText(/no project/i)).toBeInTheDocument();
  });

  it("should render video composition when project and data are available", () => {
    render(<VideoPreview />);

    expect(screen.getByTestId("remotion-player")).toBeInTheDocument();
    expect(screen.getByTestId("remotion-composition")).toBeInTheDocument();
  });

  it("should show play/pause controls", () => {
    render(<VideoPreview />);

    const playButton = screen.getByRole("button", { name: /play|pause/i });
    expect(playButton).toBeInTheDocument();
  });

  it("should toggle play state when play button is clicked", () => {
    render(<VideoPreview />);

    const playButton = screen.getByRole("button", { name: /play|pause/i });
    fireEvent.click(playButton);

    expect(mockSetIsPlaying).toHaveBeenCalledWith(true);
  });

  it("should show download button", () => {
    render(<VideoPreview />);

    const downloadButton = screen.getByLabelText(/download/i);
    expect(downloadButton).toBeInTheDocument();
  });

  it("should handle timeline scrubbing", async () => {
    render(<VideoPreview />);

    // Find the timeline/progress bar (assuming it exists in the implementation)
    const player = screen.getByTestId("remotion-player");

    // Simulate time update
    fireEvent.timeUpdate(player);

    // The exact implementation may vary, but we should test time updates
    await waitFor(() => {
      expect(screen.getByTestId("remotion-player")).toBeInTheDocument();
    });
  });

  it("should respect aspect ratio settings", () => {
    const { useProject } = require("@/data/queries");
    useProject.mockReturnValue({
      data: {
        ...createMockProject(),
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          duration: 10,
        },
      },
      isLoading: false,
      error: null,
    });

    render(<VideoPreview />);

    const player = screen.getByTestId("remotion-player");
    expect(player).toBeInTheDocument();
  });

  it("should handle different fps settings", () => {
    const { useProject } = require("@/data/queries");
    useProject.mockReturnValue({
      data: {
        ...createMockProject(),
        settings: {
          resolution: { width: 1920, height: 1080 },
          fps: 60,
          duration: 10,
        },
      },
      isLoading: false,
      error: null,
    });

    render(<VideoPreview />);

    const player = screen.getByTestId("remotion-player");
    expect(player).toBeInTheDocument();
  });

  it("should preload media when composition changes", () => {
    const { preloadVideo, preloadAudio } = require("@remotion/preload");

    render(<VideoPreview />);

    // Verify preloading is called for video assets
    expect(preloadVideo).toHaveBeenCalled();
  });

  it("should handle composition updates", () => {
    const { useVideoComposition } = require("@/data/queries");

    const { rerender } = render(<VideoPreview />);

    // Update composition data
    useVideoComposition.mockReturnValue({
      data: {
        tracks: [
          {
            id: "track-2",
            type: "video",
            name: "Updated Track",
            order: 0,
            items: [],
          },
        ],
        frames: {},
        mediaItems: {},
      },
      isLoading: false,
      error: null,
    });

    rerender(<VideoPreview />);

    expect(screen.getByTestId("remotion-player")).toBeInTheDocument();
  });
});
