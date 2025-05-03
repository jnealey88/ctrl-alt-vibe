import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SEO from "@/components/SEO";
import { BlogTag, BlogCategory } from "@shared/schema";

// No need for additional window declarations

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ArrowLeft, Info, Image as ImageIcon, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Quill editor components (using v2.0)
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';
// Note: Using Quill 2.0 with improved table handling

const BlogEditor = () => {
  // Set up ref for Quill editor (Quill 2.0 approach)
  const quillRef = useRef<ReactQuill>(null);
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [_, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [tldr, setTldr] = useState<string>("");
  const [isGeneratingTldr, setIsGeneratingTldr] = useState(false);
  const [featuredImage, setFeaturedImage] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  
  // Category and tag creation state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  // Custom handler for table insertion
  const insertTable = function(this: any) {
    const quill = this.quill;
    if (quill) {
      // Get current selection position
      const range = quill.getSelection();
      if (range) {
        // Create a clean styled table - 3x3
        const tableHTML = `
          <table>
            <thead>
              <tr>
                <th>Header 1</th>
                <th>Header 2</th>
                <th>Header 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Row 1, Cell 1</td>
                <td>Row 1, Cell 2</td>
                <td>Row 1, Cell 3</td>
              </tr>
              <tr>
                <td>Row 2, Cell 1</td>
                <td>Row 2, Cell 2</td>
                <td>Row 2, Cell 3</td>
              </tr>
            </tbody>
          </table>
        `;
        
        // Insert the table at cursor position
        quill.clipboard.dangerouslyPasteHTML(range.index, tableHTML, 'user');
        
        // Move cursor after the table
        quill.setSelection(range.index + 1, 0);
        
        // Add a notification for users
        toast({
          title: "Table Inserted",
          description: "You can edit the table by clicking on cells. Add more rows/columns by copying and pasting.",
          duration: 3000
        });
      }
    }
  };

  // Editor configuration with standard Quill 2.0 modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'code-block'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
    keyboard: {
      bindings: {}
    }
  };
  
  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'color', 'background',
    'list', 'bullet', 'indent',
    'link', 'image', 'code-block',
    'script',
    'align',
  ];

  // Function to insert a table via a normal button (Quill 2.0 approach using ref)
  const handleInsertTable = () => {
    // Create table HTML
    const tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
            <th>Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Row 1, Cell 1</td>
            <td>Row 1, Cell 2</td>
            <td>Row 1, Cell 3</td>
          </tr>
          <tr>
            <td>Row 2, Cell 1</td>
            <td>Row 2, Cell 2</td>
            <td>Row 2, Cell 3</td>
          </tr>
        </tbody>
      </table>
    `;
    
    // Get Quill editor instance from ref
    const editor = quillRef.current?.getEditor();
    if (editor) {
      // Get current selection
      const range = editor.getSelection();
      const index = range ? range.index : editor.getLength();
      
      // Insert the table at cursor position
      editor.clipboard.dangerouslyPasteHTML(index, tableHTML, 'user');
      
      // Move cursor after the table
      editor.setSelection(index + 1, 0);
    } else {
      // Fallback if editor not available
      setContent(content + tableHTML);
    }
    
    // Notify user
    toast({
      title: "Table Inserted",
      description: "You can edit the table by clicking on cells.",
      duration: 3000
    });
  };

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

  // Generate TL;DR mutation
  const generateTldrMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest("POST", `/api/blog/posts/${postId}/generate-tldr`).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "TL;DR Generated",
        description: "AI-generated summary created successfully."
      });
      if (data?.tldr) {
        setTldr(data.tldr);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to generate TL;DR: ${error.message}`,
        variant: "destructive"
      });
    }
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
      setTldr(post.tldr || "");
      setFeaturedImage(post.featuredImage || ""); // Use camelCase for frontend
      setCategoryId(post.category?.id || null);
      
      if (post.tags && Array.isArray(post.tags) && tagsData?.tags) {
        const tagIds = tagsData.tags
          .filter((tag: BlogTag) => post.tags.includes(tag.name))
          .map((tag: BlogTag) => tag.id);
        setSelectedTags(tagIds);
      }
      
      // Content is already set via the useState, no need to update ReactQuill manually
    }
  }, [isEditMode, blogPostData, tagsData]);


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
    
    // Validate summary length
    if (summary.trim().length < 10) {
      toast({
        title: "Validation Error",
        description: "Summary must be at least 10 characters long",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate slug from title if needed
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const postData = {
        title,
        slug, // Add the slug field
        content,
        summary,
        tldr: tldr || null, // Include TL;DR if available
        featuredImage: featuredImage, // Using camelCase for frontend-to-backend communications
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

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      return apiRequest("POST", "/api/blog/categories", categoryData).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Category Created",
        description: "New category has been created successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/categories"] });
      setNewCategoryName("");
      if (data?.category?.id) {
        setCategoryId(data.category.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create category: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (tagData: any) => {
      return apiRequest("POST", "/api/blog/tags", tagData).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Tag Created",
        description: "New tag has been created successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/tags"] });
      setNewTagName("");
      if (data?.tag?.id) {
        setSelectedTags(prev => [...prev, data.tag.id]);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create tag: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Handle creating a new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsCreatingCategory(true);
    try {
      const slug = newCategoryName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
        slug
      });
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Handle creating a new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    setIsCreatingTag(true);
    try {
      const slug = newTagName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      await createTagMutation.mutateAsync({
        name: newTagName.trim(),
        slug
      });
    } catch (error) {
      console.error("Error creating tag:", error);
    } finally {
      setIsCreatingTag(false);
    }
  };

  // Handle TL;DR generation
  const handleGenerateTldr = async () => {
    if (!isEditMode) {
      toast({
        title: "Save First",
        description: "Please save your post before generating a TL;DR summary.",
        variant: "default"
      });
      return;
    }
    
    setIsGeneratingTldr(true);
    try {
      await generateTldrMutation.mutateAsync(parseInt(id));
    } catch (error) {
      console.error("Error generating TL;DR:", error);
    } finally {
      setIsGeneratingTldr(false);
    }
  };

  // Handle toggle tag selection
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
              <div className="flex justify-between items-center mb-2">
                <CardTitle className="text-lg font-medium">{activeTab === "content" ? "Content Editor" : "Preview"}</CardTitle>
                {activeTab === "content" && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleInsertTable}
                    type="button"
                    className="flex items-center gap-1 text-xs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-table">
                      <path d="M9 3H5a2 2 0 0 0-2 2v4"/>
                      <path d="M9 3h10a2 2 0 0 1 2 2v4"/>
                      <path d="M9 21h-4a2 2 0 0 1-2-2v-4"/>
                      <path d="M9 21h10a2 2 0 0 0 2-2v-4"/>
                      <path d="M3 9h18"/>
                      <path d="M3 15h18"/>
                      <path d="M9 3v18"/>
                      <path d="M15 3v18"/>
                    </svg>
                    Insert Table
                  </Button>
                )}
              </div>
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
                    <div className="flex justify-between items-center">
                      <Label htmlFor="summary" className="text-base font-medium">Summary</Label>
                      <span className={`text-xs ${summary.length < 10 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {summary.length}/10+ characters
                      </span>
                    </div>
                    <Textarea 
                      id="summary" 
                      placeholder="Brief summary of your post (minimum 10 characters)" 
                      value={summary} 
                      onChange={(e) => setSummary(e.target.value)}
                      className={`mt-1.5 resize-none h-20 ${summary.length < 10 && summary.length > 0 ? 'border-destructive' : ''}`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="tldr" className="text-base font-medium">TL;DR (AI-Generated Summary)</Label>
                      {isEditMode && (
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          className="h-7 gap-1 text-xs" 
                          onClick={handleGenerateTldr}
                          disabled={isGeneratingTldr}
                        >
                          {isGeneratingTldr ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <span className="text-xs">✨</span>
                              Generate TL;DR
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <Textarea 
                      id="tldr" 
                      placeholder={isEditMode ? "Click 'Generate TL;DR' to create an AI summary of your post" : "Save your post first to generate a TL;DR"} 
                      value={tldr} 
                      onChange={(e) => setTldr(e.target.value)}
                      className="mt-1.5 resize-none h-20"
                    />
                    <p className="text-xs text-muted-foreground mt-1">A concise, AI-generated summary will appear at the top of your blog post.</p>
                  </div>
                  
                  <div>
                    <div className="mb-1.5">
                      <Label htmlFor="editor" className="text-base font-medium">Content</Label>
                    </div>
                    <div className="mt-1.5 sticky top-4 z-10">
                      {/* ReactQuill Editor with Quill 2.0 */}
                      <ReactQuill
                        ref={quillRef}
                        id="editor"
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Write your blog post content here..."
                        className="rounded-md overflow-hidden h-[400px]"
                      />
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
                    <div className="mb-4 text-muted-foreground">
                      <p className="text-sm font-medium">Summary:</p>
                      <p>{summary}</p>
                    </div>
                  )}

                  {tldr && (
                    <div className="mb-6 p-4 bg-muted/30 rounded-md border">
                      <p className="text-sm font-medium mb-1">TL;DR:</p>
                      <p className="italic text-sm">{tldr}</p>
                    </div>
                  )}
                  
                  {content ? (
                    <div 
                      className="prose max-w-none ql-editor" 
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
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
                <Label htmlFor="featuredImage" className="text-sm font-medium">Featured Image</Label>
                <div className="mt-1.5 space-y-3">
                  {featuredImage ? (
                    <div className="border rounded-md overflow-hidden relative group">
                      <img 
                        src={featuredImage} 
                        alt="Featured image preview" 
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          // Show a proper branded fallback instead of an external dependency
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-primary/5', 'to-primary/20', 'flex', 'items-center', 'justify-center');
                          const icon = document.createElement('div');
                          icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary/50"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M2 15h10"></path><path d="M9 18h3"></path><path d="M2 12h5"></path></svg>';
                          e.currentTarget.parentElement?.appendChild(icon);
                          
                          const errorText = document.createElement('div');
                          errorText.className = 'text-sm text-primary/70 mt-2';
                          errorText.innerText = 'Image could not be loaded';
                          e.currentTarget.parentElement?.appendChild(errorText);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-white h-9 text-sm"
                          onClick={() => setFeaturedImage("")}
                        >
                          Remove
                        </Button>
                        <Label 
                          htmlFor="imageUpload" 
                          className="cursor-pointer flex items-center justify-center h-9 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm"
                        >
                          Change Image
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed rounded-md p-6 text-center flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-colors">

                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">Add Featured Image</p>
                        <p className="text-sm text-muted-foreground">Upload a high-quality image to make your post stand out</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Label 
                          htmlFor="imageUpload" 
                          className="cursor-pointer flex items-center justify-center h-9 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm"
                        >
                          Upload Image
                        </Label>
                        <p className="text-xs text-muted-foreground">or paste URL below</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input 
                        id="featuredImage" 
                        placeholder="https://example.com/image.jpg" 
                        value={featuredImage} 
                        onChange={(e) => setFeaturedImage(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      // Check file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        toast({
                          title: "Error",
                          description: "Image size should be less than 5MB",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      try {
                        setIsUploadingImage(true);
                        
                        // Create FormData
                        const formData = new FormData();
                        formData.append('image', file);
                        
                        // Upload the image
                        const response = await fetch('/api/upload/image', {
                          method: 'POST',
                          body: formData,
                        });
                        
                        const data = await response.json();
                        
                        if (!response.ok) {
                          throw new Error(data.message || 'Failed to upload image');
                        }
                        
                        setFeaturedImage(data.fileUrl);
                        
                        toast({
                          title: "Success",
                          description: "Image uploaded successfully",
                        });
                      } catch (error) {
                        console.error('Error uploading image:', error);
                        toast({
                          title: "Error",
                          description: error instanceof Error ? error.message : "Failed to upload image",
                          variant: "destructive"
                        });
                      } finally {
                        setIsUploadingImage(false);
                      }
                    }}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <div className="mt-1.5 space-y-2">
                  <Select 
                    value={categoryId ? categoryId.toString() : ""} 
                    onValueChange={(value) => setCategoryId(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger>
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
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder="New category name" 
                      value={newCategoryName} 
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={handleCreateCategory}
                      disabled={isCreatingCategory || !newCategoryName.trim()}
                      className="whitespace-nowrap"
                    >
                      {isCreatingCategory ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Tags</Label>
                <div className="space-y-4 mt-1.5">
                  {tagsData?.tags && tagsData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md max-h-60 overflow-y-auto">
                      {tagsData.tags.map((tag: BlogTag) => (
                        <div key={tag.id} className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md">
                          <Checkbox 
                            id={`tag-${tag.id}`} 
                            checked={selectedTags.includes(tag.id)}
                            onCheckedChange={() => handleTagToggle(tag.id)}
                          />
                          <Label htmlFor={`tag-${tag.id}`} className="text-sm cursor-pointer">{tag.name}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder="New tag name" 
                      value={newTagName} 
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={handleCreateTag}
                      disabled={isCreatingTag || !newTagName.trim()}
                      className="whitespace-nowrap"
                    >
                      {isCreatingTag ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <p className="text-sm text-muted-foreground mb-1 w-full">Selected tags:</p>
                      {selectedTags.map(tagId => {
                        const tag = tagsData?.tags?.find((t: BlogTag) => t.id === tagId);
                        return tag ? (
                          <div key={tag.id} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                            {tag.name}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSubmit} 
                className="w-full" 
                disabled={isSubmitting || isUploadingImage || !title || !content}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isUploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading Image...
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
