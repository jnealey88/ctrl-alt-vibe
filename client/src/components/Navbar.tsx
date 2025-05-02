import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bell,
  Menu,
  Search,
  User,
  LogOut,
  ShieldCheck
} from "lucide-react";

const Navbar = () => {
  const [_, setLocation] = useLocation();
  const isMobile = useMobile();
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/browse?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Browse", path: "/browse" },
    { name: "Community", path: "/users" }
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <span className="font-space font-bold text-2xl gradient-text">Ctrl Alt Vibe</span>
              </Link>
            </div>
            
            {!isMobile && (
              <div className="ml-6 flex space-x-8">
                {navLinks.map((link) => (
                  <Link key={link.name} href={link.path} className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {!isMobile && (
            <div className="ml-6 flex items-center">
              <form onSubmit={handleSearch} className="relative rounded-md shadow-sm w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  className="pl-10 h-9"
                  placeholder="Search projects"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              
              {user ? (
                <>
                  <Link href="/submit">
                    <Button className="ml-4 bg-primary hover:bg-primary/90 text-white">
                      Submit Project
                    </Button>
                  </Link>
                  
                  <button className="ml-3 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-6 w-6" />
                  </button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-3 bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <span className="sr-only">Open user menu</span>
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold uppercase text-primary">
                          {user.username.charAt(0)}
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex w-full cursor-pointer">
                          <User className="mr-2 h-4 w-4" /> Profile
                        </Link>
                      </DropdownMenuItem>
                      {user.role === "admin" && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex w-full cursor-pointer">
                            <ShieldCheck className="mr-2 h-4 w-4" /> Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex ml-4 space-x-2">
                  <Link href="/auth?tab=login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/auth?tab=register">
                    <Button>Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {isMobile && (
            <div className="flex items-center space-x-3">
              {/* Search icon for mobile */}
              <Sheet>
                <SheetTrigger asChild>
                  <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none">
                    <Search className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="top" className="w-full pt-16">
                  <div className="px-4 py-6">
                    <form onSubmit={handleSearch} className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        className="pl-10 h-10 w-full"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                      <Button type="submit" className="mt-2 w-full">Search Projects</Button>
                    </form>
                  </div>
                </SheetContent>
              </Sheet>
              
              {/* User actions for mobile */}
              {user && (
                <>
                  <Link href="/submit">
                    <Button size="sm" className="hidden xs:inline-flex bg-primary hover:bg-primary/90 text-white text-xs px-2 py-1 h-8">
                      Submit
                    </Button>
                  </Link>
                  
                  <Link href="/profile">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold uppercase text-primary">
                      {user.username.charAt(0)}
                    </div>
                  </Link>
                </>
              )}

              {/* Main menu for mobile */}
              <Sheet>
                <SheetTrigger asChild>
                  <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
                    <span className="sr-only">Open main menu</span>
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col space-y-4 mt-6">
                    <div className="pb-2 mb-2 border-b">
                      <h4 className="text-sm font-medium text-gray-500 mb-3">NAVIGATION</h4>
                      {navLinks.map((link) => (
                        <Link key={link.name} href={link.path} className="block text-gray-600 hover:text-primary py-2 text-base font-medium">
                          {link.name}
                        </Link>
                      ))}
                    </div>

                    {user ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">YOUR ACCOUNT</h4>
                        <Link href="/profile" className="flex items-center text-gray-600 hover:text-primary py-2 text-base font-medium">
                          <User className="mr-2 h-5 w-5" /> My Profile
                        </Link>
                        {user.role === "admin" && (
                          <Link href="/admin" className="flex items-center text-gray-600 hover:text-primary py-2 text-base font-medium">
                            <ShieldCheck className="mr-2 h-5 w-5" /> Admin Dashboard
                          </Link>
                        )}
                        <Link href="/submit" className="block w-full">
                          <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                            Submit Project
                          </Button>
                        </Link>
                        <Button 
                          onClick={() => logoutMutation.mutate()} 
                          variant="outline" 
                          className="w-full"
                          disabled={logoutMutation.isPending}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {logoutMutation.isPending ? "Logging out..." : "Logout"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">ACCOUNT</h4>
                        <Link href="/auth?tab=login" className="block w-full">
                          <Button variant="outline" className="w-full mb-2">Login</Button>
                        </Link>
                        <Link href="/auth?tab=register" className="block w-full">
                          <Button className="w-full">Sign Up</Button>
                        </Link>
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
