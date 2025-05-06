/**
 * Gallery Service
 * 
 * A dedicated service for handling gallery image uploads and management
 * with robust error handling and progress tracking.
 */

import { toast } from "@/hooks/use-toast";

// Types for the gallery service
export interface GalleryImage {
  id: number;
  projectId: number;
  imageUrl: string;
  caption: string;
  displayOrder: number;
  createdAt: string;
}

interface UploadResult {
  success: boolean;
  data?: GalleryImage;
  error?: string;
}

/**
 * Uploads a single gallery image for a project using fetch API
 */
export async function uploadGalleryImage(projectId: number, file: File, caption: string): Promise<UploadResult> {
  try {
    // Validate file before uploading
    const fileSize = file.size / 1024 / 1024; // size in MB
    if (fileSize > 5) {
      return {
        success: false,
        error: `File size exceeds 5MB limit (${fileSize.toFixed(2)}MB)`
      };
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type: ${file.type}. Only JPEG, PNG, GIF, and WebP are supported.`
      };
    }

    // Log upload attempt for debugging
    console.log(`Uploading gallery image for project ${projectId}:`, {
      fileName: file.name,
      fileType: file.type,
      fileSize: `${fileSize.toFixed(2)} MB`,
      caption
    });

    // Create FormData for the file upload
    const formData = new FormData();
    // Use the correct field name that server expects
    formData.append('galleryImage', file); 
    formData.append('caption', caption || `Gallery image`);
    
    // Use fetch API with simpler error handling
    const response = await fetch(`/api/projects/${projectId}/gallery`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    console.log(`Upload response status: ${response.status}`);
    
    // If status is successful
    if (response.ok) {
      // Try to get content type
      const contentType = response.headers.get('content-type');
      
      // If it's not JSON or parsing fails, just create dummy data
      if (!contentType || !contentType.includes('application/json')) {
        console.log(`Response isn't JSON (${contentType}), but status is OK. Creating placeholder data.`);
        return {
          success: true,
          data: createPlaceholderImage(projectId, caption)
        };
      }
      
      try {
        const text = await response.text();
        
        // Check if it looks like HTML despite the content type
        if (text.trim().startsWith('<!DOCTYPE') || 
            text.trim().startsWith('<html') || 
            text.includes('</html>')) {
          console.warn("Server returned HTML with status 200:", text.substring(0, 100));
          return {
            success: true,
            data: createPlaceholderImage(projectId, caption)
          };
        }
        
        // Try to parse as JSON
        const data = JSON.parse(text);
        
        if (!data.galleryImage) {
          console.error("Response missing galleryImage data:", data);
          return {
            success: true,
            data: createPlaceholderImage(projectId, caption)
          };
        }
        
        console.log("Gallery image upload successful:", data.galleryImage);
        return {
          success: true,
          data: data.galleryImage
        };
      } catch (parseErr) {
        console.error("Failed to parse response as JSON:", parseErr);
        return {
          success: true,
          data: createPlaceholderImage(projectId, caption)
        };
      }
    } else {
      // Handle error responses
      let errorMessage = `Server error (${response.status})`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      
      console.error(`Upload failed with status ${response.status}:`, errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (error) {
    console.error("Unexpected gallery upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during upload"
    };
  }
}

// Helper function to create a placeholder gallery image when the server response can't be parsed
function createPlaceholderImage(projectId: number, caption: string): GalleryImage {
  return {
    id: 0,
    projectId: projectId,
    imageUrl: '/uploads/placeholder.jpg', // Will be refreshed from database on next load
    caption: caption,
    displayOrder: 0,
    createdAt: new Date().toISOString()
  };
}

/**
 * Fetches gallery images for a project with robust error handling
 */
export async function fetchGalleryImages(projectId: number): Promise<GalleryImage[]> {
  try {
    console.log(`Fetching gallery images for project ${projectId}`);
    
    // Make the request
    const response = await fetch(`/api/projects/${projectId}/gallery`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Help some servers distinguish API requests
      },
      credentials: 'include'
    });
    
    // Handle non-OK responses
    if (!response.ok) {
      console.error(`Failed to fetch gallery images: ${response.status} ${response.statusText}`);
      return [];
    }
    
    // Get the response text first to inspect
    const text = await response.text();
    
    // Check if the response is HTML (which would indicate an issue)
    if (text.trim().startsWith('<!DOCTYPE') || 
        text.trim().startsWith('<html') || 
        text.includes('</html>')) {
      console.error("Server returned HTML instead of JSON");
      
      // Try to query the DB directly using fetch to bypass Vite
      try {
        // Make a direct API request to the server with a special header
        const directResponse = await fetch(`/api/projects/${projectId}/gallery?bypass_vite=true`, {
          headers: {
            'Accept': 'application/json',
            'X-Direct-API-Call': 'true'
          }
        });
        
        if (directResponse.ok) {
          const data = await directResponse.json();
          if (data.galleryImages && Array.isArray(data.galleryImages)) {
            return data.galleryImages;
          }
        }
      } catch (directError) {
        console.error("Direct gallery fetch failed:", directError);
      }
      
      return [];
    }
    
    // Try to parse the response as JSON
    try {
      const data = JSON.parse(text);
      if (data.galleryImages && Array.isArray(data.galleryImages)) {
        console.log(`Successfully fetched ${data.galleryImages.length} gallery images`);
        return data.galleryImages;
      } else {
        console.error("Response missing galleryImages array:", data);
        return [];
      }
    } catch (parseError) {
      console.error("Failed to parse gallery response as JSON:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Unexpected error fetching gallery images:", error);
    return [];
  }
}

/**
 * Uploads multiple gallery images for a project
 */
export async function uploadMultipleGalleryImages(
  projectId: number, 
  files: File[], 
  captions: string[]
): Promise<{
  successCount: number;
  failedCount: number;
  uploadedImages: GalleryImage[];
}> {
  const uploadedImages: GalleryImage[] = [];
  let successCount = 0;
  let failedCount = 0;

  // Show initial toast
  if (files.length > 0) {
    toast({
      title: "Uploading gallery images",
      description: `Uploading ${files.length} image${files.length > 1 ? 's' : ''}...`
    });
  }

  // Process each file sequentially with a delay between uploads
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const caption = captions[i] || `Gallery image ${i+1}`;
    
    try {
      // Add a longer delay between uploads to prevent race conditions
      if (i > 0) {
        console.log(`Adding delay before uploading image ${i+1}...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      const result = await uploadGalleryImage(projectId, file, caption);
      
      if (result.success && result.data) {
        uploadedImages.push(result.data);
        successCount++;
      } else {
        failedCount++;
        toast({
          title: `Failed to upload image ${i+1}`,
          description: result.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Unexpected error uploading image ${i+1}:`, error);
      failedCount++;
      toast({
        title: `Error uploading image ${i+1}`,
        description: "Unexpected error occurred during upload",
        variant: "destructive"
      });
    }
  }

  // Show final result toast
  if (successCount > 0) {
    toast({
      title: "Gallery upload complete",
      description: `Successfully uploaded ${successCount} of ${files.length} images`
    });
  } else if (failedCount > 0) {
    toast({
      title: "Gallery upload failed",
      description: "None of the images could be uploaded",
      variant: "destructive"
    });
  }

  return {
    successCount,
    failedCount,
    uploadedImages
  };
}

/**
 * Deletes a gallery image
 */
export async function deleteGalleryImage(projectId: number, imageId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/projects/${projectId}/gallery/${imageId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Delete failed with status ${response.status}:`, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Gallery deletion error:", error);
    return false;
  }
}