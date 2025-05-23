import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMobile, useMediumScreen } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "./NotificationBell";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Search,
  User,
  LogOut,
  ShieldCheck,
  Home,
  Grid,
  Users,
  PlusCircle,
  BookOpen,
  ExternalLink,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [location, setLocation] = useLocation();
  const isMobile = useMobile();
  const isMediumScreen = useMediumScreen();
  const { user, logoutMutation } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Track scroll position for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/", icon: <Home className="h-4 w-4 mr-1" /> },
    { name: "Browse", path: "/browse", icon: <Grid className="h-4 w-4 mr-1" /> },
    { name: "Blog", path: "/blog", icon: <BookOpen className="h-4 w-4 mr-1" /> },
    { name: "Community", path: "/users", icon: <Users className="h-4 w-4 mr-1" /> },
    { name: "Vibe Check", path: "/vibe-check", icon: <Brain className="h-4 w-4 mr-1" /> }
  ];

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300", 
      scrolled 
        ? "bg-white/90 backdrop-blur-md shadow-md" 
        : "bg-white shadow-sm"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center" aria-label="Go to Home Page">
                <img src="/1ctrlaltvibelogo.png" alt="Ctrl Alt Vibe Logo" className="h-7 w-auto" />
              </Link>
            </div>

            {!isMobile && (
              <div className="ml-6 flex space-x-3 lg:space-x-6">
                {navLinks.map((link) => {
                  const isActive = location === link.path;
                  return (
                    <Link 
                      key={link.name} 
                      href={link.path} 
                      className={cn(
                        "inline-flex items-center px-2 pt-1 text-sm font-medium border-b-2 transition-colors duration-200",
                        isActive 
                          ? "border-primary text-primary" 
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      )}
                    >
                      {link.icon}
                      {isMediumScreen ? "" : link.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {!isMobile && (
            <div className="ml-3 lg:ml-6 flex items-center">
              {user ? (
                <>
                  <Link href="/submit">
                    <Button className="ml-3 lg:ml-4 bg-primary hover:bg-primary/90 text-white group transition-all text-xs sm:text-sm">
                      <PlusCircle className="mr-1 h-4 w-4 group-hover:scale-110 transition-transform" />
                      {isMediumScreen ? "Submit" : "Submit Project"}
                    </Button>
                  </Link>

                  {/* Notification bell */}
                  <NotificationBell />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="ml-3 bg-white/80 hover:bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
                        aria-label="Open user menu"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <span className="sr-only">Open user menu</span>
                        <div 
                          className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold uppercase text-primary shadow-sm"
                          aria-hidden="true"
                        >
                          {user.username.charAt(0)}
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-1">
                      <div className="px-2 py-1.5 mb-1">
                        <p className="text-sm font-medium text-gray-900">Welcome, {user.username}!</p>
                        <p className="text-xs text-gray-500 truncate">{user.email || ""}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex w-full cursor-pointer">
                          <User className="mr-2 h-4 w-4" /> My Profile
                        </Link>
                      </DropdownMenuItem>
                      {user.role === "admin" && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex w-full cursor-pointer">
                            <ShieldCheck className="mr-2 h-4 w-4" /> Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => logoutMutation.mutate()} 
                        className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                        disabled={logoutMutation.isPending}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {logoutMutation.isPending ? "Logging out..." : "Sign out"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex ml-3 lg:ml-4 space-x-2 lg:space-x-3">
                  <Link href="/auth?tab=login">
                    <Button variant="outline" className="hover:bg-gray-50 transition-colors text-xs sm:text-sm h-9 px-2 lg:px-4">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/auth?tab=register">
                    <Button className="bg-primary hover:bg-primary/90 transition-colors text-xs sm:text-sm h-9 px-2 lg:px-4">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {isMobile && (
            <div className="flex items-center space-x-3">

              {/* User actions for mobile */}
              {user && (
                <>
                  <Link href="/submit">
                    <Button size="sm" className="hidden xs:inline-flex bg-primary hover:bg-primary/90 text-white text-xs px-2 py-1 h-8 transition-colors">
                      <PlusCircle className="mr-1 h-3 w-3" />
                      Submit
                    </Button>
                  </Link>
                  
                  {/* Mobile notification bell */}
                  <NotificationBell />

                  <Link href="/profile">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold uppercase text-primary shadow-sm hover:shadow-md transition-shadow">
                      {user.username.charAt(0)}
                    </div>
                  </Link>
                </>
              )}

              {/* Main menu for mobile */}
              <Sheet>
                <SheetTrigger asChild>
                  <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors">
                    <span className="sr-only">Open main menu</span>
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col space-y-4 mt-6">
                    <div className="pb-3 mb-2 border-b">
                      <h4 className="text-sm font-medium text-gray-500 mb-3 px-1">NAVIGATION</h4>
                      {navLinks.map((link) => {
                        const isActive = location === link.path;
                        return (
                          <SheetClose asChild key={link.name}>
                            <Link 
                              href={link.path} 
                              className={cn(
                                "flex items-center text-base font-medium py-2 px-1 rounded-md transition-colors",
                                isActive 
                                  ? "text-primary bg-primary/10" 
                                  : "text-gray-600 hover:text-primary hover:bg-gray-50"
                              )}
                            >
                              {link.icon}
                              {link.name}
                            </Link>
                          </SheetClose>
                        );
                      })}
                    </div>

                    {user ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold uppercase text-primary shadow-sm">
                              {user.username.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-xs text-gray-500 truncate">{user.email || ""}</p>
                            </div>
                          </div>
                        </div>

                        <h4 className="text-sm font-medium text-gray-500 mb-1 px-1">YOUR ACCOUNT</h4>
                        <SheetClose asChild>
                          <Link href="/profile" className="flex items-center text-gray-600 hover:text-primary hover:bg-gray-50 py-2 px-1 text-base font-medium rounded-md transition-colors">
                            <User className="mr-2 h-5 w-5" /> My Profile
                          </Link>
                        </SheetClose>
                        {user.role === "admin" && (
                          <SheetClose asChild>
                            <Link href="/admin" className="flex items-center text-gray-600 hover:text-primary hover:bg-gray-50 py-2 px-1 text-base font-medium rounded-md transition-colors">
                              <ShieldCheck className="mr-2 h-5 w-5" /> Admin Dashboard
                            </Link>
                          </SheetClose>
                        )}
                        <div className="pt-2 space-y-2">
                          <SheetClose asChild>
                            <Link href="/submit" className="block w-full">
                              <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Submit Project
                              </Button>
                            </Link>
                          </SheetClose>
                        </div>
                        <SheetClose asChild>
                          <Button 
                            onClick={() => logoutMutation.mutate()} 
                            variant="outline" 
                            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                            disabled={logoutMutation.isPending}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            {logoutMutation.isPending ? "Logging out..." : "Sign out"}
                          </Button>
                        </SheetClose>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-500 mb-3 px-1">ACCOUNT</h4>
                        <SheetClose asChild>
                          <Link href="/auth?tab=login" className="block w-full">
                            <Button variant="outline" className="w-full mb-3 h-11">Log in</Button>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link href="/auth?tab=register" className="block w-full">
                            <Button className="w-full h-11 bg-primary hover:bg-primary/90">Sign up</Button>
                          </Link>
                        </SheetClose>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;