import { describe, it, expect, jest } from "@jest/globals";
import { z } from "zod";
import {
  falApiRequestSchema,
  falStatusRequestSchema,
  fileUploadSchema,
  mediaProxyRequestSchema,
  downloadRequestSchema,
  ValidationError,
  validateRequest,
  safeParseJSON,
  validateURLParams,
} from "../validation";

describe("Validation Utilities", () => {
  describe("Schema Validation", () => {
    describe("falApiRequestSchema", () => {
      it("should validate valid FAL API requests", async () => {
        const validData = {
          endpoint: "fal-ai/flux-pro",
          input: { prompt: "A beautiful landscape" },
          logs: true,
        };

        const result = await falApiRequestSchema.parseAsync(validData);
        expect(result).toEqual(validData);
      });

      it("should require endpoint", async () => {
        const invalidData = {
          input: { prompt: "test" },
        };

        await expect(
          falApiRequestSchema.parseAsync(invalidData),
        ).rejects.toThrow();
      });

      it("should reject empty endpoint", async () => {
        const invalidData = {
          endpoint: "",
          input: { prompt: "test" },
        };

        await expect(
          falApiRequestSchema.parseAsync(invalidData),
        ).rejects.toThrow("Endpoint is required");
      });

      it("should reject overly long endpoint", async () => {
        const invalidData = {
          endpoint: "a".repeat(201),
          input: { prompt: "test" },
        };

        await expect(
          falApiRequestSchema.parseAsync(invalidData),
        ).rejects.toThrow("Endpoint too long");
      });

      it("should default logs to false", async () => {
        const data = {
          endpoint: "fal-ai/flux-pro",
          input: { prompt: "test" },
        };

        const result = await falApiRequestSchema.parseAsync(data);
        expect(result.logs).toBe(false);
      });

      it("should allow optional input", async () => {
        const data = {
          endpoint: "fal-ai/flux-pro",
        };

        const result = await falApiRequestSchema.parseAsync(data);
        expect(result.input).toBeUndefined();
      });
    });

    describe("falStatusRequestSchema", () => {
      it("should validate valid status requests", async () => {
        const validData = {
          requestId: "abc123",
        };

        const result = await falStatusRequestSchema.parseAsync(validData);
        expect(result).toEqual(validData);
      });

      it("should require requestId", async () => {
        const invalidData = {};

        await expect(
          falStatusRequestSchema.parseAsync(invalidData),
        ).rejects.toThrow();
      });

      it("should reject empty requestId", async () => {
        const invalidData = {
          requestId: "",
        };

        await expect(
          falStatusRequestSchema.parseAsync(invalidData),
        ).rejects.toThrow("Request ID is required");
      });

      it("should reject overly long requestId", async () => {
        const invalidData = {
          requestId: "a".repeat(101),
        };

        await expect(
          falStatusRequestSchema.parseAsync(invalidData),
        ).rejects.toThrow("Request ID too long");
      });
    });

    describe("fileUploadSchema", () => {
      it("should validate valid file uploads", async () => {
        const validData = {
          file: {
            name: "test-video.mp4",
            size: 1024 * 1024, // 1MB
            type: "video/mp4",
          },
        };

        const result = await fileUploadSchema.parseAsync(validData);
        expect(result).toEqual(validData);
      });

      it("should reject files without name", async () => {
        const invalidData = {
          file: {
            name: "",
            size: 1024,
            type: "video/mp4",
          },
        };

        await expect(fileUploadSchema.parseAsync(invalidData)).rejects.toThrow(
          "File name is required",
        );
      });

      it("should reject overly long file names", async () => {
        const invalidData = {
          file: {
            name: "a".repeat(256),
            size: 1024,
            type: "video/mp4",
          },
        };

        await expect(fileUploadSchema.parseAsync(invalidData)).rejects.toThrow(
          "File name too long",
        );
      });

      it("should reject zero-size files", async () => {
        const invalidData = {
          file: {
            name: "test.mp4",
            size: 0,
            type: "video/mp4",
          },
        };

        await expect(fileUploadSchema.parseAsync(invalidData)).rejects.toThrow(
          "File size must be positive",
        );
      });

      it("should reject files larger than 100MB", async () => {
        const invalidData = {
          file: {
            name: "test.mp4",
            size: 101 * 1024 * 1024, // 101MB
            type: "video/mp4",
          },
        };

        await expect(fileUploadSchema.parseAsync(invalidData)).rejects.toThrow(
          "File too large (max 100MB)",
        );
      });

      it("should reject files without type", async () => {
        const invalidData = {
          file: {
            name: "test.mp4",
            size: 1024,
            type: "",
          },
        };

        await expect(fileUploadSchema.parseAsync(invalidData)).rejects.toThrow(
          "File type is required",
        );
      });
    });

    describe("mediaProxyRequestSchema", () => {
      it("should validate valid URLs", async () => {
        const validData = {
          url: "https://example.com/video.mp4",
        };

        const result = await mediaProxyRequestSchema.parseAsync(validData);
        expect(result).toEqual(validData);
      });

      it("should reject invalid URLs", async () => {
        const invalidData = {
          url: "not-a-url",
        };

        await expect(
          mediaProxyRequestSchema.parseAsync(invalidData),
        ).rejects.toThrow("Invalid URL format");
      });

      it("should reject overly long URLs", async () => {
        const invalidData = {
          url: "https://example.com/" + "a".repeat(2000),
        };

        await expect(
          mediaProxyRequestSchema.parseAsync(invalidData),
        ).rejects.toThrow("URL too long");
      });
    });

    describe("downloadRequestSchema", () => {
      it("should validate valid download requests", async () => {
        const validData = {
          url: "https://example.com/video.mp4",
          filename: "my-video.mp4",
        };

        const result = await downloadRequestSchema.parseAsync(validData);
        expect(result).toEqual(validData);
      });

      it("should allow optional filename", async () => {
        const validData = {
          url: "https://example.com/video.mp4",
        };

        const result = await downloadRequestSchema.parseAsync(validData);
        expect(result.filename).toBeUndefined();
      });

      it("should reject invalid URLs", async () => {
        const invalidData = {
          url: "not-a-url",
        };

        await expect(
          downloadRequestSchema.parseAsync(invalidData),
        ).rejects.toThrow("Invalid URL format");
      });

      it("should reject empty filename", async () => {
        const invalidData = {
          url: "https://example.com/video.mp4",
          filename: "",
        };

        await expect(
          downloadRequestSchema.parseAsync(invalidData),
        ).rejects.toThrow("Filename is required");
      });

      it("should reject overly long filename", async () => {
        const invalidData = {
          url: "https://example.com/video.mp4",
          filename: "a".repeat(256),
        };

        await expect(
          downloadRequestSchema.parseAsync(invalidData),
        ).rejects.toThrow("Filename too long");
      });
    });
  });

  describe("ValidationError", () => {
    it("should create validation error with issues", () => {
      const issues: z.ZodIssue[] = [
        {
          code: z.ZodIssueCode.invalid_type,
          expected: "string",
          received: "number",
          path: ["name"],
          message: "Expected string, received number",
        },
      ];

      const error = new ValidationError(issues);
      expect(error.name).toBe("ValidationError");
      expect(error.message).toBe("Validation failed");
      expect(error.errors).toEqual(issues);
    });

    it("should allow custom message", () => {
      const error = new ValidationError([], "Custom validation error");
      expect(error.message).toBe("Custom validation error");
    });
  });

  describe("validateRequest", () => {
    const testSchema = z.object({
      name: z.string(),
      age: z.number().positive(),
    });

    it("should validate valid data", async () => {
      const validator = validateRequest(testSchema);
      const validData = { name: "John", age: 25 };

      const result = await validator(validData);
      expect(result).toEqual(validData);
    });

    it("should throw ValidationError for invalid data", async () => {
      const validator = validateRequest(testSchema);
      const invalidData = { name: "John", age: -5 };

      await expect(validator(invalidData)).rejects.toThrow(ValidationError);
    });

    it("should preserve original error for non-Zod errors", async () => {
      const errorSchema = z.string().refine(() => {
        throw new Error("Custom error");
      });

      const validator = validateRequest(errorSchema);

      await expect(validator("test")).rejects.toThrow("Custom error");
    });
  });

  describe("safeParseJSON", () => {
    it("should parse valid JSON with valid data", async () => {
      const schema = z.object({ name: z.string() });
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: "John" }),
      } as unknown as Request;

      const result = await safeParseJSON(mockRequest, schema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: "John" });
      }
    });

    it("should handle validation errors", async () => {
      const schema = z.object({ name: z.string() });
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: 123 }),
      } as unknown as Request;

      const result = await safeParseJSON(mockRequest, schema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Validation error");
      }
    });

    it("should handle JSON syntax errors", async () => {
      const schema = z.object({ name: z.string() });
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new SyntaxError("Invalid JSON")),
      } as unknown as Request;

      const result = await safeParseJSON(mockRequest, schema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid JSON format");
      }
    });

    it("should handle other parsing errors", async () => {
      const schema = z.object({ name: z.string() });
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error("Network error")),
      } as unknown as Request;

      const result = await safeParseJSON(mockRequest, schema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to parse request");
      }
    });
  });

  describe("validateURLParams", () => {
    const testSchema = z.object({
      page: z.string().transform(Number),
      limit: z.string().transform(Number).optional(),
    });

    it("should validate valid URL parameters", () => {
      const url = "https://example.com/api?page=1&limit=10";

      const result = validateURLParams(url, testSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ page: 1, limit: 10 });
      }
    });

    it("should handle missing optional parameters", () => {
      const url = "https://example.com/api?page=1";

      const result = validateURLParams(url, testSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ page: 1 });
      }
    });

    it("should handle validation errors", () => {
      const url = "https://example.com/api?page=invalid";

      const result = validateURLParams(url, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("URL parameter validation error");
      }
    });

    it("should handle missing required parameters", () => {
      const url = "https://example.com/api?limit=10";

      const result = validateURLParams(url, testSchema);

      expect(result.success).toBe(false);
    });

    it("should handle invalid URLs", () => {
      const invalidUrl = "not-a-url";

      const result = validateURLParams(invalidUrl, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to validate URL parameters");
      }
    });

    it("should handle URLs without parameters", () => {
      const url = "https://example.com/api";

      const result = validateURLParams(url, testSchema);

      expect(result.success).toBe(false);
    });
  });
});
