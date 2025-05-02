import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Star, Edit, Trash2, Shield, Users, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { User, Project, Comment } from "@shared/schema";

const AdminDashboard = () => {
  const [location, setLocation] = useLocation();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number, type: string } | null>(null);
  const [featuredDialogOpen, setFeaturedDialogOpen] = useState(false);
  const [projectToFeature, setProjectToFeature] = useState<number | null>(null);

  // Check if user is admin, if not redirect
  if (!isLoadingAuth && (!user || user.role !== "admin")) {
    setLocation("/");
    return null;
  }

  // Fetch all users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery<{ users: User[] }>({ 
    queryKey: ["/api/admin/users"] 
  });

  // Fetch all projects
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery<{ projects: Project[] }>({ 
    queryKey: ["/api/admin/projects"] 
  });

  // Fetch all reported comments
  const { data: commentsData, isLoading: isLoadingComments } = useQuery<{ comments: Comment[] }>({ 
    queryKey: ["/api/admin/reported-comments"] 
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number, type: string }) => {
      const response = await apiRequest("DELETE", `/api/admin/${type}/${id}`);
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the appropriate query based on what was deleted
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${variables.type}s`] });
      
      toast({
        title: "Success",
        description: `The ${variables.type} has been deleted.`,
      });
      
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: `Failed to delete ${itemToDelete?.type}. Please try again.`,
        variant: "destructive",
      });
    }
  });

  // Feature project mutation
  const featureMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest("PUT", `/api/admin/projects/${projectId}/feature`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/featured"] });
      
      toast({
        title: "Success",
        description: "The project has been featured on the homepage.",
      });
      
      setFeaturedDialogOpen(false);
    },
    onError: (error) => {
      console.error("Feature error:", error);
      toast({
        title: "Error",
        description: "Failed to feature the project. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle delete confirmation
  const handleDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  // Handle feature confirmation
  const handleFeature = () => {
    if (projectToFeature) {
      featureMutation.mutate(projectToFeature);
    }
  };

  // Confirm delete dialog trigger
  const confirmDelete = (id: number, type: string) => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };

  // Confirm feature dialog trigger
  const confirmFeature = (id: number) => {
    setProjectToFeature(id);
    setFeaturedDialogOpen(true);
  };

  if (isLoadingAuth) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, projects, and comments</p>
        </div>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center">
            <Users className="mr-2 h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" /> Projects
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center">
            <Shield className="mr-2 h-4 w-4" /> Reported Comments
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableCaption>List of all registered users</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users && usersData.users.length > 0 ? (
                      usersData.users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-slate-100'}`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => confirmDelete(user.id, 'user')}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Management</CardTitle>
              <CardDescription>View and manage all projects</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableCaption>List of all projects</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectsData?.projects && projectsData.projects.length > 0 ? (
                      projectsData.projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>{project.id}</TableCell>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>{project.author.username}</TableCell>
                          <TableCell>{project.viewsCount}</TableCell>
                          <TableCell>
                            {project.featured ? (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" /> Yes
                              </span>
                            ) : (
                              <span className="flex items-center text-slate-400">
                                <XCircle className="h-4 w-4 mr-1" /> No
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Link href={`/projects/${project.id}`}>
                                <Button variant="outline" size="sm">
                                  View
                                </Button>
                              </Link>
                              {!project.featured && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => confirmFeature(project.id)}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Feature
                                </Button>
                              )}
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => confirmDelete(project.id, 'project')}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No projects found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reported Comments Tab */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reported Comments</CardTitle>
              <CardDescription>Review and moderate reported comments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingComments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : commentsData?.comments && commentsData.comments.length > 0 ? (
                <div className="space-y-4">
                  {commentsData.comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{comment.author.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Dismiss
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => confirmDelete(comment.id, 'comment')}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-800">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No reported comments found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              {itemToDelete?.type === 'user' ? ' user account and all associated content.' : 
               itemToDelete?.type === 'project' ? ' project and all associated comments.' :
               ' comment.'}
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

      {/* Feature Confirmation Dialog */}
      <AlertDialog open={featuredDialogOpen} onOpenChange={setFeaturedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Feature this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set this project as the featured project on the homepage.
              Any currently featured project will be unfeatured.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFeature}>
              {featureMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Feature Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
