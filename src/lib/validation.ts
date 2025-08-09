import { z } from "zod";

// FAL API request validation schema
export const falApiRequestSchema = z.object({
  endpoint: z
    .string()
    .min(1, "Endpoint is required")
    .max(200, "Endpoint too long"),
  input: z.record(z.unknown()).optional(),
  logs: z.boolean().optional().default(false),
});

// FAL API status request schema
export const falStatusRequestSchema = z.object({
  requestId: z
    .string()
    .min(1, "Request ID is required")
    .max(100, "Request ID too long"),
});

// Common file upload schema
export const fileUploadSchema = z.object({
  file: z.object({
    name: z
      .string()
      .min(1, "File name is required")
      .max(255, "File name too long"),
    size: z
      .number()
      .min(1, "File size must be positive")
      .max(100 * 1024 * 1024, "File too large (max 100MB)"),
    type: z.string().min(1, "File type is required"),
  }),
});

// Share request schema - flexible to match ShareVideoParams
export const shareRequestSchema = z.record(z.unknown());

// Media proxy request schema
export const mediaProxyRequestSchema = z.object({
  url: z.string().url("Invalid URL format").max(2000, "URL too long"),
});

// Download request schema
export const downloadRequestSchema = z.object({
  url: z.string().url("Invalid URL format").max(2000, "URL too long"),
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename too long")
    .optional(),
});

// Generic validation error handler
export class ValidationError extends Error {
  constructor(
    public errors: z.ZodIssue[],
    message = "Validation failed",
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// Validation middleware wrapper
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (data: unknown): Promise<T> => {
    try {
      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors);
      }
      throw error;
    }
  };
}

// Safe JSON parse with validation
export async function safeParseJSON<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const validatedData = await validateRequest(schema)(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ValidationError) {
      const errorMessage = error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return { success: false, error: `Validation error: ${errorMessage}` };
    }
    if (error instanceof SyntaxError) {
      return { success: false, error: "Invalid JSON format" };
    }
    return { success: false, error: "Failed to parse request" };
  }
}

// URL parameter validation
export function validateURLParams<T>(
  url: string,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const urlObj = new URL(url);
    const params = Object.fromEntries(urlObj.searchParams.entries());
    const validatedData = schema.parse(params);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return {
        success: false,
        error: `URL parameter validation error: ${errorMessage}`,
      };
    }
    return { success: false, error: "Failed to validate URL parameters" };
  }
}
