import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const Footer = () => {
  const footerLinkClass = "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary";
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <img src="/1ctrlaltvibelogo.png" alt="Ctrl Alt Vibe Logo" className="h-9 w-auto" />
            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-md">
              A community-driven platform for people to showcase their AI-assisted coding projects and connect with like-minded creators.
            </p>
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-gray-100 font-medium">Explore</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/" className={footerLinkClass}>Home</Link>
              </li>
              <li>
                <Link href="/browse" className={footerLinkClass}>Browse Projects</Link>
              </li>
              <li>
                <Link href="/submit" className={footerLinkClass}>Submit Project</Link>
              </li>
              <li>
                <Link href="/users" className={footerLinkClass}>Community Members</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-gray-100 font-medium">Account</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/profile" className={footerLinkClass}>Your Profile</Link>
              </li>
              <li>
                <Link href="/auth" className={footerLinkClass}>Login / Register</Link>
              </li>
              <li>
                <Link href="/admin" className={footerLinkClass}>Admin Dashboard</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4">
            <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} Ctrl Alt Vibe. All rights reserved.</p>
            <div className="flex items-center">
              <span className="text-gray-400 text-sm mx-2">Theme:</span>
              <ThemeToggle />
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-4 md:gap-6">
            <Link href="/browse" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 text-sm">Browse</Link>
            <Link href="/submit" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 text-sm">Submit</Link>
            <Link href="/profile" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 text-sm">Profile</Link>
            <Link href="/privacy" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 text-sm">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 text-sm">Terms of Service</Link>
            <Link href="/accessibility" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 text-sm">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
