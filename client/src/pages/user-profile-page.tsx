import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import ProjectCard from "@/components/ProjectCard";

type UserProfileResponse = {
  user: {
    id: number;
    username: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
  projects: Project[];
};

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username;

  const { data: profileData, isLoading, error } = useQuery<UserProfileResponse>({
    queryKey: ["/api/profile", username],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="container mx-auto py-10 flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <p className="text-muted-foreground mb-6">The user you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* Profile header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-10">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold uppercase text-primary">
            {profileData.user.username.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{profileData.user.username}</h1>
            <p className="text-muted-foreground mb-2">{profileData.user.email}</p>
            {profileData.user.bio && (
              <p className="max-w-md">{profileData.user.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Projects section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Projects</h2>
        {profileData.projects && profileData.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profileData.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/40 rounded-lg">
            <h3 className="text-xl font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground">
              This user hasn't submitted any projects yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
