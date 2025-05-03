import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  initiateGoogleLogin, 
  handleGoogleRedirect, 
  getGoogleUserInfo, 
  clearGoogleAuth 
} from "../lib/googleAuth";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
  googleLoginMutation: UseMutationResult<User, Error, void>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Handle Google Auth redirect result when component mounts
  useEffect(() => {
    const checkGoogleRedirect = async () => {
      try {
        // Check if there's an authorization code in the URL (after Google OAuth redirect)
        const authCode = handleGoogleRedirect();
        
        if (authCode) {
          console.log("Authorization code received, exchanging for tokens");
          
          // Call our backend to exchange the authorization code for tokens
          const res = await apiRequest("POST", "/api/auth/google/callback", { 
            code: authCode,
            redirect_uri: `${window.location.origin}/auth`
          });
          
          const userData = await res.json();
          
          // Update the user in the query cache
          queryClient.setQueryData(["/api/user"], userData.user);
          
          toast({
            title: "Google login successful",
            description: `Welcome, ${userData.user.username}!`,
          });
          
          // Clean query parameters from URL without triggering a page reload
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.error("Error handling Google redirect:", error);
        toast({
          title: "Login failed",
          description: "Could not complete Google login",
          variant: "destructive",
        });
        // Clear any partial auth data
        clearGoogleAuth();
      }
    };
    
    checkGoogleRedirect();
  }, [toast]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to Ctrl Alt Vibe, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout successful",
        description: "You have been logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      // Initiate Google OAuth flow - this will redirect to Google
      initiateGoogleLogin();
      
      // This is a dummy return as we'll be redirected away
      // The actual login happens in the useEffect that handles the redirect
      return null as any;
    },
    onError: (error: Error) => {
      toast({
        title: "Google login failed",
        description: error.message || "Could not initiate Google authentication",
        variant: "destructive",
      });
      clearGoogleAuth();
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        googleLoginMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
