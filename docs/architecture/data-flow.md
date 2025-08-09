# Data Flow & Integration Architecture

## Overview

This document describes how data flows through Synapse Studio, including request/response patterns, event flows, data transformations, and integration points with external services.

## Primary Data Flow Diagram

```plantuml
@startuml
!theme aws-orange
title Synapse Studio - Main Data Flow

actor User
participant "Browser" as browser
participant "Next.js App" as nextjs
participant "API Routes" as api
database "IndexedDB" as indexdb
participant "Zustand Store" as store
participant "fal.ai" as fal
participant "Storage" as storage

== User Interaction Flow ==
User -> browser: Interact with UI
browser -> nextjs: React Event
nextjs -> store: Update State
store -> nextjs: State Change
nextjs -> browser: Re-render UI

== AI Generation Flow ==
User -> browser: Generate Content
browser -> api: POST /api/fal
api -> api: Rate Limit Check
api -> api: Validate Input
api -> fal: Submit Job
fal -> api: Job ID
api -> browser: Return Job ID
browser -> store: Store Job ID

loop Poll for Status
    browser -> api: GET /api/fal?requestId=X
    api -> fal: Check Status
    fal -> api: Job Status
    api -> browser: Status Update
end

fal -> api: Completed Result
api -> browser: Final Result
browser -> storage: Upload Result
storage -> browser: File URL
browser -> indexdb: Store Metadata
browser -> store: Update State

== File Upload Flow ==
User -> browser: Select File
browser -> api: POST /api/uploadthing
api -> storage: Upload File
storage -> api: File URL
api -> browser: Return URL
browser -> indexdb: Store Reference
browser -> store: Update Media Gallery
@enduml
```

## Component Interaction Flow

```plantuml
@startuml
!theme aws-orange
title Component-Level Data Flow

package "UI Layer" {
    [Header] as header
    [LeftPanel] as left
    [VideoPreview] as preview
    [RightPanel] as right
    [BottomBar] as bottom
}

package "State Layer" {
    [Zustand Store] as store
    [React Query] as query
}

package "Data Layer" {
    [IndexedDB] as idb
    [Mutations] as mutations
    [Queries] as queries
}

package "API Layer" {
    [fal Route] as fal_api
    [Upload Route] as upload_api
    [Auth Route] as auth_api
}

header --> store: Read auth state
left --> store: Read/Write project
preview --> store: Read media state
right --> store: Write generation params
bottom --> store: Read/Write timeline

store <--> mutations: Execute mutations
store <--> queries: Fetch data
query <--> fal_api: AI operations
query <--> upload_api: File operations

mutations --> idb: Write data
queries --> idb: Read data

auth_api --> store: Update auth
@enduml
```

## Detailed Data Flow Scenarios

### 1. Video Generation Flow

```plantuml
@startuml
!theme aws-orange
title Video Generation Data Flow

participant "User" as user
participant "RightPanel" as ui
participant "Store" as store
participant "API" as api
participant "fal.ai" as fal
participant "Storage" as storage
participant "IndexedDB" as idb

user -> ui: Enter prompt
ui -> store: setGenerateData({prompt})
user -> ui: Click Generate
ui -> api: POST /api/fal\n{prompt, model, params}

api -> api: Validate request
api -> api: Check rate limit
api -> fal: Submit generation job
fal -> api: Return job_id
api -> ui: {requestId: job_id}

ui -> store: Add pending media item
store -> idb: Store media metadata

loop Poll every 1s
    ui -> api: GET /api/fal?requestId=job_id
    api -> fal: Get job status
    alt Job Running
        fal -> api: {status: "IN_PROGRESS"}
        api -> ui: Status update
        ui -> store: Update progress
    else Job Complete
        fal -> api: {status: "COMPLETED", output}
        api -> ui: Final result
        ui -> storage: Upload video
        storage -> ui: Video URL
        ui -> store: Update media item
        store -> idb: Update with URL
        ui -> user: Show generated video
    else Job Failed
        fal -> api: {status: "FAILED", error}
        api -> ui: Error message
        ui -> store: Mark as failed
        ui -> user: Show error
    end
end
@enduml
```

### 2. Project Save/Load Flow

