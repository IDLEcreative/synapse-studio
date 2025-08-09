# API Documentation

## Overview

Synapse Studio's API is built using Next.js Route Handlers, providing a RESTful interface for AI model integration, file management, and authentication. All API endpoints are secured with appropriate authentication and rate limiting.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

### Authentication Methods

1. **NextAuth Session**: Cookie-based session authentication
2. **API Key**: For external integrations (future)

### Authentication Header

```http
Cookie: next-auth.session-token=<session-token>
```

## API Endpoints

### 1. AI Generation API

#### Generate Content

**Endpoint**: `POST /api/fal`

**Description**: Submit a job to generate AI content (images, videos, etc.)

**Request Headers**:
```http
Content-Type: application/json
Cookie: next-auth.session-token=<token>
```

**Request Body**:
```json
{
  "endpointId": "fal-ai/flux-pro",
  "input": {
    "prompt": "A beautiful landscape",
    "num_images": 1,
    "image_size": "landscape_16_9",
    "num_inference_steps": 28,
    "guidance_scale": 3.5,
    "seed": 123456
  }
}
```

**Response** (200 OK):
```json
{
  "requestId": "req_123abc",
  "status": "QUEUED",
  "createdAt": "2025-01-08T10:00:00Z"
}
```

**Error Response** (400/403/429/500):
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Rate Limiting**: 10 requests per minute

#### Check Generation Status

**Endpoint**: `GET /api/fal?requestId={requestId}`

**Description**: Poll for the status of a generation job

**Request Headers**:
```http
Cookie: next-auth.session-token=<token>
```

**Response** (200 OK):
```json
{
  "requestId": "req_123abc",
  "status": "COMPLETED",
  "output": {
    "images": [
      {
        "url": "https://storage.googleapis.com/...",
        "content_type": "image/png",
        "file_name": "output.png",
        "file_size": 1234567,
        "width": 1920,
        "height": 1080
      }
    ]
  },
  "completedAt": "2025-01-08T10:01:00Z",
  "processingTime": 60
}
```

**Status Values**:
- `QUEUED`: Job is waiting to be processed
- `IN_PROGRESS`: Job is being processed
- `COMPLETED`: Job finished successfully
- `FAILED`: Job failed with error

**Rate Limiting**: 5 requests per minute

### 2. File Upload API

#### Upload File via UploadThing

**Endpoint**: `POST /api/uploadthing`

**Description**: Upload media files to cloud storage

**Request**: Multipart form data

```http
POST /api/uploadthing
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="files"; filename="video.mp4"
Content-Type: video/mp4

[Binary data]
------WebKitFormBoundary--
```

**Response** (200 OK):
```json
[
  {
    "name": "video.mp4",
    "size": 10485760,
    "key": "file_key_123",
    "url": "https://utfs.io/f/file_key_123",
    "customId": null
  }
]
```

