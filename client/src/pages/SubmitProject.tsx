import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCodingTools } from "@/hooks/use-coding-tools";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
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
import { Upload, Image, Loader2 } from "lucide-react";
import { projectInsertSchema } from "@shared/schema";

// Import Quill editor components (using v2.0)
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';

// Modified schema for client-side validation
const submitProjectSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must be less than 500 characters"),
  longDescription: z.string().optional(),
  projectUrl: z.string()
    .refine(val => {
      // Allow empty strings (will be caught by required validation)
      if (!val) return true;
      
      // Add https:// prefix if missing for validation
      const urlToValidate = val.startsWith('http') ? val : `https://${val}`;
      try {
        new URL(urlToValidate);
        return true;
      } catch {
        return false;
      }
    }, "Please enter a valid URL"),
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

type FormValues = z.infer<typeof submitProjectSchema>;

const SubmitProject = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [showUrlExtraction, setShowUrlExtraction] = useState(false);
  const [extractUrl, setExtractUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  
  // Fetch AI coding tools from database
  const { tools, isLoading: isLoadingAiTools } = useCodingTools();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(submitProjectSchema),
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
  
  // Mutation for extracting URL metadata
  const extractMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/extract-url-metadata", { url });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.metadata) {
        // Populate the form with the extracted metadata
        form.setValue("title", data.metadata.title || "");
        form.setValue("description", data.metadata.description || "");
        form.setValue("projectUrl", extractUrl);
        // Make sure we have a valid image URL that's either from our uploads directory or a full https URL
        const imageUrl = data.metadata.imageUrl || "";
        form.setValue("imageUrl", imageUrl.startsWith('/uploads/') || imageUrl.startsWith('http') ? imageUrl : "");
        
        toast({
          title: "URL Processed",
          description: "We've extracted the details from your URL.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to extract metadata from URL. Please try again.",
          variant: "destructive",
        });
      }
      setIsExtractingUrl(false);
      setShowUrlExtraction(false);
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to extract metadata from URL. Please try again.",
        variant: "destructive",
      });
      setIsExtractingUrl(false);
    },
  });

  // Mutation for submitting the project
  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Project submitted",
        description: "Your project has been successfully submitted.",
      });
      setLocation(`/projects/${data.project.id}`);
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to submit project. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Function to handle URL extraction
  const handleExtractUrl = () => {
    if (!extractUrl) {
      toast({
        title: "Error",
        description: "Please enter a URL first.",
        variant: "destructive",
      });
      return;
    }
    
    // Basic URL validation
    if (!extractUrl.startsWith('http')) {
      toast({
        title: "Error",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }
    
    setIsExtractingUrl(true);
    extractMutation.mutate(extractUrl);
  };
  
  const onSubmit = (data: FormValues) => {
    submitMutation.mutate(data);
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
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-card overflow-hidden mb-16">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground font-space">Submit Your Project</h2>
          </div>
          
          <div className="mb-8">
            <Card className="p-4 border border-gray-200 bg-gray-50">
              <div className="space-y-4">
                <div className="flex items-center">
                  <ExternalLink className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="text-lg font-medium">Quick Project Import</h3>
                </div>
                <p className="text-sm text-gray-600">Enter your project URL and we'll automatically extract its title, description, and screenshot.</p>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input 
                      type="url" 
                      placeholder="https://your-project-url.com" 
                      value={extractUrl}
                      onChange={(e) => setExtractUrl(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleExtractUrl}
                    disabled={isExtractingUrl}
                    className="whitespace-nowrap"
                  >
                    {isExtractingUrl ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting...
                      </>
                    ) : "Extract Info"}
                  </Button>
                </div>
              </div>
            </Card>
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
                      <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Provide more details about your project, its features, technologies used, etc."
                        className="rounded-md overflow-hidden min-h-[250px]"
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['link', 'image', 'code-block'],
                            ['clean']
                          ],
                          clipboard: {
                            matchVisual: false,
                          }
                        }}
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
                <Button 
                  type="submit" 
                  className="w-full py-3"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Project"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default SubmitProject;
