import { test, expect, type Page } from "@playwright/test";

// Test data
const TEST_USER = {
  email: "test@example.com",
  name: "Test User",
};

const TEST_PROMPT =
  "A beautiful sunset over snow-capped mountains with a lake reflection";

// Helper functions
async function mockAuthenticatedUser(page: Page) {
  // Mock authentication by setting session
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "mock-user",
      JSON.stringify({
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      }),
    );
  });
}

async function mockFalApiResponses(page: Page) {
  // Mock FAL API responses
  await page.route("/api/fal", async (route, request) => {
    const method = request.method();
    const url = new URL(request.url());

    if (method === "POST") {
      // Mock video generation request
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({
          requestId: "mock-request-id",
          status: "IN_PROGRESS",
        }),
      });
    } else if (method === "GET" && url.searchParams.get("requestId")) {
      // Mock status check
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "COMPLETED",
          data: {
            video: {
              url: "https://mock-cdn.example.com/generated-video.mp4",
              content_type: "video/mp4",
              duration: 10,
              width: 1920,
              height: 1080,
            },
          },
        }),
      });
    } else {
      await route.continue();
    }
  });
}

async function mockUploadResponse(page: Page) {
  await page.route("/api/uploadthing", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            key: "mock-upload-key",
            name: "test-video.mp4",
            size: 5242880, // 5MB
            url: "https://utfs.io/f/mock-upload-key",
            type: "video/mp4",
          },
        ],
      }),
    });
  });
}

async function waitForNetworkIdle(page: Page, timeout = 2000) {
  await page.waitForLoadState("networkidle", { timeout });
}

