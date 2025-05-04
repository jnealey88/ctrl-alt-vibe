import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [redirected, setRedirected] = useState(false);
  
  useEffect(() => {
    // If not loading and no user, manually perform navigation to prevent error
    if (!isLoading && !user && !redirected) {
      console.log('ProtectedRoute: Redirecting to auth page');
      setRedirected(true);
      setLocation('/auth');
    } else if (!isLoading && user) {
      console.log('ProtectedRoute: User authenticated, rendering component');
    }
  }, [isLoading, user, redirected, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // We're handling the redirect in the useEffect above
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