```plantuml
@startuml
!theme aws-orange
title Project Data Persistence Flow

participant "User" as user
participant "UI" as ui
participant "Store" as store
participant "Mutations" as mut
participant "IndexedDB" as idb
participant "Storage" as storage

== Save Project ==
user -> ui: Edit project
ui -> store: Update state
store -> mut: saveProject()
mut -> idb: Begin transaction

mut -> idb: Update project record
mut -> idb: Update tracks
mut -> idb: Update keyframes
mut -> idb: Update media items
mut -> idb: Commit transaction

mut -> store: Confirm save
store -> ui: Show success

== Load Project ==
user -> ui: Open project
ui -> store: setProjectId(id)
store -> mut: loadProject(id)
mut -> idb: Query project

idb -> mut: Project data
mut -> idb: Query tracks
idb -> mut: Tracks data
mut -> idb: Query keyframes
idb -> mut: Keyframes data
mut -> idb: Query media
idb -> mut: Media data

mut -> mut: Assemble project
mut -> store: Set all data
store -> ui: Render project

loop For each media item
    ui -> storage: Fetch media URL
    storage -> ui: Return media
    ui -> ui: Preload media
end
@enduml
```

### 3. Authentication Flow

```plantuml
@startuml
!theme aws-orange
title Authentication Data Flow

participant "User" as user
participant "Browser" as browser
participant "SignIn Page" as signin
participant "NextAuth" as auth
participant "API" as api
participant "Store" as store
participant "Protected Route" as protected

== Sign In Flow ==
user -> browser: Navigate to app
browser -> protected: Request page
protected -> auth: Check session
auth -> protected: No session
protected -> browser: Redirect to /auth/signin

browser -> signin: Load sign in page
user -> signin: Enter credentials
signin -> api: POST /api/auth/signin
api -> auth: Validate credentials
auth -> api: Create JWT
api -> browser: Set cookie
browser -> store: Update auth state
store -> browser: Redirect to app

== Session Check Flow ==
browser -> protected: Request protected page
protected -> auth: getServerSession()
auth -> auth: Verify JWT
auth -> protected: Valid session
protected -> browser: Render page

== Sign Out Flow ==
user -> browser: Click sign out
browser -> api: POST /api/auth/signout
api -> auth: Destroy session
auth -> browser: Clear cookie
browser -> store: Clear auth state
store -> browser: Redirect to home
@enduml
```

## Data Transformation Pipeline

### 1. Input Processing

```typescript
// Input validation and transformation
interface InputPipeline {
  // 1. Raw user input
  rawInput: any;
  
  // 2. Validation
  validated: z.infer<typeof inputSchema>;
  
  // 3. Sanitization
  sanitized: {
    prompt: string; // XSS cleaned
    params: Record<string, any>; // Type coerced
  };
  
  // 4. Normalization
  normalized: {
    endpointId: string;
    input: ModelSpecificInput;
  };
}
```

### 2. API Response Transformation

```typescript
// API response processing pipeline
interface ResponsePipeline {
  // 1. Raw API response
  raw: unknown;
  
  // 2. Type validation
  validated: z.infer<typeof responseSchema>;
  
  // 3. Data mapping
  mapped: {
    id: string;
    status: Status;
    output?: MediaOutput;
    error?: ErrorDetail;
  };
  
  // 4. UI-ready data
  formatted: MediaItem;
}
```

### 3. Storage Format Transformation

```typescript
// Storage format transformations
interface StorageTransform {
  // IndexedDB format
  indexedDB: {
    id: string;
    projectId: string;
    data: Uint8Array; // Compressed
    metadata: object;
    timestamp: number;
  };
  
  // Cloud storage format
  cloud: {
    url: string;
    contentType: string;
    size: number;
    metadata: Record<string, string>;
  };
  
  // Runtime format
  runtime: {
    id: string;
    url: string;
    blob?: Blob;
    cached: boolean;
  };
}
```

## Integration Points

### 1. fal.ai Integration

```plantuml
@startuml
!theme aws-orange
title fal.ai Integration Architecture

package "Synapse Studio" {
    [API Route] as api
    [fal Client] as client
    [Rate Limiter] as limiter
    [Validator] as validator
}

package "fal.ai Service" {
    [API Gateway] as gateway
    [Model Router] as router
    [GPU Cluster] as gpu
    [Storage] as fal_storage
}

api --> limiter: Check limits
limiter --> validator: Validate input
validator --> client: Create request

client -> gateway: HTTPS Request
gateway -> router: Route to model
router -> gpu: Execute inference
gpu -> fal_storage: Store result
fal_storage -> gateway: Return URL
gateway -> client: Response
client -> api: Process result
@enduml
```

### 2. Supabase Integration

