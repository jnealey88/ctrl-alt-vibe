import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { BlogPost, BlogCategory, BlogTag } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2, Star, Shield, User as UserIcon, PenSquare, BookOpen, Tag, FolderPlus, Edit, FileText, Plus, BarChart3, Users, BarChart, Heart, Bookmark, Share2, LineChart, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type User = {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
};

type Project = {
  id: number;
  title: string;
  projectUrl: string;
  imageUrl: string;
  author: {
    id: number;
    username: string;
  };
  featured: boolean;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
};

type Comment = {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
  };
  project: {
    id: number;
    title: string;
  };
  createdAt: string;
  reportCount?: number;
};

const AdminDashboard = () => {
  const [_, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("blog");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [commentsSearchQuery, setCommentsSearchQuery] = useState("");
  const [blogSearchQuery, setBlogSearchQuery] = useState("");
  const [blogCategorySearchQuery, setBlogCategorySearchQuery] = useState("");
  const [blogTagSearchQuery, setBlogTagSearchQuery] = useState("");
  const [blogSubTab, setBlogSubTab] = useState("posts");
  
  useEffect(() => {
    // Redirect non-admin users away from this page
    if (!authLoading && user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the admin dashboard.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, authLoading, setLocation, toast]);

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: User[] }>({
    queryKey: ["/api/admin/users", userSearchQuery],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (userSearchQuery) queryParams.append("search", userSearchQuery);
      return apiRequest("GET", `/api/admin/users?${queryParams.toString()}`).then(res => res.json());
    },
    enabled: !!user && user.role === "admin"
  });

  // Fetch projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery<{ projects: Project[] }>({
    queryKey: ["/api/admin/projects", projectSearchQuery],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (projectSearchQuery) queryParams.append("search", projectSearchQuery);
      return apiRequest("GET", `/api/admin/projects?${queryParams.toString()}`).then(res => res.json());
    },
    enabled: !!user && user.role === "admin"
  });

  // Fetch blog posts
  const { data: blogPostsData, isLoading: blogPostsLoading } = useQuery<{ posts: BlogPost[] }>({
    queryKey: ["/api/blog/posts", blogSearchQuery],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (blogSearchQuery) queryParams.append("search", blogSearchQuery);
      return apiRequest("GET", `/api/blog/posts?${queryParams.toString()}`).then(res => res.json());
    },
    enabled: !!user && user.role === "admin" && activeTab === "blog" && blogSubTab === "posts"
  });

  // Fetch blog categories
  const { data: blogCategoriesData, isLoading: blogCategoriesLoading } = useQuery<{ categories: BlogCategory[] }>({
    queryKey: ["/api/blog/categories", blogCategorySearchQuery],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (blogCategorySearchQuery) queryParams.append("search", blogCategorySearchQuery);
      return apiRequest("GET", `/api/blog/categories`).then(res => res.json());
    },
    enabled: !!user && user.role === "admin" && (activeTab === "blog")
  });

  // Fetch blog tags
  const { data: blogTagsData, isLoading: blogTagsLoading } = useQuery<{ tags: BlogTag[] }>({
    queryKey: ["/api/blog/tags", blogTagSearchQuery],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (blogTagSearchQuery) queryParams.append("search", blogTagSearchQuery);
      return apiRequest("GET", `/api/blog/tags`).then(res => res.json());
    },
    enabled: !!user && user.role === "admin" && (activeTab === "blog")
  });

  // Fetch reported comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery<{ comments: Comment[] }>({
    queryKey: ["/api/admin/reported-comments", commentsSearchQuery],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (commentsSearchQuery) queryParams.append("search", commentsSearchQuery);
      return apiRequest("GET", `/api/admin/reported-comments?${queryParams.toString()}`).then(res => res.json());
    },
    enabled: !!user && user.role === "admin"
  });

  // Mutation to delete a user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("DELETE", `/api/admin/user/${userId}`).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a project
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return apiRequest("DELETE", `/api/admin/project/${projectId}`).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Project Deleted",
        description: "The project has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest("DELETE", `/api/admin/comment/${commentId}`).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Comment Deleted",
        description: "The comment has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reported-comments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete comment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to toggle project featured status
  const toggleProjectFeatureMutation = useMutation({
    mutationFn: async ({ projectId, featured }: { projectId: number; featured: boolean }) => {
      return apiRequest("PUT", `/api/admin/projects/${projectId}/feature`, { featured }).then(res => res.json());
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.featured ? "Project Featured" : "Project Unfeatured",
        description: variables.featured 
          ? "The project has been featured on the homepage."
          : "The project has been removed from featured.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/featured"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update featured status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Blog mutations
  // Create blog post
  const createBlogPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      return apiRequest("POST", "/api/blog/posts", postData).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Blog Post Created",
        description: "The blog post has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create blog post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete blog post
  const deleteBlogPostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest("DELETE", `/api/blog/posts/${postId}`).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Blog Post Deleted",
        description: "The blog post has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete blog post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create blog category
  const createBlogCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      return apiRequest("POST", "/api/blog/categories", categoryData).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Category Created",
        description: "The blog category has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create blog category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete blog category
  const deleteBlogCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      return apiRequest("DELETE", `/api/blog/categories/${categoryId}`).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Category Deleted",
        description: "The blog category has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete blog category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create blog tag
  const createBlogTagMutation = useMutation({
    mutationFn: async (tagData: any) => {
      return apiRequest("POST", "/api/blog/tags", tagData).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Tag Created",
        description: "The blog tag has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/tags"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create blog tag: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete blog tag
  const deleteBlogTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      return apiRequest("DELETE", `/api/blog/tags/${tagId}`).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Tag Deleted",
        description: "The blog tag has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/tags"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete blog tag: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to update user role
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest("PUT", `/api/admin/users/${userId}/role`, { role }).then(res => res.json());
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Role Updated",
        description: `User role has been updated to ${variables.role}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update user role: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // If the user is not authenticated or not an admin and still loading, show a loading spinner
  if (authLoading || (!user || user.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {authLoading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-gray-500">Verifying admin access...</p>
          </div>
        ) : (
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
            <p className="text-gray-500 mb-4">You do not have permission to view this page.</p>
            <Button onClick={() => setLocation("/")}>Return to Homepage</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">Manage users, projects, and reported content</p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="comments">Reported Comments</TabsTrigger>
        </TabsList>
        
        {/* Blog Tab */}
        <TabsContent value="blog">
          <Card>
            <CardHeader>
              <CardTitle>Blog Management</CardTitle>
              <CardDescription>Create and manage blog content</CardDescription>
              <div className="mt-4">
                <Tabs value={blogSubTab} onValueChange={setBlogSubTab} className="w-full">
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="tags">Tags</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {/* Posts Sub-Tab */}
              {blogSubTab === "posts" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <Input 
                      placeholder="Search blog posts..." 
                      value={blogSearchQuery} 
                      onChange={(e) => setBlogSearchQuery(e.target.value)} 
                      className="max-w-sm"
                    />
                    <Button onClick={() => setLocation("/blog/new")}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Post
                    </Button>
                  </div>
                  
                  {blogPostsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : blogPostsData?.posts && blogPostsData.posts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Views</TableHead>
                            <TableHead>Published</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {blogPostsData.posts.map((post) => (
                            <TableRow key={post.id}>
                              <TableCell>{post.id}</TableCell>
                              <TableCell className="font-medium">{post.title}</TableCell>
                              <TableCell>{post.author?.username || "Unknown"}</TableCell>
                              <TableCell>{post.category?.name || "Uncategorized"}</TableCell>
                              <TableCell>{post.viewCount || 0}</TableCell>
                              <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setLocation(`/blog/edit/${post.id}`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Confirm Deletion</DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to delete the blog post "{post.title}"? This action cannot be undone.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <DialogFooter>
                                        <Button
                                          variant="destructive"
                                          onClick={() => deleteBlogPostMutation.mutate(post.id)}
                                          disabled={deleteBlogPostMutation.isPending}
                                        >
                                          {deleteBlogPostMutation.isPending ? "Deleting..." : "Delete Post"}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No blog posts found</p>
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => setLocation("/blog/new")}
                      >
                        Create your first blog post
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Categories Sub-Tab */}
              {blogSubTab === "categories" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <Input 
                      placeholder="Search categories..." 
                      value={blogCategorySearchQuery} 
                      onChange={(e) => setBlogCategorySearchQuery(e.target.value)} 
                      className="max-w-sm"
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          New Category
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Category</DialogTitle>
                          <DialogDescription>
                            Add a new category for organizing blog posts
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const name = formData.get("name") as string;
                          const description = formData.get("description") as string;
                          createBlogCategoryMutation.mutate({ name, description });
                          e.currentTarget.reset();
                        }}>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <label htmlFor="name" className="text-sm font-medium">Name</label>
                              <Input id="name" name="name" required />
                            </div>
                            <div className="grid gap-2">
                              <label htmlFor="description" className="text-sm font-medium">Description</label>
                              <Input id="description" name="description" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={createBlogCategoryMutation.isPending}>
                              {createBlogCategoryMutation.isPending ? "Creating..." : "Create Category"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {blogCategoriesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : blogCategoriesData?.categories && blogCategoriesData.categories.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {blogCategoriesData.categories.map((category) => (
                            <TableRow key={category.id}>
                              <TableCell>{category.id}</TableCell>
                              <TableCell className="font-medium">{category.name}</TableCell>
                              <TableCell>{category.slug}</TableCell>
                              <TableCell>{category.description || "-"}</TableCell>
                              <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Confirm Deletion</DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to delete the category "{category.name}"? This may affect blog posts assigned to this category.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <DialogFooter>
                                        <Button
                                          variant="destructive"
                                          onClick={() => deleteBlogCategoryMutation.mutate(category.id)}
                                          disabled={deleteBlogCategoryMutation.isPending}
                                        >
                                          {deleteBlogCategoryMutation.isPending ? "Deleting..." : "Delete Category"}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FolderPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No categories found</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Tags Sub-Tab */}
              {blogSubTab === "tags" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <Input 
                      placeholder="Search tags..." 
                      value={blogTagSearchQuery} 
                      onChange={(e) => setBlogTagSearchQuery(e.target.value)} 
                      className="max-w-sm"
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          New Tag
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Tag</DialogTitle>
                          <DialogDescription>
                            Add a new tag for categorizing blog posts
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const name = formData.get("name") as string;
                          createBlogTagMutation.mutate({ name });
                          e.currentTarget.reset();
                        }}>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <label htmlFor="tagName" className="text-sm font-medium">Name</label>
                              <Input id="tagName" name="name" required />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={createBlogTagMutation.isPending}>
                              {createBlogTagMutation.isPending ? "Creating..." : "Create Tag"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {blogTagsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : blogTagsData?.tags && blogTagsData.tags.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {blogTagsData.tags.map((tag) => (
                            <TableRow key={tag.id}>
                              <TableCell>{tag.id}</TableCell>
                              <TableCell className="font-medium">{tag.name}</TableCell>
                              <TableCell>{tag.slug}</TableCell>
                              <TableCell>{new Date(tag.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Confirm Deletion</DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to delete the tag "{tag.name}"? This may affect blog posts tagged with it.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <DialogFooter>
                                        <Button
                                          variant="destructive"
                                          onClick={() => deleteBlogTagMutation.mutate(tag.id)}
                                          disabled={deleteBlogTagMutation.isPending}
                                        >
                                          {deleteBlogTagMutation.isPending ? "Deleting..." : "Delete Tag"}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No tags found</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
              <div className="mt-4">
                <Input 
                  placeholder="Search users by username or email..." 
                  value={userSearchQuery} 
                  onChange={(e) => setUserSearchQuery(e.target.value)} 
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : usersData?.users && usersData.users.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData.users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className={
                              user.role === "admin" 
                                ? "bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium"
                                : "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium"
                            }>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Manage
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => updateUserRoleMutation.mutate({ 
                                      userId: user.id, 
                                      role: user.role === "admin" ? "user" : "admin" 
                                    })}
                                    disabled={updateUserRoleMutation.isPending}
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    {user.role === "admin" ? "Remove Admin Role" : "Make Admin"}
                                  </DropdownMenuItem>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                        <span className="text-red-500">Delete User</span>
                                      </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Confirm User Deletion</DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to delete user "{user.username}"? This action cannot be undone and will delete all user's projects, comments, and other data.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <DialogFooter>
                                        <Button
                                          variant="destructive"
                                          onClick={() => deleteUserMutation.mutate(user.id)}
                                          disabled={deleteUserMutation.isPending}
                                        >
                                          {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Project Management</CardTitle>
              <CardDescription>View and manage all projects</CardDescription>
              <div className="mt-4">
                <Input 
                  placeholder="Search projects by title..." 
                  value={projectSearchQuery} 
                  onChange={(e) => setProjectSearchQuery(e.target.value)} 
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : projectsData?.projects && projectsData.projects.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Likes</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectsData.projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>{project.id}</TableCell>
                          <TableCell className="font-medium">
                            <a 
                              href={`/projects/${project.id}`} 
                              className="text-primary hover:underline"
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {project.title}
                            </a>
                          </TableCell>
                          <TableCell>{project.author.username}</TableCell>
                          <TableCell>{project.viewsCount}</TableCell>
                          <TableCell>{project.likesCount}</TableCell>
                          <TableCell>
                            {project.featured ? (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                Featured
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-medium">
                                Not Featured
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Manage
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => toggleProjectFeatureMutation.mutate({ 
                                      projectId: project.id, 
                                      featured: !project.featured 
                                    })}
                                    disabled={toggleProjectFeatureMutation.isPending}
                                  >
                                    <Star className="mr-2 h-4 w-4" />
                                    {project.featured ? "Unfeature Project" : "Feature Project"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <a 
                                      href={project.projectUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex w-full cursor-pointer"
                                    >
                                      <PenSquare className="mr-2 h-4 w-4" /> View Live Project
                                    </a>
                                  </DropdownMenuItem>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                        <span className="text-red-500">Delete Project</span>
                                      </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Confirm Project Deletion</DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to delete project "{project.title}"? This action cannot be undone and will delete all associated comments and data.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <DialogFooter>
                                        <Button
                                          variant="destructive"
                                          onClick={() => deleteProjectMutation.mutate(project.id)}
                                          disabled={deleteProjectMutation.isPending}
                                        >
                                          {deleteProjectMutation.isPending ? "Deleting..." : "Delete Project"}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <PenSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No projects found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Reported Comments</CardTitle>
              <CardDescription>Review and moderate reported comments</CardDescription>
              <div className="mt-4">
                <Input 
                  placeholder="Search comments by content..." 
                  value={commentsSearchQuery} 
                  onChange={(e) => setCommentsSearchQuery(e.target.value)} 
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {commentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : commentsData?.comments && commentsData.comments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Reports</TableHead>
                        <TableHead>Posted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commentsData.comments.map((comment) => (
                        <TableRow key={comment.id}>
                          <TableCell>{comment.id}</TableCell>
                          <TableCell className="max-w-xs truncate">{comment.content}</TableCell>
                          <TableCell>{comment.author.username}</TableCell>
                          <TableCell>
                            <a 
                              href={`/projects/${comment.project.id}`} 
                              className="text-primary hover:underline"
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {comment.project.title}
                            </a>
                          </TableCell>
                          <TableCell>
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                              {comment.reportCount || 1} report{(comment.reportCount || 1) > 1 ? 's' : ''}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(comment.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm Comment Deletion</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this comment? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="my-4 p-4 bg-gray-50 rounded-md">
                                  <p className="text-sm">"{comment.content}"</p>
                                  <p className="text-xs text-gray-500 mt-2">- {comment.author.username}</p>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="destructive"
                                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                                    disabled={deleteCommentMutation.isPending}
                                  >
                                    {deleteCommentMutation.isPending ? "Deleting..." : "Delete Comment"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="h-12 w-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg">✓</span>
                  </div>
                  <p className="text-gray-500">No reported comments to review</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
