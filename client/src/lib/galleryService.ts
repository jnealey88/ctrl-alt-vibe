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
 * Uploads a single gallery image for a project
 */
export async function uploadGalleryImage(projectId: number, file: File, caption: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('galleryImage', file);
  formData.append('caption', caption);

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

    // Use XMLHttpRequest for better control over the upload process
    return await new Promise<UploadResult>((resolve) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', `/api/projects/${projectId}/gallery`, true);
      xhr.withCredentials = true;
      
      // Handle successful response
      xhr.onload = function() {
        // Capture response text immediately
        const responseText = xhr.responseText;
        
        // Log the actual response for debugging
        console.log(`Upload response status: ${xhr.status}`);
        
        // Check if the response looks like HTML (common error response)
        const isLikelyHTML = responseText.trim().startsWith('<!DOCTYPE') || 
                             responseText.trim().startsWith('<html') ||
                             responseText.includes('</html>');
        
        if (isLikelyHTML) {
          console.error("Server returned HTML instead of JSON", responseText.substring(0, 200));
          resolve({
            success: false,
            error: "Server returned HTML response instead of JSON data"
          });
          return;
        }
        
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log(`Upload successful with status ${xhr.status}`);
          
          // If response is empty, consider it a success but with empty data
          if (!responseText || responseText.trim() === '') {
            console.log("Empty successful response, assuming success with empty data");
            resolve({
              success: true,
              data: {
                id: 0,
                projectId: projectId,
                imageUrl: 'pending', // Placeholder, will be refreshed from database
                caption: caption,
                displayOrder: 0,
                createdAt: new Date().toISOString()
              }
            });
            return;
          }
          
          // Try to parse JSON
          try {
            const data = JSON.parse(responseText);
            
            if (!data.galleryImage) {
              console.error("Response missing galleryImage data:", data);
              resolve({
                success: true, // Still count it as success since the server accepted it
                data: {
                  id: 0,
                  projectId: projectId,
                  imageUrl: 'pending', // Will be refreshed from database
                  caption: caption,
                  displayOrder: 0,
                  createdAt: new Date().toISOString()
                }
              });
              return;
            }
            
            console.log("Gallery image upload successful:", data.galleryImage);
            resolve({
              success: true,
              data: data.galleryImage
            });
          } catch (parseErr) {
            console.error("Failed to parse JSON response:", responseText.substring(0, 200), parseErr);
            // Count as success anyway since the server returned 200
            resolve({
              success: true,
              data: {
                id: 0,
                projectId: projectId,
                imageUrl: 'pending', // Will be refreshed from database
                caption: caption,
                displayOrder: 0,
                createdAt: new Date().toISOString()
              }
            });
          }
        } else {
          console.error(`Upload failed with status ${xhr.status}:`, responseText.substring(0, 200));
          
          let errorMessage = `Server error (${xhr.status})`;
          if (!isLikelyHTML) {
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              // If we can't parse JSON, use the status text
              errorMessage = xhr.statusText || errorMessage;
            }
          }
          
          resolve({
            success: false,
            error: errorMessage
          });
        }
      };
      
      // Handle network errors
      xhr.onerror = function() {
        console.error("Network error during upload");
        resolve({
          success: false,
          error: "Network error during upload"
        });
      };
      
      // Handle timeout
      xhr.ontimeout = function() {
        console.error("Upload timed out");
        resolve({
          success: false,
          error: "Upload request timed out"
        });
      };
      
      xhr.send(formData);
    });
  } catch (error) {
    console.error("Unexpected gallery upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during upload"
    };
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
      // Add a small delay between uploads to prevent race conditions
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 800));
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