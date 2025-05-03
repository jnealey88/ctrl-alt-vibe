import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <img src="/ctrlaltvibelogo1.png" alt="Ctrl Alt Vibe Logo" className="h-9 w-auto" />
            <p className="mt-4 text-gray-500 max-w-md">
              A community-driven platform for developers to showcase their AI-assisted coding projects and connect with like-minded creators.
            </p>
          </div>
          <div>
            <h3 className="text-gray-900 font-medium">Explore</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-primary">Home</Link>
              </li>
              <li>
                <Link href="/browse" className="text-gray-500 hover:text-primary">Browse Projects</Link>
              </li>
              <li>
                <Link href="/submit" className="text-gray-500 hover:text-primary">Submit Project</Link>
              </li>
              <li>
                <Link href="/users" className="text-gray-500 hover:text-primary">Community Members</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-900 font-medium">Account</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/profile" className="text-gray-500 hover:text-primary">Your Profile</Link>
              </li>
              <li>
                <Link href="/auth" className="text-gray-500 hover:text-primary">Login / Register</Link>
              </li>
              <li>
                <Link href="/admin" className="text-gray-500 hover:text-primary">Admin Dashboard</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} Ctrl Alt Vibe. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link href="/browse" className="text-gray-400 hover:text-gray-500 text-sm">Browse</Link>
            <Link href="/submit" className="text-gray-400 hover:text-gray-500 text-sm">Submit</Link>
            <Link href="/profile" className="text-gray-400 hover:text-gray-500 text-sm">Profile</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
