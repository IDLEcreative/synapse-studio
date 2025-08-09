# System Architecture

## Overview

Synapse Studio is a modern, browser-based AI video editing platform built with a microservices-oriented architecture using Next.js 15, React 18, and various AI services.

## High-Level Architecture Diagram (C4 - Context)

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

title Synapse Studio - System Context Diagram

Person(user, "Content Creator", "Creates and edits videos using AI")
System(synapse, "Synapse Studio", "AI-powered video editing platform")

System_Ext(fal, "fal.ai", "AI model inference service")
System_Ext(supabase, "Supabase", "File storage and database")
System_Ext(uploadthing, "UploadThing", "File upload service")
System_Ext(auth, "NextAuth", "Authentication service")
System_Ext(vercel, "Vercel", "Hosting and analytics")

Rel(user, synapse, "Creates videos", "HTTPS")
Rel(synapse, fal, "Generates AI content", "HTTPS/API")
Rel(synapse, supabase, "Stores media files", "HTTPS/API")
Rel(synapse, uploadthing, "Uploads files", "HTTPS/API")
Rel(synapse, auth, "Authenticates users", "HTTPS")
Rel(synapse, vercel, "Hosts application", "HTTPS")
@enduml
```

## Container Architecture (C4 - Container)

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

title Synapse Studio - Container Diagram

Person(user, "User", "Content Creator")

System_Boundary(synapse, "Synapse Studio") {
    Container(webapp, "Web Application", "Next.js 15, React 18", "Provides video editing UI")
    Container(api, "API Routes", "Next.js API", "Handles backend logic")
    Container(worker, "Background Workers", "Web Workers", "Processes video rendering")
    ContainerDb(indexdb, "IndexedDB", "Browser Storage", "Stores project data locally")
    Container(state, "State Management", "Zustand", "Manages application state")
}

System_Ext(fal, "fal.ai API", "AI Models")
System_Ext(storage, "Cloud Storage", "Supabase/UploadThing")

Rel(user, webapp, "Uses", "HTTPS")
Rel(webapp, api, "Makes API calls", "HTTP/JSON")
Rel(webapp, state, "Reads/Writes state")
Rel(webapp, indexdb, "Stores data")
Rel(api, fal, "Generates content", "HTTPS/API")
Rel(api, storage, "Stores files", "HTTPS/API")
Rel(webapp, worker, "Offloads processing")
@enduml
```

## Component Architecture (C4 - Component)

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

title Synapse Studio - Component Diagram (Web Application)

Container_Boundary(webapp, "Web Application") {
    Component(router, "App Router", "Next.js 15", "Handles routing and pages")
    Component(ui, "UI Components", "React/shadcn", "Reusable UI elements")
    Component(video, "Video Components", "React/Remotion", "Video editing interface")
    Component(ai, "AI Components", "React", "AI model interfaces")
    Component(auth_comp, "Auth Components", "NextAuth", "Authentication UI")
    Component(hooks, "Custom Hooks", "React Hooks", "Shared logic")
    Component(store, "Zustand Store", "State Management", "Global state")
    Component(queries, "React Query", "Data Fetching", "Server state")
}

Rel(router, ui, "Renders")
Rel(router, video, "Renders")
Rel(router, ai, "Renders")
Rel(ui, hooks, "Uses")
Rel(video, store, "Updates")
Rel(ai, queries, "Fetches data")
Rel(auth_comp, store, "Updates auth state")
@enduml
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15.2.3 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (Oxide engine)
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Zustand 5
- **Data Fetching**: TanStack React Query 5
- **Video Processing**: Remotion 4
- **Forms**: React Hook Form

### Backend
- **Runtime**: Node.js (via Next.js)
- **API**: Next.js Route Handlers
- **Authentication**: NextAuth v4
- **File Storage**: Supabase / UploadThing
- **AI Integration**: fal.ai client
- **Rate Limiting**: Custom middleware

### Infrastructure
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics
- **KV Store**: Vercel KV (Redis)
- **Client Storage**: IndexedDB

