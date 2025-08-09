// Test script to upload a file to Supabase storage
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Hardcode Supabase credentials from .env.local
const supabaseUrl = "https://fprcrtxkzmxhlrvnsilf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcmNydHhrem14aGxydm5zaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NzU4NjgsImV4cCI6MjA1ODE1MTg2OH0._bb5mJs8kSbPYpohZZ4S5zdmRTa_bWKWnoSfBbrgC98";

console.log("Using Supabase URL:", supabaseUrl);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a simple test file
const testFilePath = path.join(__dirname, "test-upload.txt");
fs.writeFileSync(testFilePath, "This is a test file for Supabase upload.");

// Function to upload a file to Supabase storage
async function uploadFile() {
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(testFilePath);

    // Create a unique file name
    const fileName = `test-${Date.now()}.txt`;

    console.log(`Uploading file ${fileName} to 'media' bucket...`);

    // Upload the file
    const { data, error } = await supabase.storage
      .from("media")
      .upload(fileName, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading file:", error);
      return;
    }

    console.log("File uploaded successfully:", data);

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from("media")
      .getPublicUrl(data.path);

    console.log("Public URL:", publicUrlData.publicUrl);

    // Clean up the test file
    fs.unlinkSync(testFilePath);
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

// Run the upload function
uploadFile();