**File Limits**:
- Max file size: 512MB
- Allowed types: image/*, video/*, audio/*

### 3. Authentication API

#### Sign In

**Endpoint**: `POST /api/auth/signin`

**Description**: Authenticate user and create session

**Request Body**:
```json
{
  "username": "user@example.com",
  "password": "secure_password"
}
```

**Response**: Sets session cookie and redirects

#### Sign Out

**Endpoint**: `POST /api/auth/signout`

**Description**: Destroy user session

**Response**: Clears session cookie and redirects

#### Get Session

**Endpoint**: `GET /api/auth/session`

**Description**: Get current user session

**Response** (200 OK):
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "expires": "2025-01-15T10:00:00Z"
}
```

### 4. Media Proxy API

#### Proxy Media File

**Endpoint**: `GET /api/media-proxy?url={encodedUrl}`

**Description**: Proxy media files to bypass CORS restrictions

**Query Parameters**:
- `url` (required): URL-encoded media file URL

**Response**: Proxied media file with appropriate headers

**Use Case**: Loading cross-origin media in video editor

### 5. Download API

#### Download Generated Content

**Endpoint**: `GET /api/download?url={encodedUrl}&filename={filename}`

**Description**: Download files with proper headers

**Query Parameters**:
- `url` (required): URL-encoded file URL
- `filename` (optional): Suggested filename

**Response**: File download with Content-Disposition header

## API Models & Schemas

### Model Endpoints Configuration

```typescript
// Available AI model endpoints
interface ModelEndpoint {
  endpointId: string;
  title: string;
  type: "image" | "video" | "music" | "voiceover";
  description: string;
  defaultParams: Record<string, any>;
}

// Example endpoints
const endpoints: ModelEndpoint[] = [
  {
    endpointId: "fal-ai/flux-pro",
    title: "FLUX.1 Pro",
    type: "image",
    description: "High-quality image generation",
    defaultParams: {
      num_images: 1,
      image_size: "landscape_16_9",
      num_inference_steps: 28
    }
  },
  {
    endpointId: "fal-ai/minimax/video-01",
    title: "MiniMax Video",
    type: "video",
    description: "Text to video generation",
    defaultParams: {
      prompt_optimizer: true
    }
  }
];
```

### Request/Response Schemas

```typescript
// Generation request schema
interface GenerationRequest {
  endpointId: string;
  input: {
    prompt: string;
    [key: string]: any; // Model-specific parameters
  };
}

// Generation response schema
interface GenerationResponse {
  requestId: string;
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  output?: {
    images?: Array<{
      url: string;
      content_type: string;
      file_name: string;
      file_size: number;
      width: number;
      height: number;
    }>;
    video?: {
      url: string;
      content_type: string;
      file_name: string;
      file_size: number;
      duration: number;
    };
    audio?: {
      url: string;
      content_type: string;
      file_name: string;
      file_size: number;
      duration: number;
    };
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  metrics?: {
    processingTime: number;
    queueTime: number;
  };
}
```

## Error Handling

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {
    "field": "Additional context"
  },
  "timestamp": "2025-01-08T10:00:00Z",
  "requestId": "req_123abc"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | External service down |

## Rate Limiting

### Rate Limit Headers

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1704709260
```

### Rate Limit Configurations

| Endpoint | Method | Limit | Window |
|----------|--------|-------|--------|
| `/api/fal` | POST | 10 | 1 minute |
| `/api/fal` | GET | 5 | 1 minute |
| `/api/uploadthing` | POST | 20 | 1 minute |
| `/api/auth/*` | POST | 5 | 1 minute |

## Security

### Security Headers

All API responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

### Input Validation

All inputs are validated using Zod schemas:

```typescript
// Example validation schema
const generateSchema = z.object({
  endpointId: z.string().min(1),
  input: z.object({
    prompt: z.string().min(1).max(1000),
    num_images: z.number().int().min(1).max(4).optional(),
    seed: z.number().int().optional()
  })
});
```

### API Key Management

For future external API access:

```typescript
// API key validation
interface ApiKey {
  key: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: Date;
}
```

## Webhooks (Future)

### Webhook Configuration

```json
{
  "url": "https://your-domain.com/webhook",
  "events": ["generation.completed", "generation.failed"],
  "secret": "webhook_secret_key"
}
```

### Webhook Payload

```json
{
  "event": "generation.completed",
  "timestamp": "2025-01-08T10:00:00Z",
  "data": {
    "requestId": "req_123abc",
    "output": { /* ... */ }
  },
  "signature": "sha256=..."
}
```

## SDK/Client Examples

### JavaScript/TypeScript

```typescript
// API Client
class SynapseAPI {
  private baseURL: string;
  private session: string;

  constructor(baseURL: string, session: string) {
    this.baseURL = baseURL;
    this.session = session;
  }

  async generate(endpointId: string, input: any) {
    const response = await fetch(`${this.baseURL}/api/fal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${this.session}`
      },
      body: JSON.stringify({ endpointId, input })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  async checkStatus(requestId: string) {
    const response = await fetch(
      `${this.baseURL}/api/fal?requestId=${requestId}`,
      {
        headers: {
          'Cookie': `next-auth.session-token=${this.session}`
        }
      }
    );
    
    return response.json();
  }

  async pollUntilComplete(requestId: string, interval = 1000) {
    while (true) {
      const status = await this.checkStatus(requestId);
      
      if (status.status === 'COMPLETED') {
        return status;
      }
      
      if (status.status === 'FAILED') {
        throw new Error(status.error?.message || 'Generation failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}

// Usage
const api = new SynapseAPI('https://your-domain.com', 'session_token');
const job = await api.generate('fal-ai/flux-pro', {
  prompt: 'A beautiful landscape'
});
const result = await api.pollUntilComplete(job.requestId);
```

### cURL Examples

```bash
# Generate image
curl -X POST https://your-domain.com/api/fal \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "endpointId": "fal-ai/flux-pro",
    "input": {
      "prompt": "A beautiful landscape"
    }
  }'

# Check status
curl https://your-domain.com/api/fal?requestId=req_123abc \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"

# Upload file
curl -X POST https://your-domain.com/api/uploadthing \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -F "files=@video.mp4"
```

## API Versioning

Currently, the API is unversioned. Future versions will use URL-based versioning:

```
/api/v1/fal
/api/v2/fal
```

## OpenAPI Specification

An OpenAPI specification is available for API documentation and client generation:

```yaml
openapi: 3.0.0
info:
  title: Synapse Studio API
  version: 1.0.0
  description: AI-powered video editing platform API
servers:
  - url: https://your-domain.com/api
    description: Production
  - url: http://localhost:3000/api
    description: Development
paths:
  /fal:
    post:
      summary: Generate AI content
      # ... full OpenAPI spec
```

## Testing

### API Testing with Postman

A Postman collection is available for API testing:

1. Import the collection from `docs/postman/synapse-studio.json`
2. Set environment variables for `base_url` and `session_token`
3. Run the test suite

### Integration Testing

```typescript
// Example integration test
describe('API Integration Tests', () => {
  test('Generate image', async () => {
    const response = await api.generate('fal-ai/flux-pro', {
      prompt: 'Test prompt'
    });
    
    expect(response).toHaveProperty('requestId');
    expect(response.status).toBe('QUEUED');
  });
});
```