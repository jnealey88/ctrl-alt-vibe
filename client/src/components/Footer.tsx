import { Link } from "wouter";
import { 
  Twitter, 
  Github, 
  Linkedin, 
  MessageSquare
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <span className="font-space font-bold text-xl gradient-text">Ctrl Alt Vibe</span>
            <p className="mt-4 text-gray-500 max-w-md">
              A community-driven platform for developers to showcase their AI-assisted coding projects and connect with like-minded creators.
            </p>
            <div className="mt-6 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">GitHub</span>
                <Github className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Discord</span>
                <MessageSquare className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-gray-900 font-medium">Product</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="#" className="text-gray-500 hover:text-primary">Features</Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-primary">Pricing</Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-primary">Changelog</Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-primary">Roadmap</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-900 font-medium">Resources</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="#" className="text-gray-500 hover:text-primary">Community</Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-primary">Help Center</Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-primary">Blog</Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-primary">Contact</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} Ctrl Alt Vibe. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link href="#" className="text-gray-400 hover:text-gray-500 text-sm">Terms</Link>
            <Link href="#" className="text-gray-400 hover:text-gray-500 text-sm">Privacy</Link>
            <Link href="#" className="text-gray-400 hover:text-gray-500 text-sm">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