### Development Tools
- **Package Manager**: npm
- **Code Quality**: Biome (formatting/linting)
- **Git Hooks**: Husky
- **Bundle Analysis**: Next.js Bundle Analyzer

## Key Architectural Patterns

### 1. Component-Based Architecture
```typescript
// Example: Modular component structure
src/components/
├── ui/           // Generic UI components
├── video/        // Video-specific components
├── flux-pro/     // AI model-specific components
└── providers/    // Context providers
```

### 2. Server-Side Rendering (SSR)
- Next.js App Router for optimal performance
- Server Components for reduced client bundle
- Dynamic imports for code splitting

### 3. API Gateway Pattern
```typescript
// All external API calls go through Next.js API routes
src/app/api/
├── fal/          // AI model proxy
├── auth/         // Authentication
└── uploadthing/  // File uploads
```

### 4. State Management Pattern
```typescript
// Centralized state with Zustand
const useVideoStore = create<VideoProjectState>()(
  immer((set) => ({
    // State properties
    projectId: "",
    // Actions
    setProjectId: (id) => set((state) => {
      state.projectId = id;
    })
  }))
);
```

### 5. Repository Pattern
```typescript
// Data access layer abstraction
src/data/
├── schema.ts     // Type definitions
├── queries.ts    // Read operations
├── mutations.ts  // Write operations
└── db.ts         // Database client
```

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- External session storage (JWT)
- CDN for static assets
- Serverless functions for API routes

### Performance Optimization
- React.lazy() for route-based splitting
- Image optimization with Next.js Image
- Suspense boundaries for loading states
- Web Workers for heavy processing

### Caching Strategy
- Vercel Edge caching for static assets
- React Query caching for API responses
- IndexedDB for offline project data
- Browser cache for media files

## System Boundaries

### Security Boundaries
- API routes validate all inputs
- Rate limiting on sensitive endpoints
- Authentication required for user data
- CORS configuration for external APIs

### Data Boundaries
- Client-side: Temporary project state
- Server-side: User authentication
- External: Media files and AI processing
- Local: IndexedDB for persistence

## Architectural Decisions

### ADR-001: Next.js App Router
**Decision**: Use Next.js 15 App Router instead of Pages Router
**Rationale**: Better performance, React Server Components, improved DX
**Consequences**: Learning curve for team, some library incompatibilities

### ADR-002: Zustand for State Management
**Decision**: Use Zustand instead of Redux or Context API
**Rationale**: Simpler API, better performance, smaller bundle size
**Consequences**: Less ecosystem support, fewer dev tools

### ADR-003: fal.ai for AI Processing
**Decision**: Use fal.ai as primary AI service provider
**Rationale**: Wide model selection, good performance, simple API
**Consequences**: Vendor lock-in, cost considerations

### ADR-004: Remote File Storage
**Decision**: Store all files remotely (Supabase/UploadThing)
**Rationale**: Scalability, no server storage management, CDN benefits
**Consequences**: Internet dependency, storage costs

## System Constraints

### Technical Constraints
- Browser-based processing limits
- WebGL/WebGPU availability
- Maximum file upload sizes
- API rate limits

### Business Constraints
- AI model costs per generation
- Storage costs for media files
- Bandwidth costs for video streaming
- Processing time expectations

## Future Architecture Considerations

### Potential Enhancements
1. **Microservices Migration**: Separate AI processing into dedicated service
2. **Real-time Collaboration**: WebSocket-based multi-user editing
3. **Offline Mode**: Enhanced PWA capabilities with service workers
4. **Edge Computing**: Process videos at edge locations
5. **Plugin System**: Extensible architecture for third-party integrations

### Scaling Strategies
1. **Database Sharding**: Partition data by user/project
2. **Queue System**: Implement job queues for long-running tasks
3. **Caching Layer**: Add Redis for session and data caching
4. **CDN Optimization**: Multi-region content delivery
5. **Load Balancing**: Distribute traffic across multiple instances