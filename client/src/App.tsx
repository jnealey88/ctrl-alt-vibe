import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useMobile } from "@/hooks/use-mobile";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProjectDetail from "@/pages/ProjectDetail";
import SubmitProject from "@/pages/SubmitProject";
// QuickSubmitProject removed - URL extraction integrated into main SubmitProject
import EditProject from "@/pages/EditProject";
import BrowseProjects from "@/pages/BrowseProjects";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import UserProfilePage from "@/pages/user-profile-page";
import UsersPage from "@/pages/UsersPage";
import AdminDashboard from "@/pages/AdminDashboard";
import BlogEditor from "@/pages/BlogEditor";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import VibeCheck from "@/pages/VibeCheck";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Accessibility from "@/pages/Accessibility";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useKeyboardConfetti } from "@/hooks/use-keyboard-confetti";
import { HelmetProvider } from "react-helmet-async";
import SEO from "@/components/SEO";
import { SkipToContent, useAnnouncement } from "@/components/ui/accessibility";
import { ThemeProvider } from "@/hooks/use-theme";

// Helper function to safely navigate to a new URL
export const safeNavigate = (url: string): void => {
  // Use setTimeout to break the React rendering cycle
  // This helps prevent any state updates during rendering
  setTimeout(() => {
    window.location.href = url;
  }, 0);
};

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip to content link for keyboard users */}
      <SkipToContent targetId="main-content" />
      <Navbar />
      <main id="main-content" className="flex-grow" role="main" aria-labelledby="page-title">
        {/* ScrollToTop component to reset scroll position on navigation */}
        <ScrollToTop />
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/browse" component={BrowseProjects} />
          <Route path="/projects/:id" component={ProjectDetail} />
          <ProtectedRoute path="/submit" component={SubmitProject} />
          {/* Quick submit route removed - URL extraction integrated into main SubmitProject */}
          <ProtectedRoute path="/projects/:id/edit" component={EditProject} />
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <Route path="/profile/:username" component={UserProfilePage} />
          <Route path="/users" component={UsersPage} />
          <ProtectedRoute path="/admin" component={AdminDashboard} />
          <ProtectedRoute path="/blog/new" component={BlogEditor} />
          <ProtectedRoute path="/blog/edit/:id" component={BlogEditor} />
          <Route path="/blog/:slug" component={BlogPostPage} />
          <Route path="/blog" component={BlogPage} />
          <Route path="/vibe-check" component={VibeCheck} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/accessibility" component={Accessibility} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const { toast } = useToast();
  const [hasShownTip, setHasShownTip] = useState(false);
  const isMobileDevice = useMobile();
  const { AnnouncementRegion } = useAnnouncement();
  
  // This hook will trigger confetti when Ctrl+Alt+V or Cmd+Alt+V is pressed
  const { triggerConfetti } = useKeyboardConfetti({
    particleCount: 150,
    spread: 90,
    origin: { y: 0.5 }
  });

  // Show a hint about the keyboard shortcut occasionally - only on desktop devices
  useEffect(() => {
    // Only show the tip on desktop devices, not on mobile
    if (!hasShownTip && !isMobileDevice) {
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
    } else if (isMobileDevice && !hasShownTip) {
      setHasShownTip(true); // Mark as shown for mobile devices
    }
  }, [toast, hasShownTip, isMobileDevice]);

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
      <ThemeProvider defaultTheme="light" storageKey="vibe-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ErrorBoundary onError={handleGlobalError}>
              <SEO />
              <AnnouncementRegion />
              <Router />
            </ErrorBoundary>
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
