// Script to check if the Supabase storage bucket exists
const { createClient } = require("@supabase/supabase-js");

// Hardcode Supabase credentials from .env.local
const supabaseUrl = "https://fprcrtxkzmxhlrvnsilf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcmNydHhrem14aGxydm5zaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NzU4NjgsImV4cCI6MjA1ODE1MTg2OH0._bb5mJs8kSbPYpohZZ4S5zdmRTa_bWKWnoSfBbrgC98";

console.log("Using Supabase URL:", supabaseUrl);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if the 'media' bucket exists and create it if it doesn't
async function checkBucket() {
  try {
    // List all buckets first
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError.message);
      return;
    }

    console.log("Available buckets:", buckets);

    // Check if media bucket exists
    const mediaBucket = buckets.find((bucket) => bucket.name === "media");

    if (!mediaBucket) {
      console.log('The "media" bucket does not exist. Creating it now...');

      // Create the bucket
      const { data: createData, error: createError } =
        await supabase.storage.createBucket("media", {
          public: true,
          fileSizeLimit: 52428800, // 50MB
        });

      if (createError) {
        console.error("Error creating bucket:", createError.message);
      } else {
        console.log('Successfully created "media" bucket!');

        // Set public bucket policy
        const { error: policyError } = await supabase.storage
          .from("media")
          .createSignedUrl("test.txt", 60);

        if (policyError && !policyError.message.includes("not found")) {
          console.error("Error setting bucket policy:", policyError.message);
        } else {
          console.log("Successfully set public bucket policy!");
        }
      }
    } else {
      console.log('The "media" bucket already exists!');
    }

    // List buckets again to confirm
    const { data: updatedBuckets } = await supabase.storage.listBuckets();
    console.log("Updated buckets list:", updatedBuckets);
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkBucket();
