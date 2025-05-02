import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProjectDetail from "@/pages/ProjectDetail";
import SubmitProject from "@/pages/SubmitProject";
import EditProject from "@/pages/EditProject";
import BrowseProjects from "@/pages/BrowseProjects";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import UserProfilePage from "@/pages/user-profile-page";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

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
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
