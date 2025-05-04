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
import { Switch } from "@/components/ui/switch";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import TagSelector from "@/components/TagSelector";

// Schema for the URL submission form
const urlSubmitSchema = z.object({
  url: z.string()
    .url("Please enter a valid URL")
    .startsWith("http", "URL must start with http:// or https://"),
});

type UrlFormValues = z.infer<typeof urlSubmitSchema>;

// Schema for the complete project submission form
const quickSubmitProjectSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must be less than 500 characters"),
  projectUrl: z.string()
    .url("Please enter a valid URL")
    .startsWith("http", "URL must start with http:// or https://"),
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
      message: "Please provide a valid image URL"
    }),
  tags: z.array(z.string())
    .min(1, "Please add at least 1 tag")
    .max(5, "Maximum 5 tags allowed"),
  isPrivate: z.boolean().default(false),
});

type QuickFormValues = z.infer<typeof quickSubmitProjectSchema>;

const QuickSubmitProject = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  
  // URL form for initial quick submission
  const urlForm = useForm<UrlFormValues>({
    resolver: zodResolver(urlSubmitSchema),
    defaultValues: {
      url: "",
    },
  });
  
  // Complete project form that shows after metadata extraction
  const projectForm = useForm<QuickFormValues>({
    resolver: zodResolver(quickSubmitProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      projectUrl: "",
      imageUrl: "",
      isPrivate: false,
      tags: [],
    },
  });
  
  // Mutation for extracting URL metadata
  const extractMutation = useMutation({
    mutationFn: async (data: UrlFormValues) => {
      const response = await apiRequest("POST", "/api/extract-url-metadata", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.metadata) {
        // Populate the project form with the extracted metadata
        projectForm.setValue("title", data.metadata.title || "");
        projectForm.setValue("description", data.metadata.description || "");
        projectForm.setValue("projectUrl", urlForm.getValues().url);
        projectForm.setValue("imageUrl", data.metadata.imageUrl || "");
        
        // Show the full form
        setShowFullForm(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to extract metadata from URL. Please try again.",
          variant: "destructive",
        });
      }
      setIsSubmittingUrl(false);
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to extract metadata from URL. Please try again.",
        variant: "destructive",
      });
      setIsSubmittingUrl(false);
    },
  });
  
  // Mutation for submitting the complete project
  const submitMutation = useMutation({
    mutationFn: async (data: QuickFormValues) => {
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
  
  // Handler for URL submission
  const onSubmitUrl = (data: UrlFormValues) => {
    setIsSubmittingUrl(true);
    extractMutation.mutate(data);
  };
  
  // Handler for complete project submission
  const onSubmitProject = (data: QuickFormValues) => {
    submitMutation.mutate(data);
  };
  
  return (
    <div className="container py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Submit Your Project</h1>
        <p className="mt-3 text-gray-500 max-w-[600px] mx-auto">
          Share your amazing project with our community. Just paste a URL and we'll take care of the rest.
        </p>
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm p-6 md:p-8">
        {!showFullForm ? (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <LinkIcon className="mr-2 h-5 w-5" />
              Quick Project Submission
            </h2>
            <p className="text-muted-foreground mb-6">Enter your project URL and we'll automatically grab the details for you.</p>
            
            <Form {...urlForm}>
              <form onSubmit={urlForm.handleSubmit(onSubmitUrl)} className="space-y-6">
                <FormField
                  control={urlForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="https://your-project-url.com" 
                          type="url" 
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full py-3 mt-4"
                  disabled={isSubmittingUrl}
                >
                  {isSubmittingUrl ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting project details...
                    </>
                  ) : "Continue"}
                </Button>
              </form>
            </Form>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Review Project Details</h2>
            <p className="text-muted-foreground mb-6">We've extracted info from your URL. Review and submit!</p>
            
            <Form {...projectForm}>
              <form onSubmit={projectForm.handleSubmit(onSubmitProject)} className="space-y-6">
                <FormField
                  control={projectForm.control}
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
                  control={projectForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Briefly describe your project" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={projectForm.control}
                  name="projectUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://" type="url" readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={projectForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Tags (Required)</FormLabel>
                      <FormControl>
                        <TagSelector 
                          value={field.value} 
                          onChange={(tags: string[]) => field.onChange(tags)}
                          maxTags={5}
                          className="min-h-[80px] mt-1"
                        />
                      </FormControl>
                      <FormDescription>
                        Add up to 5 tags to help others discover your project. Press Enter or comma after each tag.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={projectForm.control}
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
        )}
      </div>
    </div>
  );
};

export default QuickSubmitProject;