```plantuml
@startuml
!theme aws-orange
title Supabase Storage Integration

package "Synapse Studio" {
    [Upload Component] as upload
    [Supabase Client] as client
    [Auth Middleware] as auth
}

package "Supabase" {
    [Storage API] as storage_api
    [CDN] as cdn
    [Bucket] as bucket
    [Policies] as policies
}

upload -> auth: Check permissions
auth -> client: Authorized request
client -> storage_api: Upload file

storage_api -> policies: Check access
policies -> bucket: Write file
bucket -> cdn: Replicate
cdn -> storage_api: CDN URL
storage_api -> client: Return URL
client -> upload: Success
@enduml
```

## Event Flow Patterns

### 1. User Interaction Events

```typescript
// Event flow from UI to state
interface EventFlow {
  // User action
  userEvent: MouseEvent | KeyboardEvent;
  
  // React handler
  componentHandler: (e: Event) => void;
  
  // State action
  storeAction: (payload: any) => void;
  
  // Side effects
  effects: {
    api?: Promise<Response>;
    storage?: Promise<void>;
    analytics?: void;
  };
  
  // UI update
  rerender: () => void;
}
```

### 2. Real-time Updates

```typescript
// Polling-based real-time updates
interface RealtimeFlow {
  // Initial request
  startPolling: (jobId: string) => void;
  
  // Polling interval
  interval: NodeJS.Timer;
  
  // Status check
  checkStatus: () => Promise<JobStatus>;
  
  // Update handler
  onUpdate: (status: JobStatus) => void;
  
  // Completion
  onComplete: (result: any) => void;
  
  // Cleanup
  stopPolling: () => void;
}
```

## Data Consistency Patterns

### 1. Optimistic Updates

```typescript
// Optimistic update pattern
async function optimisticUpdate(action: Action) {
  // 1. Update UI immediately
  store.update(action.optimisticData);
  
  try {
    // 2. Perform actual operation
    const result = await api.execute(action);
    
    // 3. Reconcile with server response
    store.reconcile(result);
  } catch (error) {
    // 4. Rollback on failure
    store.rollback(action);
    throw error;
  }
}
```

### 2. Cache Invalidation

```typescript
// Cache invalidation strategy
interface CacheStrategy {
  // Time-based invalidation
  ttl: number; // seconds
  
  // Event-based invalidation
  invalidateOn: string[]; // event names
  
  // Manual invalidation
  invalidate: () => void;
  
  // Validation
  isStale: () => boolean;
}
```

## Error Handling Flow

```plantuml
@startuml
!theme aws-orange
title Error Handling Flow

participant "Component" as comp
participant "Error Boundary" as boundary
participant "Store" as store
participant "Logger" as logger
participant "UI" as ui

comp -> comp: Operation fails
comp -> boundary: Throw error

boundary -> logger: Log error
logger -> logger: Capture context
logger -> logger: Send to monitoring

boundary -> store: Set error state
store -> ui: Trigger error UI

alt Recoverable Error
    ui -> ui: Show retry option
    ui -> comp: Retry operation
else Fatal Error
    ui -> ui: Show error page
    ui -> ui: Provide support info
end
@enduml
```

## Performance Considerations

### 1. Data Loading Strategies

- **Lazy Loading**: Load data only when needed
- **Prefetching**: Anticipate user actions
- **Pagination**: Load data in chunks
- **Virtual Scrolling**: Render only visible items

### 2. Caching Layers

```typescript
// Multi-layer caching
interface CacheLayers {
  // L1: Component state
  component: Map<string, any>;
  
  // L2: Zustand store
  store: StateCache;
  
  // L3: React Query
  query: QueryCache;
  
  // L4: IndexedDB
  local: IDBCache;
  
  // L5: CDN
  cdn: URLCache;
}
```

### 3. Bundle Optimization

- **Code Splitting**: Dynamic imports for large components
- **Tree Shaking**: Remove unused code
- **Minification**: Compress JavaScript
- **Compression**: Gzip/Brotli for network transfer

## Monitoring & Observability

### 1. Data Flow Metrics

```typescript
// Key metrics to monitor
interface DataFlowMetrics {
  // Latency metrics
  apiLatency: number; // ms
  dbLatency: number; // ms
  renderLatency: number; // ms
  
  // Throughput metrics
  requestsPerSecond: number;
  dataTransferRate: number; // MB/s
  
  // Error metrics
  errorRate: number; // percentage
  failedRequests: number;
  
  // Resource metrics
  cacheHitRate: number; // percentage
  memoryUsage: number; // MB
}
```

### 2. Tracing Strategy

- Request ID propagation through all layers
- Timing information at each step
- Error context capture
- User session correlation