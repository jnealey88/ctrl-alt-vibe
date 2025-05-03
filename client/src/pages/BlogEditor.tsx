import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SEO from "@/components/SEO";
import { BlogTag, BlogCategory } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ArrowLeft, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import TipTap components
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlock from '@tiptap/extension-code-block';

const BlogEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [_, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your blog post content here...',
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      CodeBlock,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  // Fetch blog post in edit mode
  const { data: blogPostData, isLoading: blogPostLoading } = useQuery({
    queryKey: ["/api/blog/posts", id],
    queryFn: () => apiRequest("GET", `/api/blog/posts/${id}`).then(res => res.json()),
    enabled: isEditMode && !!user && user.role === "admin",
  });

  // Fetch blog categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/blog/categories"],
    queryFn: () => apiRequest("GET", "/api/blog/categories").then(res => res.json()),
    enabled: !!user && user.role === "admin",
  });

  // Fetch blog tags
  const { data: tagsData, isLoading: tagsLoading } = useQuery({
    queryKey: ["/api/blog/tags"],
    queryFn: () => apiRequest("GET", "/api/blog/tags").then(res => res.json()),
    enabled: !!user && user.role === "admin",
  });

  // Create blog post mutation
  const createBlogPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      return apiRequest("POST", "/api/blog/posts", postData).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Blog Post Created",
        description: "Your blog post has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create blog post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update blog post mutation
  const updateBlogPostMutation = useMutation({
    mutationFn: async ({ id, postData }: { id: number, postData: any }) => {
      return apiRequest("PUT", `/api/blog/posts/${id}`, postData).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Blog Post Updated",
        description: "Your blog post has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts", id] });
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update blog post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Initialize form with post data in edit mode
  useEffect(() => {
    if (isEditMode && blogPostData?.post) {
      const post = blogPostData.post;
      setTitle(post.title || "");
      setContent(post.content || "");
      setSummary(post.summary || "");
      setFeaturedImage(post.featuredImage || "");
      setCategoryId(post.category?.id || null);
      
      if (post.tags && Array.isArray(post.tags) && tagsData?.tags) {
        const tagIds = tagsData.tags
          .filter((tag: BlogTag) => post.tags.includes(tag.name))
          .map((tag: BlogTag) => tag.id);
        setSelectedTags(tagIds);
      }
      
      // Update Tiptap editor content
      if (editor && post.content) {
        editor.commands.setContent(post.content);
      }
    }
  }, [isEditMode, blogPostData, tagsData, editor]);

  // Redirect non-admin users away from this page
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the blog editor.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, authLoading, setLocation, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const postData = {
        title,
        content,
        summary,
        featuredImage,
        categoryId: categoryId || undefined,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
      };
      
      if (isEditMode) {
        await updateBlogPostMutation.mutateAsync({ id: parseInt(id), postData });
      } else {
        await createBlogPostMutation.mutateAsync(postData);
      }
    } catch (error) {
      console.error("Error submitting blog post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  // Loading state
  const isLoading = authLoading || (isEditMode && blogPostLoading) || categoriesLoading || tagsLoading;

  // If not authenticated or loading authentication
  if (authLoading || (!user || user.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {authLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <div className="text-center">
            <p className="text-gray-500 mb-4">You do not have permission to access this page.</p>
            <Button onClick={() => setLocation("/")}>Return to Homepage</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <SEO 
        title={isEditMode ? "Edit Blog Post | Ctrl Alt Vibe" : "Create Blog Post | Ctrl Alt Vibe"}
        description={isEditMode ? "Edit your blog post with our easy-to-use editor." : "Create new blog content for the Ctrl Alt Vibe community."}
        keywords={["blog editor", "content creation", "admin tools", "cms"]}
      />
      
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation("/admin")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Admin
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Edit Blog Post" : "Create New Blog Post"}
          </h1>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !title || !content}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Post
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium mb-2">{activeTab === "content" ? "Content Editor" : "Preview"}</CardTitle>
              <div className="flex space-x-2 mt-2">
                <Button
                  variant={activeTab === "content" ? "default" : "outline"}
                  onClick={() => setActiveTab("content")}
                  size="sm"
                >
                  Editor
                </Button>
                <Button
                  variant={activeTab === "preview" ? "default" : "outline"}
                  onClick={() => setActiveTab("preview")}
                  size="sm"
                >
                  Preview
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === "content" ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-base font-medium">Title</Label>
                    <Input 
                      id="title" 
                      placeholder="Blog post title" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className="mt-1.5"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="summary" className="text-base font-medium">Summary</Label>
                    <Textarea 
                      id="summary" 
                      placeholder="Brief summary of your post" 
                      value={summary} 
                      onChange={(e) => setSummary(e.target.value)}
                      className="mt-1.5 resize-none h-20"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="editor" className="text-base font-medium">Content</Label>
                    <div className="border rounded-md mt-1.5 p-4 min-h-[300px]">
                      <EditorContent editor={editor} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-md p-6">
                  {title ? (
                    <h1 className="text-2xl font-bold mb-4">{title}</h1>
                  ) : (
                    <p className="text-muted-foreground italic">No title</p>
                  )}
                  
                  {summary && (
                    <div className="mb-6 text-muted-foreground">
                      <p className="text-sm font-medium">Summary:</p>
                      <p>{summary}</p>
                    </div>
                  )}
                  
                  {content ? (
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
                  ) : (
                    <p className="text-muted-foreground italic">No content</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Post Settings</CardTitle>
              <CardDescription>Configure metadata for your post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="featuredImage" className="text-sm font-medium">Featured Image URL</Label>
                <Input 
                  id="featuredImage" 
                  placeholder="https://example.com/image.jpg" 
                  value={featuredImage} 
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  className="mt-1.5"
                />
                {featuredImage && (
                  <div className="mt-2 rounded-md overflow-hidden border">
                    <img 
                      src={featuredImage} 
                      alt="Featured image preview" 
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/600x400/EEE/999?text=Image+Error";
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <Select 
                  value={categoryId ? categoryId.toString() : ""} 
                  onValueChange={(value) => setCategoryId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {categoriesData?.categories?.map((category: BlogCategory) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Tags</Label>
                <div className="space-y-2 mt-1.5">
                  {tagsData?.tags && tagsData.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tagsData.tags.map((tag: BlogTag) => (
                        <div key={tag.id} className="flex items-center gap-2">
                          <Checkbox 
                            id={`tag-${tag.id}`} 
                            checked={selectedTags.includes(tag.id)}
                            onCheckedChange={() => handleTagToggle(tag.id)}
                          />
                          <Label htmlFor={`tag-${tag.id}`} className="text-sm cursor-pointer">{tag.name}</Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      <span>No tags available. Create tags in the admin dashboard.</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSubmit} 
                className="w-full" 
                disabled={isSubmitting || !title || !content}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditMode ? "Update Post" : "Publish Post"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
