import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route } from "wouter";
import { useEffect, useState } from "react";
import { safeNavigate } from "@/App";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();
  const [redirected, setRedirected] = useState(false);
  
  useEffect(() => {
    // If not loading and no user, use our safe navigation helper
    if (!isLoading && !user && !redirected) {
      console.log('ProtectedRoute: Redirecting to auth page');
      setRedirected(true);
      // Use our safer navigation method
      safeNavigate('/auth');
    } else if (!isLoading && user) {
      console.log('ProtectedRoute: User authenticated, rendering component');
    }
  }, [isLoading, user, redirected]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Show loading while redirect happens
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only render the component if user is authenticated
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
