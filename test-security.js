// Simple security test script
const http = require("http");
const https = require("https");

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === "https:" ? https : http;

    const req = client.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
        });
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function testSecurity() {
  console.log("🔒 Testing Synapse Studio Security Measures\n");

  const baseUrl = "http://localhost:3000";

  // Test 1: Rate limiting
  console.log("1. Testing rate limiting on FAL API...");
  try {
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        makeRequest(
          {
            hostname: "localhost",
            port: 3000,
            path: "/api/fal",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
          JSON.stringify({ endpoint: "test", input: {} }),
        ),
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.some((r) => r.status === 429);

    if (rateLimited) {
      console.log("✅ Rate limiting is working - requests were limited");
    } else {
      console.log("❌ Rate limiting may not be working - no 429 responses");
    }

    // Check for rate limit headers
    const hasRateHeaders = responses.some(
      (r) =>
        r.headers["x-ratelimit-limit"] || r.headers["x-ratelimit-remaining"],
    );

    if (hasRateHeaders) {
      console.log("✅ Rate limit headers are being sent");
    } else {
      console.log("❌ Rate limit headers are missing");
    }
  } catch (error) {
    console.log(`❓ Could not test rate limiting: ${error.message}`);
  }

  // Test 2: Input validation
  console.log("\n2. Testing input validation...");
  try {
    const response = await makeRequest(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/fal",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      JSON.stringify({ invalid: "data" }),
    );

    if (response.status === 400) {
      console.log("✅ Input validation is working - invalid data rejected");
    } else {
      console.log("❌ Input validation may not be working");
    }
  } catch (error) {
    console.log(`❓ Could not test input validation: ${error.message}`);
  }

  // Test 3: Security headers
  console.log("\n3. Testing security headers...");
  try {
    const response = await makeRequest({
      hostname: "localhost",
      port: 3000,
      path: "/api/fal",
      method: "GET",
    });

    const securityHeaders = [
      "x-content-type-options",
      "x-frame-options",
      "x-xss-protection",
      "referrer-policy",
    ];

    const presentHeaders = securityHeaders.filter(
      (header) => response.headers[header],
    );

    if (presentHeaders.length === securityHeaders.length) {
      console.log("✅ All security headers are present");
    } else {
      console.log(
        `⚠️  Some security headers missing: ${securityHeaders.filter((h) => !response.headers[h]).join(", ")}`,
      );
    }
  } catch (error) {
    console.log(`❓ Could not test security headers: ${error.message}`);
  }

  // Test 4: CORS headers
  console.log("\n4. Testing CORS headers...");
  try {
    const response = await makeRequest({
      hostname: "localhost",
      port: 3000,
      path: "/api/fal",
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    if (response.headers["access-control-allow-origin"]) {
      console.log("✅ CORS headers are present");
    } else {
      console.log("❌ CORS headers are missing");
    }
  } catch (error) {
    console.log(`❓ Could not test CORS headers: ${error.message}`);
  }

  // Test 5: Authentication protection
  console.log("\n5. Testing authentication protection...");
  try {
    const response = await makeRequest({
      hostname: "localhost",
      port: 3000,
      path: "/api/fal",
      method: "GET",
    });

    if (response.status === 401) {
      console.log(
        "✅ Authentication is required - unauthenticated request rejected",
      );
    } else {
      console.log(
        `❌ Authentication may not be working - status: ${response.status}`,
      );
    }
  } catch (error) {
    console.log(`❓ Could not test authentication: ${error.message}`);
  }

  console.log("\n🔒 Security test completed!");
  console.log(
    '\nNote: Start the dev server with "npm run dev" to run these tests properly.',
  );
}

// Run tests if this script is executed directly
if (require.main === module) {
  testSecurity().catch(console.error);
}

module.exports = { testSecurity };
