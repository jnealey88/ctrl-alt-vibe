import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMobile } from "@/hooks/use-mobile";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Bell,
  Menu,
  Search
} from "lucide-react";

const Navbar = () => {
  const [_, setLocation] = useLocation();
  const isMobile = useMobile();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navLinks = [
    { name: "Discover", path: "/" },
    { name: "Latest", path: "/?sort=latest" },
    { name: "Popular", path: "/?sort=popular" }
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <a className="flex items-center">
                  <span className="font-space font-bold text-2xl gradient-text">Ctrl Alt Vibe</span>
                </a>
              </Link>
            </div>
            
            {!isMobile && (
              <div className="ml-6 flex space-x-8">
                {navLinks.map((link) => (
                  <Link key={link.name} href={link.path}>
                    <a className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      {link.name}
                    </a>
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
              
              <Link href="/submit">
                <Button className="ml-4 bg-primary hover:bg-primary/90 text-white">
                  Submit Project
                </Button>
              </Link>
              
              <button className="ml-3 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>
              
              <div className="ml-3 relative">
                <button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="h-8 w-8 rounded-full"
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="User profile"
                  />
                </button>
              </div>
            </div>
          )}
          
          {isMobile && (
            <div className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
                    <span className="sr-only">Open main menu</span>
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col space-y-4 mt-6">
                    <form onSubmit={handleSearch} className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        className="pl-10 h-9 w-full"
                        placeholder="Search projects"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </form>
                    
                    {navLinks.map((link) => (
                      <Link key={link.name} href={link.path}>
                        <a className="text-gray-600 hover:text-primary py-2 text-base font-medium">
                          {link.name}
                        </a>
                      </Link>
                    ))}
                    
                    <Link href="/submit">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                        Submit Project
                      </Button>
                    </Link>
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
