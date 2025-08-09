# Setting Up Supabase for File Uploads

This guide will walk you through the process of setting up Supabase for file uploads in Synapse Studio.

## 1. Create a Supabase Account and Project

1. Go to [Supabase](https://supabase.com/) and sign up for an account if you don't have one already.
2. Create a new project:
   - Click on "New Project"
   - Enter a name for your project
   - Set a secure password for the database
   - Choose a region closest to your users
   - Click "Create new project"

## 2. Set Up Storage

1. Once your project is created, go to the "Storage" section in the left sidebar.
2. Click "Create a new bucket" and name it `media`.
3. Set the bucket's privacy settings:
   - For public access (recommended for media files): Select "Public" bucket
   - For private access: Select "Private" bucket

## 3. Configure Storage Policies

For a public bucket, you'll need to set up policies to allow file uploads:

1. Go to the "Policies" tab in the Storage section.
2. Click "Add Policies" for the `media` bucket.
3. Create the following policies:

### For Public Read Access

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'media');
```

### For Authenticated Uploads

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Users Can Upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');
```

### For Authenticated Updates/Deletes

```sql
-- Allow users to update and delete their own files
CREATE POLICY "Authenticated Users Can Update/Delete"
ON storage.objects
FOR UPDATE, DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid() = owner);
```

## 4. Get Your API Keys

1. Go to the "Settings" section in the left sidebar.
2. Click on "API" in the submenu.
3. You'll need two values:
   - **Project URL**: This is your Supabase project URL
   - **anon/public key**: This is your public API key

## 5. Update Environment Variables

Add the following variables to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL="your-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

Replace `your-project-url` with your Supabase project URL and `your-anon-key` with your anon/public key.

## 6. Restart Your Development Server

After updating the environment variables, restart your development server for the changes to take effect:

```bash
npm run dev
```

## 7. Test File Uploads

Now you should be able to upload files using the "Upload" button in the left panel or the "Upload Image" button in the Fill & Inpaint Editor.

## Troubleshooting

If you encounter issues with file uploads:

1. Check your browser console for errors
2. Verify that your environment variables are set correctly
3. Ensure your Supabase storage bucket is properly configured
4. Check that your storage policies allow the operations you're trying to perform

For more information, refer to the [Supabase Storage documentation](https://supabase.com/docs/guides/storage).
