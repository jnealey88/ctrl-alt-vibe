import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2, Star, Shield, User as UserIcon, PenSquare } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("users");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [commentsSearchQuery, setCommentsSearchQuery] = useState("");
  
  useEffect(() => {
    // Redirect non-admin users away from this page
    if (!authLoading && user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the admin dashboard.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, authLoading, navigate, toast]);

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
            <Button onClick={() => navigate("/")}>Return to Homepage</Button>
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
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="comments">Reported Comments</TabsTrigger>
        </TabsList>

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
