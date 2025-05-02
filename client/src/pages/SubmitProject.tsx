import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import TagsInput from "@/components/TagsInput";
import { Upload, Image } from "lucide-react";
import { projectInsertSchema } from "@shared/schema";

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
    .url("Please enter a valid URL")
    .startsWith("http", "URL must start with http:// or https://"),
  imageUrl: z.string()
    .url("Please enter a valid image URL")
    .startsWith("http", "URL must start with http:// or https://"),
  tags: z.array(z.string())
    .min(1, "Please add at least 1 tag")
    .max(5, "Maximum 5 tags allowed"),
});

type FormValues = z.infer<typeof submitProjectSchema>;

const SubmitProject = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(submitProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      longDescription: "",
      projectUrl: "",
      imageUrl: "",
      tags: [],
    },
  });
  
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
  
  const onSubmit = (data: FormValues) => {
    submitMutation.mutate(data);
  };
  
  const handleImageUpload = () => {
    // In a real implementation, this would handle file upload
    // For now, we'll simulate by just showing a toast
    setIsUploading(true);
    setTimeout(() => {
      form.setValue("imageUrl", "https://images.unsplash.com/photo-1607798748738-b15c40d33d57?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80");
      setIsUploading(false);
      toast({
        title: "Image uploaded",
        description: "Your image has been successfully uploaded.",
      });
    }, 1500);
  };
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-card overflow-hidden mb-16">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground font-space">Submit Your Project</h2>
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
                      <Textarea 
                        {...field} 
                        placeholder="Provide more details about your project, its features, technologies used, etc." 
                        rows={8}
                      />
                    </FormControl>
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
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
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
                              <span>Upload a file</span>
                              <input 
                                id="file-upload" 
                                name="file-upload" 
                                type="file" 
                                className="sr-only" 
                                onChange={handleImageUpload}
                                disabled={isUploading}
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
                      <TagsInput 
                        value={field.value} 
                        onChange={field.onChange}
                        placeholder="Type and press Enter to add tags..."
                        maxTags={5}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500">Add up to 5 tags (e.g., AI, Productivity, Code)</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-4 border-t border-gray-200">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3"
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
