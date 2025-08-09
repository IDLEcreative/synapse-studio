# Development Guidelines

## Overview

This document establishes coding standards, best practices, and development workflows for the Synapse Studio project. All contributors should follow these guidelines to maintain code quality and consistency.

## Coding Standards

### TypeScript Guidelines

#### 1. Type Safety

```typescript
// ✅ GOOD: Explicit types
interface UserData {
  id: string;
  name: string;
  email: string;
}

function processUser(user: UserData): void {
  // Implementation
}

// ❌ BAD: Using 'any'
function processUser(user: any) {
  // Avoid 'any' type
}
```

#### 2. Strict Mode Rules

```typescript
// tsconfig.json enforces:
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

#### 3. Naming Conventions

```typescript
// Interfaces: PascalCase with 'I' prefix avoided
interface VideoProject { }  // ✅ Good
interface IVideoProject { } // ❌ Avoid

// Types: PascalCase
type MediaType = "image" | "video";

// Enums: PascalCase with UPPER_CASE values
enum Status {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED"
}

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 512 * 1024 * 1024;

// Functions/Variables: camelCase
const getUserData = () => { };
const isLoading = false;

// React Components: PascalCase
const VideoEditor = () => { };

// Hooks: camelCase with 'use' prefix
const useVideoPlayer = () => { };
```

### React Best Practices

#### 1. Component Structure

```typescript
// Standard component structure
import { useState, useEffect } from "react";
import { useVideoStore } from "@/data/store";
import { Button } from "@/components/ui/button";
import type { VideoProject } from "@/data/schema";

interface VideoEditorProps {
  project: VideoProject;
  onSave?: (project: VideoProject) => void;
}

export function VideoEditor({ project, onSave }: VideoEditorProps) {
  // 1. Hooks
  const [isEditing, setIsEditing] = useState(false);
  const { updateProject } = useVideoStore();
  
  // 2. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 3. Handlers
  const handleSave = () => {
    updateProject(project);
    onSave?.(project);
  };
  
  // 4. Render
  return (
    <div className="video-editor">
      {/* Component JSX */}
    </div>
  );
}
```

#### 2. Hook Rules

```typescript
// Custom hooks must start with 'use'
export function useGeneration(endpointId: string) {
  const [status, setStatus] = useState<Status>("idle");
  
  // Always call hooks at the top level
  useEffect(() => {
    // Effect logic
  }, [endpointId]);
  
  // Return consistent interface
  return {
    status,
    generate: async (input: any) => { },
    reset: () => setStatus("idle")
  };
}
```

#### 3. Performance Optimization

```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});

// Use useMemo for expensive computations
const processedData = useMemo(() => {
  return expensiveProcessing(rawData);
}, [rawData]);

// Use useCallback for stable function references
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### State Management Patterns

#### 1. Zustand Store Structure

```typescript
// Store slice pattern
interface VideoSlice {
  // State
  videos: Video[];
  selectedId: string | null;
  
  // Actions
  addVideo: (video: Video) => void;
  removeVideo: (id: string) => void;
  selectVideo: (id: string) => void;
}

// Create store with immer
const useStore = create<VideoSlice>()(
  immer((set) => ({
    videos: [],
    selectedId: null,
    
    addVideo: (video) => set((state) => {
      state.videos.push(video);
    }),
    
    removeVideo: (id) => set((state) => {
      state.videos = state.videos.filter(v => v.id !== id);
    }),
    
    selectVideo: (id) => set((state) => {
      state.selectedId = id;
    })
  }))
);
```

#### 2. React Query Patterns

```typescript
// Query hook pattern
export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!projectId
  });
}

// Mutation hook pattern
export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project", data.id] });
    },
    onError: (error) => {
      console.error("Failed to update project:", error);
    }
  });
}
```

### File Organization

#### 1. Directory Structure

```
src/
├── app/                 # Next.js app router
│   ├── (routes)/       # Route groups
│   ├── api/            # API routes
│   └── layout.tsx      # Root layout
├── components/         # React components
│   ├── ui/            # Generic UI components
│   ├── video/         # Video-specific components
│   └── providers/     # Context providers
├── data/              # Data layer
│   ├── schema.ts      # Type definitions
│   ├── store.ts       # Zustand store
│   ├── queries.ts     # Data fetching
│   └── mutations.ts   # Data mutations
├── lib/               # Utilities
│   ├── utils.ts       # General utilities
│   ├── fal.ts         # AI integration
│   └── validation.ts  # Input validation
└── hooks/             # Custom hooks
```

