import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
const logo = "/logo.png";

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2 text-white group">
              <motion.img 
                src={logo} 
                alt="Plant a Tree Logo" 
                className="h-12 w-12 object-contain"
                whileHover={{ rotate: 10, scale: 1.1 }}
              />
            </Link>
            <p className="text-slate-400 leading-relaxed">
              Growing wealth and forests together. We're committed to sustainable investing with real environmental impact.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-green-600 hover:text-white transition-all">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-green-600 hover:text-white transition-all">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-green-600 hover:text-white transition-all">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-green-600 hover:text-white transition-all">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li><Link to="/" className="hover:text-green-500 transition-colors">Home</Link></li>
              <li><a href="#features" className="hover:text-green-500 transition-colors">Features</a></li>
              <li><a href="#packages" className="hover:text-green-500 transition-colors">Tree Packages</a></li>
              <li><a href="#how-it-works" className="hover:text-green-500 transition-colors">How It Works</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">Support</h3>
            <ul className="space-y-4">
              <li><Link to="/faq" className="hover:text-green-500 transition-colors">FAQ</Link></li>
              <li><a href="#" className="hover:text-green-500 transition-colors">Privacy Policy</a></li>
              <li><Link to="/terms" className="hover:text-green-500 transition-colors">Terms of Service</Link></li>
              <li><a href="#contact" className="hover:text-green-500 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-green-500" />
                <span>plantatreeservice@gmail.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-green-500" />
                <span>Bangalore, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} Plant A Tree. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
