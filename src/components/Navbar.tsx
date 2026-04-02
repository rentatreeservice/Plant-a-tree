import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
const logo = "https://raw.githubusercontent.com/rentatreeservice/Plant-a-tree/main/src/assets/logo.png";

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  if (isAuthPage || isDashboard) return null;

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.img 
              src={logo} 
              alt="Plant a Tree Logo" 
              className="h-12 w-12 object-contain"
              whileHover={{ rotate: 10, scale: 1.1 }}
            />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {['Features', 'Packages', 'How-It-Works', 'Testimonials'].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-bold text-slate-600 hover:text-green-600 transition-colors uppercase tracking-widest"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.replace('-', ' ')}
              </motion.a>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <Link to="/dashboard">
                <motion.button 
                  className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center gap-2"
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(22, 163, 74, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User className="h-4 w-4" />
                  Dashboard
                </motion.button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <motion.button 
                    className="px-6 py-2.5 text-green-600 font-bold border-2 border-green-600 rounded-xl hover:bg-green-50 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Login
                  </motion.button>
                </Link>
                <Link to="/signup">
                  <motion.button 
                    className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition-all"
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(22, 163, 74, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign Up
                  </motion.button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