#### 2. Import Order

```typescript
// 1. React/Next.js imports
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. External libraries
import { z } from "zod";
import { format } from "date-fns";

// 3. Internal imports - absolute paths
import { Button } from "@/components/ui/button";
import { useVideoStore } from "@/data/store";

// 4. Types
import type { VideoProject } from "@/data/schema";

// 5. Styles (if any)
import styles from "./component.module.css";
```

### Code Quality Tools

#### 1. Biome Configuration

```json
// biome.json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 120
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error",
        "noConsoleLog": "warn"
      }
    }
  }
}
```

#### 2. Pre-commit Hooks

```bash
# Husky automatically runs:
- Code formatting (Biome)
- Type checking (TypeScript)
- Build verification
```

## Git Workflow

### Branch Strategy

```
main (production-ready)
├── develop (integration branch)
├── feature/[feature-name]
├── bugfix/[bug-description]
├── hotfix/[urgent-fix]
└── release/[version]
```

### Commit Message Convention

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat: New feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting, etc.)
refactor: Code refactoring
perf: Performance improvements
test: Test additions or fixes
chore: Build process or auxiliary tool changes

# Examples:
git commit -m "feat(video): add timeline zoom controls"
git commit -m "fix(auth): resolve session timeout issue"
git commit -m "docs(api): update endpoint documentation"
git commit -m "refactor(store): simplify state management"
```

### Pull Request Process

#### 1. PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Tested in different browsers
- [ ] Tested mobile responsiveness

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] All TypeScript errors resolved
```

#### 2. Review Guidelines

```typescript
// Code Review Checklist
interface ReviewCriteria {
  functionality: {
    worksAsExpected: boolean;
    handlesEdgeCases: boolean;
    hasProperErrorHandling: boolean;
  };
  
  codeQuality: {
    followsNamingConventions: boolean;
    hasProperTypes: boolean;
    noUnnecessaryComplexity: boolean;
    hasMeaningfulComments: boolean;
  };
  
  performance: {
    noUnnecessaryRenders: boolean;
    properMemoization: boolean;
    efficientAlgorithms: boolean;
  };
  
  security: {
    inputValidation: boolean;
    noSensitiveData: boolean;
    properAuthentication: boolean;
  };
}
```

## Development Environment

### Required Tools

```bash
# Node.js version (use nvm)
node --version  # v20.x or higher

# Package manager
npm --version   # 10.x or higher

# IDE Extensions (VS Code)
- TypeScript and JavaScript Language Features
- Biome
- Tailwind CSS IntelliSense
- GitLens
```

### Environment Variables

```bash
# .env.local (never commit)
# AI Services
FAL_KEY=your_fal_api_key

# Storage
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/synapse-studio.git
cd synapse-studio

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Run development server
npm run dev

# 5. Open browser
open http://localhost:3000
```

## Testing Guidelines

### Unit Testing Strategy

```typescript
// Test file structure: component.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { VideoEditor } from "./video-editor";

describe("VideoEditor", () => {
  it("should render without crashing", () => {
    render(<VideoEditor project={mockProject} />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
  
  it("should handle save action", () => {
    const onSave = jest.fn();
    render(<VideoEditor project={mockProject} onSave={onSave} />);
    
    fireEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith(mockProject);
  });
});
```

### Integration Testing

```typescript
// API integration test
describe("API Integration", () => {
  it("should generate content successfully", async () => {
    const response = await fetch("/api/fal", {
      method: "POST",
      body: JSON.stringify({
        endpointId: "fal-ai/flux-pro",
        input: { prompt: "test" }
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("requestId");
  });
});
```

### E2E Testing Approach

```typescript
// Playwright test example
import { test, expect } from "@playwright/test";

test("complete video creation flow", async ({ page }) => {
  // Navigate to app
  await page.goto("/");
  
  // Create new project
  await page.click("text=New Project");
  await page.fill("[name=title]", "Test Video");
  await page.click("text=Create");
  
  // Generate content
  await page.click("text=Generate");
  await page.fill("[name=prompt]", "Beautiful landscape");
  await page.click("text=Generate");
  
  // Wait for generation
  await page.waitForSelector(".generated-content");
  
  // Export video
  await page.click("text=Export");
  await expect(page.locator(".export-dialog")).toBeVisible();
});
```

