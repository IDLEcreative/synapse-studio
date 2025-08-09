import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@/test-utils";
import { RightPanel } from "../right-panel";
import {
  createMockProject,
  createMockUser,
  createMockVideo,
} from "@/test-utils/factories";

// Mock the data store and hooks
jest.mock("@/data/store", () => ({
  useProjectId: jest.fn(() => "test-project-id"),
  useVideoProjectStore: jest.fn(() => ({
    mediaType: "video",
    generateData: {
      prompt: "",
      aspectRatio: "16:9",
      duration: "5s",
      endpoint: "fal-ai/flux-pro",
    },
    updateGenerateData: jest.fn(),
    setMediaType: jest.fn(),
    ui: {
      rightPanelOpen: true,
      isGenerating: false,
    },
    toggleRightPanel: jest.fn(),
    setIsGenerating: jest.fn(),
  })),
}));

jest.mock("@/data/queries", () => ({
  useProject: jest.fn(() => ({
    data: createMockProject(),
    isLoading: false,
    error: null,
  })),
  useProjectMediaItems: jest.fn(() => ({
    data: [createMockVideo()],
    isLoading: false,
    error: null,
  })),
  queryKeys: {
    project: jest.fn(),
    projectMediaItems: jest.fn(),
  },
}));

jest.mock("@/data/mutations", () => ({
  useJobCreator: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  })),
}));

jest.mock("@/lib/uploadthing", () => ({
  useUploadThing: jest.fn(() => ({
    startUpload: jest.fn(),
    isUploading: false,
    error: null,
  })),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
    dismiss: jest.fn(),
  })),
}));

// Mock Remotion components
jest.mock("@remotion/player", () => ({
  Player: ({ children, ...props }: any) => (
    <div data-testid="remotion-player" {...props}>
      {children}
    </div>
  ),
}));

// Mock complex child components
jest.mock("../media-panel", () => ({
  MediaItemRow: ({ item }: { item: any }) => (
    <div data-testid="media-item-row">{item.name}</div>
  ),
}));

jest.mock("../camera-control", () => {
  const CameraMovement = () => (
    <div data-testid="camera-control">Camera Controls</div>
  );
  CameraMovement.displayName = "CameraMovement";
  return CameraMovement;
});

// Mock UI components that might have complex implementations
jest.mock("../ui/tooltip", () => ({
  WithTooltip: ({ children }: { children: React.ReactNode }) => children,
  Tooltip: ({ children }: { children: React.ReactNode }) => children,
  TooltipContent: ({ children }: { children: React.ReactNode }) => children,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => children,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => children,
}));

