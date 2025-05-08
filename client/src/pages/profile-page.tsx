import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Loader2, Camera, FileText, Heart, Eye, Grid, Image, Settings, User, LockKeyhole
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ProjectCard from "@/components/ProjectCard";
import { ShareButton } from "@/components/ShareButton";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ProfileResponse = {
  user: {
    id: number;
    username: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
    twitterUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    websiteUrl?: string;
  };
  projects: Project[];
};

const profileEditSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters"),
  bio: z.string().max(300, "Bio must be less than 300 characters").optional(),
  twitterUrl: z.string()
    .url("Must be a valid URL")
    .refine(val => !val || val.startsWith('https://twitter.com/'), {
      message: "Twitter URL must start with https://twitter.com/"
    })
    .optional()
    .or(z.literal("")),
  githubUrl: z.string()
    .url("Must be a valid URL")
    .refine(val => !val || val.startsWith('https://github.com/'), {
      message: "GitHub URL must start with https://github.com/"
    })
    .optional()
    .or(z.literal("")),
  linkedinUrl: z.string()
    .url("Must be a valid URL")
    .refine(val => !val || val.startsWith('https://linkedin.com/'), {
      message: "LinkedIn URL must start with https://linkedin.com/"
    })
    .optional()
    .or(z.literal("")),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileEditValues = z.infer<typeof profileEditSchema>;

const passwordResetSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordResetValues = z.infer<typeof passwordResetSchema>;

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profileData, isLoading: isLoadingProfile } = useQuery<ProfileResponse>({
    queryKey: ["/api/profile"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  const form = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      username: user?.username || "",
      bio: user?.bio || "",
    },
  });

  // Update form values when user data changes
  // Password reset form 
  const passwordForm = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // State for password reset dialog
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  // State to track if this user is a Google OAuth user
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        bio: user.bio || "",
        twitterUrl: user.twitterUrl || "",
        githubUrl: user.githubUrl || "",
        linkedinUrl: user.linkedinUrl || "",
        websiteUrl: user.websiteUrl || "",
      });
      
      // Check if this is a Google authenticated user by looking for a very long random password
      // (Google users have a long random password generated during registration)
      if (user.password && user.password.length > 30) {
        setIsGoogleUser(true);
      }
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileEditValues) => {
      return await apiRequest("PATCH", "/api/profile", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const avatarUploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/profile/avatar", formData, {
        isFormData: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Avatar updated",
        description: "Your profile photo has been updated successfully.",
      });
      setIsAvatarUploading(false);
    },
    onError: (error) => {
      setIsAvatarUploading(false);
      toast({
        title: "Error",
        description: `Failed to upload avatar: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleProfileSubmit = (values: ProfileEditValues) => {
    updateProfileMutation.mutate(values);
  };

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file) {
      setIsAvatarUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);
      avatarUploadMutation.mutate(formData);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Password reset mutation
  const passwordResetMutation = useMutation({
    mutationFn: async (values: PasswordResetValues) => {
      return await apiRequest("POST", "/api/profile/reset-password", values);
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update password: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handlePasswordSubmit = (values: PasswordResetValues) => {
    passwordResetMutation.mutate(values);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto py-6 sm:py-10 max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
      />

      {/* Profile Hero Section - Behance Inspired */}
      <div className="relative mb-6 sm:mb-10">
        {/* Cover Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 h-64 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        </div>
        
        <div className="container mx-auto relative px-4 sm:px-6">
          {/* Profile Info Section */}
          <div className="pt-10 sm:pt-16 pb-12 sm:pb-20 md:flex items-end gap-8">
            {/* Avatar */}
            <div className="relative z-10 mb-4 md:mb-0 mx-auto md:ml-2 md:mx-0 w-fit">
              <div className="relative group">
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white shadow-lg">
                  {profileData?.user?.avatarUrl ? (
                    <AvatarImage src={profileData.user.avatarUrl} alt={user?.username || "User avatar"} />
                  ) : (
                    <AvatarFallback className="text-3xl sm:text-4xl font-bold uppercase bg-primary/20 text-primary">
                      {user?.username?.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 bg-white rounded-full opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow"
                  onClick={triggerFileInput}
                  disabled={isAvatarUploading}
                >
                  {isAvatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 text-center md:text-left">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{user?.username}</h1>

                  {profileData?.user?.bio && (
                    <p className="max-w-2xl mx-auto md:mx-0 text-sm md:text-base leading-relaxed">{profileData.user.bio}</p>
                  )}
                  
                  {/* Social Links */}
                  {(profileData?.user?.twitterUrl || profileData?.user?.githubUrl || profileData?.user?.linkedinUrl || profileData?.user?.websiteUrl) && (
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      {profileData?.user?.twitterUrl && (
                        <a href={profileData.user.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                          </svg>
                        </a>
                      )}
                      {profileData?.user?.githubUrl && (
                        <a href={profileData.user.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                          </svg>
                        </a>
                      )}
                      {profileData?.user?.linkedinUrl && (
                        <a href={profileData.user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                      )}
                      {profileData?.user?.websiteUrl && (
                        <a href={profileData.user.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-end gap-3 mt-4 md:mt-0 w-full md:w-auto">
                  <Button 
                    onClick={() => setIsEditDialogOpen(true)}
                    size="sm"
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                  <ShareButton
                    title={user?.username || "My Profile"}
                    url={`/profile/${user?.username}`}
                    contentType="profile"
                    variant="outline"
                    size="sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      "Logout"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground text-sm">Projects</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 animate-count-up">{profileData?.projects?.length || 0}</h3>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Grid className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground text-sm">Total Likes</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 animate-count-up">
                    {profileData?.projects?.reduce((total, project) => total + (project.likesCount || 0), 0) || 0}
                  </h3>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-red-50 rounded-full flex items-center justify-center">
                  <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground text-sm">Total Views</p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 animate-count-up">
                    {profileData?.projects?.reduce((total, project) => total + (project.viewsCount || 0), 0) || 0}
                  </h3>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold">My Portfolio</h2>
          <Button asChild>
            <Link href="/submit" className="gap-2">
              <Image className="h-4 w-4" />
              Submit New Project
            </Link>
          </Button>
        </div>

        {/* Projects Section */}
        <h2 className="text-2xl font-bold mb-6">My Vibe Coded Portfolio</h2>
        <div className="mt-6">
          {profileData?.projects && profileData.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profileData.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/20 rounded-xl border border-muted">
              <div className="mb-4 mx-auto h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">Your Portfolio Is Empty</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start building your professional vibe coded portfolio by submitting your first project. Showcase your AI skills to potential employers and clients!
              </p>
              <Button asChild>
                <Link href="/submit">Submit Your First Project</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Username
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="your_username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Bio
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                <h3 className="text-sm font-medium">Social Links</h3>
                
                <FormField
                  control={form.control}
                  name="twitterUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="githubUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub</FormLabel>
                      <FormControl>
                        <Input placeholder="https://github.com/username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/in/username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourwebsite.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-between items-center gap-2 pt-4">
                {!isGoogleUser && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setIsPasswordDialogOpen(true);
                    }}
                  >
                    <LockKeyhole className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Password Reset Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4 py-2">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Your current password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="New password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={passwordResetMutation.isPending}
                >
                  {passwordResetMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
