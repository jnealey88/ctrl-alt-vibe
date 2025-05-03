import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProjectDetail from "@/pages/ProjectDetail";
import SubmitProject from "@/pages/SubmitProject";
import EditProject from "@/pages/EditProject";
import BrowseProjects from "@/pages/BrowseProjects";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import UserProfilePage from "@/pages/user-profile-page";
import UsersPage from "@/pages/UsersPage";
import AdminDashboard from "@/pages/AdminDashboard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useKeyboardConfetti } from "@/hooks/use-keyboard-confetti";
import { HelmetProvider } from "react-helmet-async";
import SEO from "@/components/SEO";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/browse" component={BrowseProjects} />
          <Route path="/projects/:id" component={ProjectDetail} />
          <ProtectedRoute path="/submit" component={SubmitProject} />
          <ProtectedRoute path="/projects/:id/edit" component={EditProject} />
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <Route path="/profile/:username" component={UserProfilePage} />
          <Route path="/users" component={UsersPage} />
          <ProtectedRoute path="/admin" component={AdminDashboard} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  const { toast } = useToast();
  const [hasShownTip, setHasShownTip] = useState(false);
  
  // This hook will trigger confetti when Ctrl+Alt+V or Cmd+Alt+V is pressed
  const { triggerConfetti } = useKeyboardConfetti({
    particleCount: 150,
    spread: 90,
    origin: { y: 0.5 }
  });

  // Show a hint about the keyboard shortcut occasionally
  useEffect(() => {
    // Check if the tip has been shown in this session
    if (!hasShownTip) {
      // Use a 1 in 4 chance to show the tip (25% chance)
      const shouldShowTip = Math.random() < 0.25;
      
      if (shouldShowTip) {
        // Wait 5 seconds before showing the tip
        const timer = setTimeout(() => {
          const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
          toast({
            title: "Pro Tip",
            description: isMac 
              ? "Try pressing Command+Ctrl+V for a fun surprise!" 
              : "Try pressing Ctrl+Alt+V for a fun surprise!",
            duration: 5000
          });
          setHasShownTip(true);
        }, 5000);
        
        return () => clearTimeout(timer);
      } else {
        setHasShownTip(true); // Don't try again this session
      }
    }
  }, [toast, hasShownTip]);

  // Handle global error logging
  const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a production app, you would send this to an error tracking service
    console.error('Global error caught:', error, errorInfo);
    
    // Show a toast notification
    toast({
      title: 'Application Error',
      description: 'We encountered an unexpected problem. Our team has been notified.',
      variant: 'destructive'
    });
  };
  
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ErrorBoundary onError={handleGlobalError}>
            <SEO />
            <Router />
          </ErrorBoundary>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