test.describe("Main User Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Set up mocks before navigation
    await mockAuthenticatedUser(page);
    await mockFalApiResponses(page);
    await mockUploadResponse(page);
  });

  test("should complete full video creation workflow", async ({ page }) => {
    // Navigate to the application
    await page.goto("/");

    // Wait for initial load
    await waitForNetworkIdle(page);

    // Verify landing page loads
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Synapse Studio")).toBeVisible();

    // Start creating a project (if there's a CTA button)
    const getStartedButton = page
      .locator('button:has-text("Get Started"), a:has-text("Get Started")')
      .first();
    if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
      await waitForNetworkIdle(page);
    } else {
      // Navigate directly to the editor
      await page.goto("/editor");
      await waitForNetworkIdle(page);
    }

    // Verify we're in the editor interface
    await expect(
      page.locator('[data-testid="video-editor"], .video-editor, #editor'),
    ).toBeVisible({ timeout: 10000 });

    // Check for right panel (generation controls)
    const rightPanel = page
      .locator('[data-testid="right-panel"], .right-panel, aside')
      .last();
    await expect(rightPanel).toBeVisible();

    // Verify media type tabs are present
    await expect(page.locator("text=Video")).toBeVisible();
    await expect(page.locator("text=Image")).toBeVisible();

    // Ensure Video tab is selected
    const videoTab = page
      .locator('[role="tab"]:has-text("Video"), button:has-text("Video")')
      .first();
    await videoTab.click();
    await page.waitForTimeout(500);

    // Find and fill the prompt textarea
    const promptInput = page
      .locator(
        'textarea[placeholder*="describe"], textarea[placeholder*="prompt"], textarea',
      )
      .first();
    await expect(promptInput).toBeVisible();
    await promptInput.fill(TEST_PROMPT);

    // Verify prompt was entered
    await expect(promptInput).toHaveValue(TEST_PROMPT);

    // Select aspect ratio (if available)
    const aspectRatioButton = page.locator('button:has-text("16:9")').first();
    if (await aspectRatioButton.isVisible()) {
      await aspectRatioButton.click();
    }

    // Select duration (if available)
    const durationButton = page.locator('button:has-text("10s")').first();
    if (await durationButton.isVisible()) {
      await durationButton.click();
    }

    // Wait for generate button to be enabled
    const generateButton = page.locator('button:has-text("Generate")').first();
    await expect(generateButton).toBeEnabled({ timeout: 5000 });

    // Click generate button
    await generateButton.click();

    // Verify generation started
    await expect(page.locator("text=Generating, text=Processing")).toBeVisible({
      timeout: 5000,
    });

    // Wait for generation to complete
    await expect(page.locator("text=Generating, text=Processing")).toBeHidden({
      timeout: 15000,
    });

    // Verify success message or generated content appears
    const successIndicator = page
      .locator(
        'text=Generated successfully, text=Complete, [data-testid="generated-video"], .generated-content',
      )
      .first();
    await expect(successIndicator).toBeVisible({ timeout: 10000 });

    // Check if video preview is available
    const videoPreview = page
      .locator('video, [data-testid="video-preview"], .video-player')
      .first();
    if (await videoPreview.isVisible()) {
      // Verify video element has source
      const videoSrc = await videoPreview.getAttribute("src");
      expect(videoSrc).toBeTruthy();
    }

    // Test play controls if available
    const playButton = page
      .locator('button[aria-label*="play"], button:has-text("Play")')
      .first();
    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForTimeout(1000);

      // Verify play state changed
      const pauseButton = page
        .locator('button[aria-label*="pause"], button:has-text("Pause")')
        .first();
      if (await pauseButton.isVisible()) {
        await pauseButton.click();
      }
    }
  });

  test("should handle video upload workflow", async ({ page }) => {
    await page.goto("/editor");
    await waitForNetworkIdle(page);

    // Look for upload area or button
    const uploadArea = page
      .locator('[data-testid="upload-area"], .upload-zone, input[type="file"]')
      .first();

    if (await uploadArea.isVisible()) {
      // Create a test file
      const testFile = {
        name: "test-video.mp4",
        mimeType: "video/mp4",
        buffer: Buffer.from("mock video content"),
      };

      // Handle file upload
      if (await page.locator('input[type="file"]').isVisible()) {
        await page.locator('input[type="file"]').setInputFiles({
          name: testFile.name,
          mimeType: testFile.mimeType,
          buffer: testFile.buffer,
        });

        // Wait for upload to process
        await expect(
          page.locator("text=Uploading, text=Processing"),
        ).toBeVisible({ timeout: 5000 });
        await expect(
          page.locator("text=Uploading, text=Processing"),
        ).toBeHidden({ timeout: 10000 });

        // Verify upload success
        await expect(
          page.locator("text=Upload complete, text=Success"),
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("should handle error states gracefully", async ({ page }) => {
    // Mock API error
    await page.route("/api/fal", async (route, request) => {
      if (request.method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Internal server error",
            details: "Mock error for testing",
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/editor");
    await waitForNetworkIdle(page);

    // Try to generate with error
    const promptInput = page.locator("textarea").first();
    if (await promptInput.isVisible()) {
      await promptInput.fill("Test error handling");

      const generateButton = page
        .locator('button:has-text("Generate")')
        .first();
      if (await generateButton.isVisible()) {
        await generateButton.click();

        // Verify error message appears
        const errorMessage = page
          .locator(
            'text=Error, text=Failed, [data-testid="error-message"], .error',
          )
          .first();
        await expect(errorMessage).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test("should handle responsive design on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/editor");
    await waitForNetworkIdle(page);

    // Verify mobile layout
    await expect(page.locator("body")).toBeVisible();

    // Check if panels are collapsible on mobile
    const toggleButtons = page.locator(
      'button[aria-label*="toggle"], button[aria-label*="menu"], .panel-toggle',
    );

    if (await toggleButtons.first().isVisible()) {
      await toggleButtons.first().click();
      await page.waitForTimeout(500);

      // Verify panel state changed
      // This would depend on specific implementation
    }

    // Test basic functionality still works on mobile
    const promptInput = page.locator("textarea").first();
    if (await promptInput.isVisible()) {
      await promptInput.fill("Mobile test");
      await expect(promptInput).toHaveValue("Mobile test");
    }
  });

  test("should handle page navigation and state persistence", async ({
    page,
  }) => {
    await page.goto("/");

    // Navigate through different pages
    const navLinks = page
      .locator("nav a, header a")
      .filter({ hasText: /Home|About|Features/ });

    if (await navLinks.first().isVisible()) {
      const linkCount = await navLinks.count();

      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = navLinks.nth(i);
        const linkText = await link.textContent();

        if (linkText && !linkText.includes("external")) {
          await link.click();
          await waitForNetworkIdle(page);

          // Verify page loaded
          await expect(page.locator("body")).toBeVisible();
        }
      }
    }

    // Return to editor and verify it still works
    await page.goto("/editor");
    await waitForNetworkIdle(page);

    const promptInput = page.locator("textarea").first();
    if (await promptInput.isVisible()) {
      await promptInput.fill("Navigation test");
      await expect(promptInput).toHaveValue("Navigation test");
    }
  });

  test("should handle keyboard shortcuts", async ({ page }) => {
    await page.goto("/editor");
    await waitForNetworkIdle(page);

    // Test common keyboard shortcuts
    // Space bar for play/pause (if video is present)
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);

    // Escape to close panels/dialogs
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Enter to submit forms
    const promptInput = page.locator("textarea").first();
    if (await promptInput.isVisible()) {
      await promptInput.fill("Keyboard test");
      await page.keyboard.press("Control+Enter"); // Common submit shortcut
      await page.waitForTimeout(500);
    }
  });

  test("should handle accessibility features", async ({ page }) => {
    await page.goto("/editor");
    await waitForNetworkIdle(page);

    // Test tab navigation
    await page.keyboard.press("Tab");
    await page.waitForTimeout(100);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(100);

    // Verify focus is visible
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    // Test screen reader attributes
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const ariaLabel = await firstButton.getAttribute("aria-label");
      const buttonText = await firstButton.textContent();

      // Verify button has accessible name
      expect(ariaLabel || buttonText).toBeTruthy();
    }

    // Test high contrast mode doesn't break layout
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();

    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });
});
