import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Redirect, Link } from "wouter";
import { Loader2, EyeIcon, EyeOffIcon, KeyRound, User, Mail, Info } from "lucide-react";
import SEO from "@/components/SEO";
import { Separator } from "@/components/ui/separator";
import { SiGoogle } from "react-icons/si";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const loginFormSchema = z.object({
  username: z.string().min(3, "Username or email must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional().default(false),
});

const registerFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  bio: z.string().optional(),
});

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation, googleLoginMutation } = useAuth();
  
  // Default to login tab, simplified for now
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  
  // Add a subtle animation effect when the component mounts
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      bio: "",
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginFormSchema>) => {
    // You might need to modify your backend to handle the rememberMe flag
    console.log('Remember me:', data.rememberMe);
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: z.infer<typeof registerFormSchema>) => {
    registerMutation.mutate(data);
  };

  // Redirect to home if already logged in
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  // Determine SEO title and description based on active tab
  const getSeoTitle = () => {
    return activeTab === "login" 
      ? "Login | Ctrl Alt Vibe" 
      : "Create an Account | Ctrl Alt Vibe";
  };

  const getSeoDescription = () => {
    return activeTab === "login"
      ? "Log in to your Ctrl Alt Vibe account to access your profile, submit projects, and engage with the developer community."
      : "Join Ctrl Alt Vibe to showcase your AI-assisted coding projects, get feedback, and connect with other developers.";
  };

  const seoKeywords = [
    'developer community', 'coding showcase', 'ai-assisted development',
    'programmer portfolio', 'tech community', 'developer account',
    activeTab === "login" ? 'login' : 'register', 
    activeTab === "login" ? 'sign in' : 'sign up'
  ];

  return (
    <div className="container mx-auto py-10 flex flex-col md:flex-row items-center justify-center min-h-[calc(100vh-10rem)] relative">
      {/* Background elements for visual appeal */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5"></div>
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl"></div>
      </div>
      <SEO 
        title={getSeoTitle()}
        description={getSeoDescription()}
        keywords={seoKeywords}
      />
      {/* Left side: Auth forms */}
      <motion.div 
        className="flex-1 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
        transition={{ duration: 0.5 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username or Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="johndoe or john@example.com" 
                                className="pl-10 transition-all duration-200 focus:pl-10 focus:pr-4" 
                                {...field} 
                              />
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6">
                  <Separator className="my-4">
                    <span className="text-xs text-muted-foreground px-2">OR</span>
                  </Separator>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-2" 
                    onClick={() => googleLoginMutation.mutate()}
                    disabled={googleLoginMutation.isPending}
                  >
                    {googleLoginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting with Google...
                      </>
                    ) : (
                      <>
                        <SiGoogle className="mr-2 h-4 w-4" />
                        Continue with Google
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setActiveTab("register")}
                  >
                    Register
                  </button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Join Ctrl Alt Vibe to showcase your AI-assisted coding projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="johndoe" 
                                className="pl-10 transition-all duration-200" 
                                {...field} 
                              />
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="email" 
                                placeholder="john@example.com" 
                                className="pl-10 transition-all duration-200" 
                                {...field} 
                              />
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio (optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="A few words about yourself" 
                                className="pl-10 transition-all duration-200" 
                                {...field} 
                              />
                              <Info className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6">
                  <Separator className="my-4">
                    <span className="text-xs text-muted-foreground px-2">OR</span>
                  </Separator>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-2" 
                    onClick={() => googleLoginMutation.mutate()}
                    disabled={googleLoginMutation.isPending}
                  >
                    {googleLoginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting with Google...
                      </>
                    ) : (
                      <>
                        <SiGoogle className="mr-2 h-4 w-4" />
                        Continue with Google
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setActiveTab("login")}
                  >
                    Login
                  </button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Right side: Hero section */}
      <motion.div 
        className="flex-1 p-6 hidden md:block"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: mounted ? 1 : 0, x: mounted ? 0 : 20 }}
        transition={{ duration: 0.5, delay: 0.2 }}>
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-6">Ctrl Alt Vibe</h1>
          <p className="text-xl mb-8">
            A community-driven platform for showcasing amazing AI-assisted coding projects.  
            Share your work, get feedback, and connect with other developers.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-secondary/10 rounded-lg">
              <h3 className="font-medium">Showcase</h3>
              <p className="text-sm text-muted-foreground">Share your AI-powered projects</p>
            </div>
            <div className="p-4 bg-secondary/10 rounded-lg">
              <h3 className="font-medium">Connect</h3>
              <p className="text-sm text-muted-foreground">Engage with other creators</p>
            </div>
            <div className="p-4 bg-secondary/10 rounded-lg">
              <h3 className="font-medium">Discover</h3>
              <p className="text-sm text-muted-foreground">Find inspiration for your next project</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
