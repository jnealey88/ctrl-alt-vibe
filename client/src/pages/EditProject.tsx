import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCodingTools } from "@/hooks/use-coding-tools";
import { useLocation, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Switch } from "@/components/ui/switch";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TagSelector from "@/components/TagSelector";
import GalleryUploader from "@/components/GalleryUploader";
import { Upload, Image, Loader2, AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Modified schema for client-side validation
const editProjectSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must be less than 500 characters"),
  longDescription: z.string().optional(),
  projectUrl: z.string()
    .url("Please enter a valid URL")
    .startsWith("http", "URL must start with http:// or https://"),
  vibeCodingTool: z.string().optional(),
  isPrivate: z.boolean().default(false),
  imageUrl: z.string()
    .refine(val => {
      // Allow URLs that start with http:// or https:// (remote images)
      if (val.startsWith('http://') || val.startsWith('https://')) {
        return true;
      }
      // Allow URLs that start with /uploads/ (local uploads)
      if (val.startsWith('/uploads/')) {
        return true;
      }
      return false;
    }, {
      message: "Please provide a valid image URL or upload an image"
    }),
  tags: z.array(z.string())
    .min(1, "Please add at least 1 tag")
    .max(5, "Maximum 5 tags allowed"),
});

type FormValues = z.infer<typeof editProjectSchema>;