## Performance Guidelines

### 1. Bundle Size Optimization

```typescript
// Use dynamic imports for large components
const HeavyComponent = dynamic(() => import("./heavy-component"), {
  loading: () => <Skeleton />,
  ssr: false
});

// Tree-shake imports
import { Button } from "@/components/ui/button"; // ✅
import * as UI from "@/components/ui";          // ❌
```

### 2. Render Optimization

```typescript
// Optimize re-renders
const VideoList = () => {
  // Use selector to avoid unnecessary re-renders
  const videos = useVideoStore((state) => state.videos);
  
  return (
    <VirtualList
      items={videos}
      renderItem={(video) => (
        <VideoItem key={video.id} video={video} />
      )}
    />
  );
};
```

### 3. Data Fetching Patterns

```typescript
// Parallel data fetching
export async function getPageData() {
  const [user, projects, media] = await Promise.all([
    fetchUser(),
    fetchProjects(),
    fetchMedia()
  ]);
  
  return { user, projects, media };
}
```

## Security Best Practices

### 1. Input Validation

```typescript
// Always validate user input
const schema = z.object({
  prompt: z.string().min(1).max(1000),
  url: z.string().url(),
  email: z.string().email()
});

export function validateInput(data: unknown) {
  return schema.safeParse(data);
}
```

### 2. API Security

```typescript
// Secure API routes
export async function POST(req: Request) {
  // 1. Authentication check
  const session = await getServerSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // 2. Rate limiting
  const rateLimitOk = await checkRateLimit(session.user.id);
  if (!rateLimitOk) {
    return new Response("Too Many Requests", { status: 429 });
  }
  
  // 3. Input validation
  const body = await req.json();
  const validated = validateInput(body);
  if (!validated.success) {
    return new Response("Bad Request", { status: 400 });
  }
  
  // 4. Process request
  // ...
}
```

### 3. Environment Variables

```typescript
// Never expose sensitive data to client
// ❌ BAD
const apiKey = process.env.API_KEY; // Exposed to client

// ✅ GOOD
// Server-only
const apiKey = process.env.API_KEY;

// Client-safe
const publicKey = process.env.NEXT_PUBLIC_APP_ID;
```

## Documentation Standards

### 1. Code Comments

```typescript
/**
 * Generates AI content using the specified model
 * @param endpointId - The AI model endpoint identifier
 * @param input - Model-specific input parameters
 * @returns Promise resolving to generation result
 * @throws {ApiError} When generation fails
 * @example
 * const result = await generate("fal-ai/flux-pro", {
 *   prompt: "A beautiful landscape"
 * });
 */
export async function generate(
  endpointId: string,
  input: GenerationInput
): Promise<GenerationResult> {
  // Implementation
}
```

### 2. README Files

Each major directory should have a README:

```markdown
# Component Name

## Purpose
Brief description of the component's purpose

## Usage
\`\`\`tsx
import { Component } from "./component";

<Component prop="value" />
\`\`\`

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| prop | string | Yes | Description |

## Examples
Link to usage examples
```

## Debugging Guidelines

### 1. Development Tools

```typescript
// Use debug utilities
import { logger } from "@/lib/logger";

logger.debug("Component rendered", { props });
logger.error("API call failed", error, { context });
```

### 2. Browser DevTools

```typescript
// Expose useful globals in development
if (process.env.NODE_ENV === "development") {
  window.__STORE__ = useVideoStore;
  window.__API__ = apiClient;
}
```

### 3. Performance Profiling

```typescript
// Use React DevTools Profiler
import { Profiler } from "react";

<Profiler id="VideoEditor" onRender={onRenderCallback}>
  <VideoEditor />
</Profiler>
```

## Release Process

### 1. Version Bumping

```bash
# Semantic versioning
npm version patch  # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor  # 1.0.0 -> 1.1.0 (new features)
npm version major  # 1.0.0 -> 2.0.0 (breaking changes)
```

### 2. Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] PR approved and merged
- [ ] Tagged release created
- [ ] Deployed to production
- [ ] Smoke tests completed