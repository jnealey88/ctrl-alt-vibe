import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ProjectCard from "@/components/ProjectCard";

type ProfileResponse = {
  user: {
    id: number;
    username: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
  };
  projects: Project[];
};

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();

  const { data: profileData, isLoading } = useQuery<ProfileResponse>({
    queryKey: ["/api/profile"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* Profile header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-10">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold uppercase text-primary">
            {user?.username?.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{user?.username}</h1>
            <p className="text-muted-foreground mb-2">{user?.email}</p>
            {profileData?.user?.bio && (
              <p className="max-w-md">{profileData.user.bio}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/submit">Submit Project</Link>
          </Button>
          <Button 
            variant="outline" 
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

      {/* Projects section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">My Projects</h2>
        {profileData?.projects && profileData.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profileData.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/40 rounded-lg">
            <h3 className="text-xl font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven&apos;t submitted any projects yet. Start showcasing your work!
            </p>
            <Button asChild>
              <Link href="/submit">Submit Your First Project</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