const EditProject = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryCaptions, setGalleryCaptions] = useState<string[]>([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState<any[]>([]); 
  
  // Fetch AI coding tools from database
  const { tools, isLoading: isLoadingAiTools } = useCodingTools();
  
  const { data: projectData, isLoading: isLoadingProject, error: projectError } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      return response.json();
    },
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      longDescription: "",
      projectUrl: "",
      imageUrl: "",
      vibeCodingTool: "none",
      isPrivate: false,
      tags: [],
    },
  });
  
  // Set form values when project data is loaded
  // Fetch gallery images
  const { data: galleryData, isLoading: isLoadingGallery } = useQuery({
    queryKey: [`/api/projects/${projectId}/gallery`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/gallery`);
        if (!response.ok) {
          throw new Error('Failed to fetch gallery images');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching gallery:', error);
        return { galleryImages: [] };
      }
    },
    enabled: !!projectId && projectId > 0
  });

  // Set form values and gallery images when project data is loaded
  useEffect(() => {
    if (projectData?.project) {
      const project = projectData.project;
      form.reset({
        title: project.title,
        description: project.description,
        longDescription: project.longDescription || "",
        projectUrl: project.projectUrl,
        imageUrl: project.imageUrl,
        vibeCodingTool: project.vibeCodingTool || "none",
        isPrivate: project.isPrivate || false,
        tags: project.tags,
      });
    }
  }, [projectData, form]);
  
  // Set gallery images when gallery data is loaded
  useEffect(() => {
    if (galleryData?.galleryImages) {
      setExistingGalleryImages(galleryData.galleryImages);
    }
  }, [galleryData]);
  
  // Check if the current user is the author of the project
  const isAuthor = user && projectData?.project && user.id === projectData.project.author.id;
  
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("PUT", `/api/projects/${projectId}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Project updated",
        description: "Your project has been successfully updated.",
      });
      // Invalidate project cache to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation(`/projects/${projectId}`);
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/projects/${projectId}`);  
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Project deleted",
        description: "Your project has been successfully deleted.",
      });
      // Invalidate projects cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation("/");
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const uploadGalleryImages = async () => {
    if (galleryFiles.length === 0) {
      return [];
    }
    
    setIsUploading(true);
    const uploadedImages = [];
    
    try {
      // Upload each gallery image
      for (let i = 0; i < galleryFiles.length; i++) {
        const file = galleryFiles[i];
        const caption = galleryCaptions[i] || `Gallery image ${i+1}`;
        
        // Create FormData and append the file
        const formData = new FormData();
        formData.append('galleryImage', file);
        formData.append('caption', caption);
        
        // Log details about the file
        console.log(`Uploading gallery image ${i+1}:`, {
          fileName: file.name,
          fileType: file.type,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        });
        
        const response = await fetch(`/api/projects/${projectId}/gallery`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        // Get detailed error information if the request fails
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Upload failed with status ${response.status}:`, errorText);
          throw new Error(`Failed to upload gallery image ${i+1}: ${response.statusText}`);
        }
        
        const data = await response.json();
        uploadedImages.push(data.galleryImage);
      }
      
      // Invalidate gallery cache
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/gallery`] });
      
      toast({
        title: "Gallery images uploaded",
        description: `Successfully uploaded ${uploadedImages.length} gallery images`
      });
      
      return uploadedImages;
    } catch (error) {
      console.error('Gallery upload error:', error);
      toast({
        title: "Gallery upload failed", 
        description: error instanceof Error ? error.message : "There was a problem uploading your gallery images.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  // Handle gallery change from the GalleryUploader component
  const handleGalleryChange = (files: File[], captions: string[]) => {
    // Validate files
    const validFiles = files.filter((file, index) => {
      const size = file.size / 1024 / 1024; // in MB
      const isValidSize = size <= 5;
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      
      if (!isValidSize || !isValidType) {
        console.warn(`Invalid gallery file at index ${index}:`, { 
          name: file.name, 
          type: file.type, 
          size: `${size.toFixed(2)} MB`,
          isValidSize,
          isValidType
        });
      }
      
      return isValidSize && isValidType;
    });
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Some files were skipped",
        description: "Only image files (JPG, PNG, GIF, WebP) under 5MB are allowed.",
        variant: "destructive"
      });
    }
    
    console.log(`Gallery change: ${validFiles.length} valid files out of ${files.length} total`);
    setGalleryFiles(validFiles);
    setGalleryCaptions(captions.slice(0, validFiles.length));
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // First upload any new gallery images
      if (galleryFiles.length > 0) {
        console.log("Uploading gallery images...", { count: galleryFiles.length });
        const uploadedImages = await uploadGalleryImages();
        console.log("Gallery upload complete", { uploaded: uploadedImages.length });
      }
      
      // Then update the project data
      console.log("Updating project data...");
      updateMutation.mutate(data);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Submission Error",
        description: "There was a problem processing your form. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = () => {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
  };
  
  // Delete a gallery image
  const deleteGalleryMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await apiRequest("DELETE", `/api/projects/${projectId}/gallery/${imageId}`);
      if (!response.ok) {
        throw new Error('Failed to delete gallery image');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate gallery cache to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/gallery`] });
      toast({
        title: "Gallery image deleted",
        description: "The gallery image has been successfully removed."
      });
    },
    onError: (error) => {
      console.error('Error deleting gallery image:', error);
      toast({
        title: "Error",
        description: "Failed to delete gallery image. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleDeleteGalleryImage = (imageId: number) => {
    deleteGalleryMutation.mutate(imageId);
  };
  
  const processFile = async (file: File) => {
    const fileSize = file.size / 1024 / 1024; // in MB
    
    // Validate file size (max 5MB)
    if (fileSize > 5) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return false;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, GIF, or WebP image",
        variant: "destructive"
      });
      return false;
    }
    
    setIsUploading(true);
    
    // Create FormData and append the file
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      // Set the uploaded image URL to the form
      form.setValue("imageUrl", data.fileUrl);
      toast({
        title: "Image uploaded",
        description: "Your image has been successfully uploaded."
      });
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your image.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    await processFile(file);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };
  
  const triggerFileInput = (e: React.MouseEvent) => {
    // Prevent event propagation to avoid dialog reopening
    e.preventDefault();
    e.stopPropagation();
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  if (isLoadingProject) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }
  
  if (projectError || !projectData?.project) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="w-full max-w-lg">
          <AlertTriangle className="h-6 w-6" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load project. The project may not exist or you don't have permission to view it.
          </AlertDescription>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setLocation('/')}
          >
            Return to Home
          </Button>
        </Alert>
      </div>
    );
  }
  
  if (!isAuthor) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="w-full max-w-lg">
          <AlertTriangle className="h-6 w-6" />
          <AlertTitle>Permission Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to edit this project. Only the project creator can make changes.
          </AlertDescription>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setLocation(`/projects/${projectId}`)}
          >
            View Project
          </Button>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-card overflow-hidden mb-16">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground font-space">Edit Project</h2>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Delete Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your project
                    and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter a catchy title for your project" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="projectUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://" type="url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vibeCodingTool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vibe Coding Tool Used (Optional)</FormLabel>
                    <FormControl>
                      {isLoadingAiTools ? (
                        <div className="flex items-center"> 
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">Loading tools...</span>
                        </div>
                      ) : (
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an AI tool" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {tools && tools.length > 0 ? (
                              tools.map((tool) => (
                                <SelectItem key={tool.id} value={tool.name}>
                                  {tool.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="other">Other</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </FormControl>
                    <p className="text-sm text-gray-500">
                      Share which AI tool helped you create this project
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Describe what your project does and what makes it unique." 
                        rows={4}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500">Max 500 characters</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="longDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description (Optional)</FormLabel>
                    <FormControl>
                      <TiptapEditor
                        content={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Provide more details about your project, its features, technologies used, etc."
                        className="min-h-[250px]"
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500">Use the toolbar to format your content with headings, lists, code blocks, and more.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Thumbnail</FormLabel>
                    <div 
                      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-primary' : 'border-gray-300'} border-dashed rounded-md`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {field.value ? (
                        <div className="space-y-1 text-center">
                          <img 
                            src={field.value} 
                            alt="Project thumbnail" 
                            className="mx-auto h-32 w-auto object-cover rounded-md"
                          />
                          <div className="flex text-sm justify-center mt-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => form.setValue("imageUrl", "")}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-center">
                          <Image className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80">
                              <span onClick={(e) => triggerFileInput(e)}>Upload a file</span>
                              <input 
                                ref={fileInputRef}
                                id="file-upload" 
                                name="file-upload" 
                                type="file" 
                                className="sr-only" 
                                onChange={handleImageUpload}
                                disabled={isUploading}
                                accept="image/jpeg,image/png,image/gif,image/webp"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                          {isUploading && <p className="text-sm text-primary">Uploading...</p>}
                        </div>
                      )}
                    </div>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="hidden" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagSelector 
                        value={field.value} 
                        onChange={field.onChange}
                        maxTags={5}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500">Add up to 5 tags (e.g., AI, Productivity, Code)</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Project Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-semibold">Project Gallery</h3>
                  {isLoadingGallery && (
                    <div className="flex items-center"> 
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Loading gallery...</span>
                    </div>
                  )}
                </div>
                
                {/* Display existing gallery images */}
                {existingGalleryImages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Current Gallery Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {existingGalleryImages.map((image) => (
                        <div key={image.id} className="relative rounded-md overflow-hidden border border-border hover:border-primary transition-all group">
                          <div className="aspect-square w-full relative">
                            <img 
                              src={image.imageUrl} 
                              alt={image.caption || "Gallery image"}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="h-8 w-8 p-0 rounded-full"
                                onClick={() => handleDeleteGalleryImage(image.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {image.caption && (
                            <div className="p-2 text-xs truncate text-gray-700">
                              {image.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Add new gallery images */}
                <GalleryUploader 
                  onGalleryChange={handleGalleryChange}
                  maxImages={5 - (existingGalleryImages?.length || 0)}
                  className="mt-4"
                />
                <p className="text-xs text-muted-foreground">
                  Add up to 5 gallery images to showcase different aspects of your project.
                  These will be displayed in a gallery on your project page.
                </p>
              </div>
              
              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Private Project
                      </FormLabel>
                      <FormDescription>
                        When enabled, only you can see this project. It won't appear in public listings.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setLocation(`/projects/${projectId}`)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditProject;
