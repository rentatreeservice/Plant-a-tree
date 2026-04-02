import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Leaf, Mail, Lock, User, ArrowRight, Loader2, Gift } from 'lucide-react';
import { motion } from 'motion/react';

import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const [referralCodeInput, setReferralCodeInput] = useState(referralCode || '');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('Starting signup process for:', email);
    try {
      console.log('Creating user with email and password...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created:', user.uid);

      console.log('Updating user profile...');
      await updateProfile(user, { displayName: name });
      console.log('Profile updated');

      // Create user profile in Firestore
      console.log('Creating Firestore document...');
      const userPath = `users/${user.uid}`;
      const isAdmin = ['rentatreeservice@gmail.com'].includes(email.toLowerCase());
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          role: isAdmin ? 'admin' : 'user',
          balance: 0,
          totalInvested: 0,
          totalReturns: 0,
          referredBy: referralCodeInput || null,
          createdAt: new Date().toISOString()
        });
        console.log('Firestore document created');
      } catch (firestoreErr) {
        handleFirestoreError(firestoreErr, OperationType.WRITE, userPath);
      }

      console.log('Navigating to dashboard...');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      let errorMessage = 'Failed to create account. Please try again.';
      try {
        // Check if it's our JSON error
        const parsed = JSON.parse(err.message);
        if (parsed.error) {
          errorMessage = `Database Error: ${parsed.error}`;
        }
      } catch {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('Signup process finished');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50/50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-green-100 p-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Plant a Tree Logo" 
              className="h-20 w-20 object-contain"
              referrerPolicy="no-referrer"
            />
          </Link>
          <h1 className="text-3xl font-bold text-green-900">Create Account</h1>
          <p className="text-gray-500 mt-2">Start your sustainable investment journey</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-green-900 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-green-900 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-green-900 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-green-900 ml-1">Referral Code (Optional)</label>
            <div className="relative">
              <Gift className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value)}
                placeholder="Enter referral code"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-gray-500">
            Already have an account? {' '}
            <Link to="/login" className="font-bold text-green-600 hover:text-green-700">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