describe("RightPanel Component", () => {
  const mockUpdateGenerateData = jest.fn();
  const mockSetMediaType = jest.fn();
  const mockToggleRightPanel = jest.fn();
  const mockJobCreator = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks for each test
    const { useVideoProjectStore } = require("@/data/store");
    useVideoProjectStore.mockReturnValue({
      mediaType: "video",
      generateData: {
        prompt: "",
        aspectRatio: "16:9",
        duration: "5s",
        endpoint: "fal-ai/flux-pro",
      },
      updateGenerateData: mockUpdateGenerateData,
      setMediaType: mockSetMediaType,
      ui: {
        rightPanelOpen: true,
        isGenerating: false,
      },
      toggleRightPanel: mockToggleRightPanel,
      setIsGenerating: jest.fn(),
    });

    const { useJobCreator } = require("@/data/mutations");
    useJobCreator.mockReturnValue({
      mutate: mockJobCreator,
      isPending: false,
      error: null,
    });
  });

  it("should render right panel when open", () => {
    render(<RightPanel />);

    // The component should render without crashing
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  });

  it("should not render when panel is closed", () => {
    const { useVideoProjectStore } = require("@/data/store");
    useVideoProjectStore.mockReturnValue({
      mediaType: "video",
      generateData: {
        prompt: "",
        aspectRatio: "16:9",
        duration: "5s",
        endpoint: "fal-ai/flux-pro",
      },
      updateGenerateData: mockUpdateGenerateData,
      setMediaType: mockSetMediaType,
      ui: {
        rightPanelOpen: false,
        isGenerating: false,
      },
      toggleRightPanel: mockToggleRightPanel,
      setIsGenerating: jest.fn(),
    });

    const { container } = render(<RightPanel />);
    expect(container.firstChild).toBeNull();
  });

  it("should render media type tabs", () => {
    render(<RightPanel />);

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByText("Video")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
    expect(screen.getByText("Audio")).toBeInTheDocument();
  });

  it("should update media type when tab is clicked", () => {
    render(<RightPanel />);

    const imageTab = screen.getByText("Image");
    fireEvent.click(imageTab);

    expect(mockSetMediaType).toHaveBeenCalledWith("image");
  });

  it("should render prompt textarea", () => {
    render(<RightPanel />);

    const promptInput = screen.getByPlaceholderText(
      /describe what you want to create/i,
    );
    expect(promptInput).toBeInTheDocument();
  });

  it("should update prompt when typed", async () => {
    render(<RightPanel />);

    const promptInput = screen.getByPlaceholderText(
      /describe what you want to create/i,
    );

    fireEvent.change(promptInput, { target: { value: "A beautiful sunset" } });

    await waitFor(() => {
      expect(mockUpdateGenerateData).toHaveBeenCalledWith({
        prompt: "A beautiful sunset",
      });
    });
  });

  it("should render model selector", () => {
    render(<RightPanel />);

    // Look for the select trigger
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should render aspect ratio controls for video", () => {
    render(<RightPanel />);

    // Should show aspect ratio controls for video generation
    expect(screen.getByText("16:9")).toBeInTheDocument();
    expect(screen.getByText("9:16")).toBeInTheDocument();
    expect(screen.getByText("1:1")).toBeInTheDocument();
  });

  it("should update aspect ratio when clicked", () => {
    render(<RightPanel />);

    const aspectRatioButton = screen.getByText("9:16");
    fireEvent.click(aspectRatioButton);

    expect(mockUpdateGenerateData).toHaveBeenCalledWith({
      aspectRatio: "9:16",
    });
  });

  it("should render duration controls for video", () => {
    render(<RightPanel />);

    expect(screen.getByText("5s")).toBeInTheDocument();
    expect(screen.getByText("10s")).toBeInTheDocument();
  });

  it("should update duration when clicked", () => {
    render(<RightPanel />);

    const durationButton = screen.getByText("10s");
    fireEvent.click(durationButton);

    expect(mockUpdateGenerateData).toHaveBeenCalledWith({
      duration: "10s",
    });
  });

  it("should show generate button", () => {
    render(<RightPanel />);

    const generateButton = screen.getByRole("button", { name: /generate/i });
    expect(generateButton).toBeInTheDocument();
  });

  it("should disable generate button when prompt is empty", () => {
    render(<RightPanel />);

    const generateButton = screen.getByRole("button", { name: /generate/i });
    expect(generateButton).toBeDisabled();
  });

  it("should enable generate button when prompt is provided", () => {
    const { useVideoProjectStore } = require("@/data/store");
    useVideoProjectStore.mockReturnValue({
      mediaType: "video",
      generateData: {
        prompt: "A beautiful sunset",
        aspectRatio: "16:9",
        duration: "5s",
        endpoint: "fal-ai/flux-pro",
      },
      updateGenerateData: mockUpdateGenerateData,
      setMediaType: mockSetMediaType,
      ui: {
        rightPanelOpen: true,
        isGenerating: false,
      },
      toggleRightPanel: mockToggleRightPanel,
      setIsGenerating: jest.fn(),
    });

    render(<RightPanel />);

    const generateButton = screen.getByRole("button", { name: /generate/i });
    expect(generateButton).toBeEnabled();
  });

  it("should show loading state when generating", () => {
    const { useVideoProjectStore } = require("@/data/store");
    useVideoProjectStore.mockReturnValue({
      mediaType: "video",
      generateData: {
        prompt: "A beautiful sunset",
        aspectRatio: "16:9",
        duration: "5s",
        endpoint: "fal-ai/flux-pro",
      },
      updateGenerateData: mockUpdateGenerateData,
      setMediaType: mockSetMediaType,
      ui: {
        rightPanelOpen: true,
        isGenerating: true,
      },
      toggleRightPanel: mockToggleRightPanel,
      setIsGenerating: jest.fn(),
    });

    const { useJobCreator } = require("@/data/mutations");
    useJobCreator.mockReturnValue({
      mutate: mockJobCreator,
      isPending: true,
      error: null,
    });

    render(<RightPanel />);

    expect(screen.getByText(/generating/i)).toBeInTheDocument();
  });

  it("should call job creator when generate button is clicked", () => {
    const { useVideoProjectStore } = require("@/data/store");
    useVideoProjectStore.mockReturnValue({
      mediaType: "video",
      generateData: {
        prompt: "A beautiful sunset",
        aspectRatio: "16:9",
        duration: "5s",
        endpoint: "fal-ai/flux-pro",
      },
      updateGenerateData: mockUpdateGenerateData,
      setMediaType: mockSetMediaType,
      ui: {
        rightPanelOpen: true,
        isGenerating: false,
      },
      toggleRightPanel: mockToggleRightPanel,
      setIsGenerating: jest.fn(),
    });

    render(<RightPanel />);

    const generateButton = screen.getByRole("button", { name: /generate/i });
    fireEvent.click(generateButton);

    expect(mockJobCreator).toHaveBeenCalled();
  });

  it("should render close button", () => {
    render(<RightPanel />);

    const closeButton = screen.getByLabelText(/close right panel/i);
    expect(closeButton).toBeInTheDocument();
  });

  it("should call toggle function when close button is clicked", () => {
    render(<RightPanel />);

    const closeButton = screen.getByLabelText(/close right panel/i);
    fireEvent.click(closeButton);

    expect(mockToggleRightPanel).toHaveBeenCalled();
  });

  it("should render media items when available", () => {
    render(<RightPanel />);

    // Should render media items from the mock
    expect(screen.getByTestId("media-item-row")).toBeInTheDocument();
  });

  it("should handle different media types correctly", () => {
    const { useVideoProjectStore } = require("@/data/store");

    // Test image media type
    useVideoProjectStore.mockReturnValue({
      mediaType: "image",
      generateData: {
        prompt: "",
        aspectRatio: "1:1",
        endpoint: "fal-ai/flux-pro",
      },
      updateGenerateData: mockUpdateGenerateData,
      setMediaType: mockSetMediaType,
      ui: {
        rightPanelOpen: true,
        isGenerating: false,
      },
      toggleRightPanel: mockToggleRightPanel,
      setIsGenerating: jest.fn(),
    });

    render(<RightPanel />);

    // Should not show video-specific controls
    expect(screen.queryByText("5s")).not.toBeInTheDocument();
  });
});
