import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials are missing. File uploads and authentication will not work.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a Supabase client for client-side auth
export function createBrowserSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Upload a file to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket to upload to (default: 'media')
 * @param path Optional path within the bucket
 * @returns The URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: string = "media",
  path?: string,
): Promise<string> {
  try {
    // Create a unique file name
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

/**
 * Upload multiple files to Supabase Storage
 * @param files Array of files to upload
 * @param bucket The storage bucket to upload to (default: 'media')
 * @param path Optional path within the bucket
 * @returns Array of URLs of the uploaded files
 */
export async function uploadFiles(
  files: File[],
  bucket: string = "media",
  path?: string,
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadFile(file, bucket, path));
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Supabase Storage
 * @param url The URL of the file to delete
 * @param bucket The storage bucket the file is in (default: 'media')
 */
export async function deleteFile(
  url: string,
  bucket: string = "media",
): Promise<void> {
  try {
    // Extract the file path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join("/");

    // Delete the file
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}
