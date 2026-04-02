import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit, 
  Users, 
  Package, 
  TrendingUp, 
  BarChart3, 
  LogOut, 
  Leaf,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wallet,
  Mail,
  X,
  Gift,
  Ticket,
  Sparkles,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  History
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, setDoc, query, orderBy, increment, where, getDocs, limit } from 'firebase/firestore';
import { TreePackage, UserProfile, ImpactStats, ContactMessage, Referral, Ticket as LotteryTicket } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { TREE_IMAGES } from '../assets/treeImages';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';
const logo = "https://raw.githubusercontent.com/rentatreeservice/Plant-a-tree/main/src/assets/logo.png";

const AdminPanel: React.FC = () => {
  const { user, profile, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      navigate('/dashboard');
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const qDep = query(collection(db, 'transactions'), where('type', '==', 'deposit'), where('status', '==', 'pending'));
    const qWith = query(collection(db, 'withdrawals'), where('status', '==', 'pending'));

    let depCount = 0;
    let withCount = 0;

    const unsubDep = onSnapshot(qDep, (snap) => {
      depCount = snap.size;
      setPendingCount(depCount + withCount);
    }, (error) => {
      console.error("AdminPanel unsubDep error:", error);
      handleFirestoreError(error, OperationType.GET, 'transactions');
    });

    const unsubWith = onSnapshot(qWith, (snapWith) => {
      withCount = snapWith.size;
      setPendingCount(depCount + withCount);
    }, (error) => {
      console.error("AdminPanel unsubWith error:", error);
      handleFirestoreError(error, OperationType.GET, 'withdrawals');
    });

    return () => {
      unsubDep();
      unsubWith();
    };
  }, [profile]);

  if (loading || !user || !profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const navItems = [
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Stats', path: '/admin' },
    { icon: <Package className="h-5 w-5" />, label: 'Packages', path: '/admin/packages' },
    { icon: <Wallet className="h-5 w-5" />, label: 'Finance', path: '/admin/finance' },
    { icon: <Users className="h-5 w-5" />, label: 'Users', path: '/admin/users' },
    { icon: <Gift className="h-5 w-5" />, label: 'Referrals', path: '/admin/referrals' },
    { icon: <Ticket className="h-5 w-5" />, label: 'Lottery', path: '/admin/lottery' },
    { icon: <Mail className="h-5 w-5" />, label: 'Messages', path: '/admin/messages' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-6 flex flex-col">
        <div 
          className="flex items-center justify-center mb-10 cursor-pointer group" 
          onClick={() => navigate('/')}
        >
          <motion.img 
            src={logo} 
            alt="Plant a Tree Logo" 
            className="h-16 w-16 object-contain"
            whileHover={{ rotate: 10, scale: 1.1 }}
          />
        </div>

        <nav className="flex-grow space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.icon}
                  <span className="font-semibold flex-grow">{item.label}</span>
                  {item.label === 'Finance' && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <motion.button 
          onClick={logout}
          className="mt-auto flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-red-900/20 hover:text-red-400 rounded-xl transition-all"
          whileHover={{ x: 5, backgroundColor: "rgba(127, 29, 29, 0.2)" }}
          whileTap={{ scale: 0.95 }}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-semibold">Logout</span>
        </motion.button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500">Manage the platform and monitor growth.</p>
          </div>
          <Link to="/dashboard" className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">
            User View
          </Link>
        </header>

        <Routes>
          <Route path="/" element={<AdminStats />} />
          <Route path="/packages" element={<ManagePackages />} />
          <Route path="/finance" element={<ManageFinance />} />
          <Route path="/users" element={<ManageUsers />} />
          <Route path="/referrals" element={<ManageReferrals />} />
          <Route path="/lottery" element={<ManageLottery />} />
          <Route path="/messages" element={<ManageMessages />} />
        </Routes>
      </main>
    </div>
  );
};

// Sub-components
const AdminStats = () => {
  const [stats, setStats] = useState<ImpactStats | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'stats', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data() as ImpactStats);
      } else {
        // Initialize stats if they don't exist
        setDoc(doc(db, 'stats', 'global'), {
          treesPlanted: 0,
          activeInvestors: 0,
          totalInvested: 0,
          returnsPaid: 0
        });
      }
    }, (error) => {
      console.error("AdminStats onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'stats/global');
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Trees Planted', value: stats?.treesPlanted || 0, icon: <Leaf className="text-green-600" />, bg: 'bg-green-50' },
          { label: 'Active Investors', value: stats?.activeInvestors || 0, icon: <Users className="text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Total Invested', value: `₹${stats?.totalInvested.toLocaleString() || 0}`, icon: <TrendingUp className="text-purple-600" />, bg: 'bg-purple-50' },
          { label: 'Returns Paid', value: `₹${stats?.returnsPaid.toLocaleString() || 0}`, icon: <Wallet className="text-orange-600" />, bg: 'bg-orange-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className={`p-3 ${stat.bg} rounded-2xl w-fit mb-4`}>
              {stat.icon}
            </div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Finance Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-slate-700">Pending Deposits</span>
              </div>
              <Link to="/admin/finance" className="px-4 py-1 bg-green-600 text-white text-xs font-bold rounded-full hover:bg-green-700 transition-all">
                View All
              </Link>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center space-x-3">
                <Wallet className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-slate-700">Withdrawal Requests</span>
              </div>
              <Link to="/admin/finance" className="px-4 py-1 bg-orange-600 text-white text-xs font-bold rounded-full hover:bg-orange-700 transition-all">
                View All
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Platform Overview</h3>
          <div className="h-32 flex items-center justify-center text-slate-300 font-bold italic">
            Platform analytics chart will appear here
          </div>
        </div>
      </div>
    </div>
  );
};

const ManagePackages = () => {
  const [packages, setPackages] = useState<TreePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<TreePackage | null>(null);
  const [pkgForm, setPkgForm] = useState<Partial<TreePackage>>({
    name: '',
    description: '',
    investmentAmount: 0,
    durationDays: 0,
    totalReturn: 0,
    dailyReturn: 0,
    imageUrl: '',
    badge: '',
    tagline: ''
  });

  const seedDefaultPackages = async () => {
    const defaultPackages = [
      {
        name: 'Free Plant',
        tagline: 'Start your journey for free - Get free money!',
        investmentAmount: 0,
        durationDays: 125,
        totalReturn: 250,
        dailyReturn: 2,
        badge: 'Free for everyone',
        description: 'A special gift for everyone to start their sustainable wealth journey. Plant a tree for free and watch it grow into real returns.',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=400'
      },
      {
        name: 'Marigold',
        tagline: 'Entry level plan - Perfect for beginners',
        investmentAmount: 300,
        durationDays: 45,
        totalReturn: 389,
        dailyReturn: 8.64,
        badge: 'Perfect for beginners',
        description: 'Marigolds are easy to grow and provide a steady entry into the world of green investments.',
        imageUrl: TREE_IMAGES.marigold
      },
      {
        name: 'Rose',
        tagline: 'Popular choice - Most popular',
        investmentAmount: 500,
        durationDays: 45,
        totalReturn: 769.95,
        dailyReturn: 17.11,
        badge: 'Most popular',
        description: 'The most popular choice for our investors, offering a beautiful balance of investment and returns.',
        imageUrl: TREE_IMAGES.rose
      },
      {
        name: 'Tulsi',
        tagline: 'Value option - Best value',
        investmentAmount: 800,
        durationDays: 60,
        totalReturn: 1799.8,
        dailyReturn: 30.00,
        badge: 'Best value',
        description: 'Known for its healing properties, Tulsi also provides excellent value for your investment.',
        imageUrl: TREE_IMAGES.tulsi
      },
      {
        name: 'Mango',
        tagline: 'Premium investment - Premium investor',
        investmentAmount: 1500,
        durationDays: 90,
        totalReturn: 2899.4,
        dailyReturn: 32.21,
        badge: 'Premium investor',
        description: 'Our premium package for serious investors looking for significant long-term growth.',
        imageUrl: TREE_IMAGES.mango
      }
    ];

    try {
      // Clear existing packages first
      const q = query(collection(db, 'packages'));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'packages', d.id));
      }

      for (const pkg of defaultPackages) {
        await addDoc(collection(db, 'packages'), {
          ...pkg,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        });
      }

      // Initialize global stats if not exists
      const statsDoc = await getDoc(doc(db, 'stats', 'global'));
      if (!statsDoc.exists()) {
        await setDoc(doc(db, 'stats', 'global'), {
          treesPlanted: 0,
          totalInvestors: 0,
          totalInvested: 0,
          todayWinningTicket: '1234567'
        });
      }

      alert("Successfully seeded default packages and initialized stats!");
    } catch (err) {
      console.error(err);
      alert("Failed to seed packages");
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'packages'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TreePackage));
      setPackages(data);
      setLoading(false);
    }, (error) => {
      console.error("AdminPackages onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'packages');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPkg) {
        await updateDoc(doc(db, 'packages', editingPkg.id), pkgForm);
      } else {
        await addDoc(collection(db, 'packages'), {
          ...pkgForm,
          id: Date.now().toString()
        });
      }
      setShowModal(false);
      setEditingPkg(null);
      setPkgForm({ name: '', description: '', investmentAmount: 0, durationDays: 0, totalReturn: 0, dailyReturn: 0, imageUrl: '', badge: '', tagline: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to save package");
    }
  };

  const handleEdit = (pkg: TreePackage) => {
    setEditingPkg(pkg);
    setPkgForm(pkg);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'packages', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Manage Tree Packages</h2>
        <div className="flex space-x-4">
          <button 
            onClick={seedDefaultPackages}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <TrendingUp className="h-5 w-5" />
            <span>Seed Defaults</span>
          </button>
          <button 
            onClick={() => {
              setEditingPkg(null);
              setPkgForm({ name: '', description: '', investmentAmount: 0, durationDays: 0, totalReturn: 0, dailyReturn: 0, imageUrl: '', badge: '', tagline: '' });
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200"
          >
            <Plus className="h-5 w-5" />
            <span>Add Package</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">{editingPkg ? 'Edit Package' : 'Add New Tree Package'}</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Package Name</label>
                  <input 
                    type="text" required
                    value={pkgForm.name}
                    onChange={e => setPkgForm({...pkgForm, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Tagline</label>
                  <input 
                    type="text" required
                    value={pkgForm.tagline}
                    onChange={e => setPkgForm({...pkgForm, tagline: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Investment Amount (₹)</label>
                  <input 
                    type="number" required
                    value={pkgForm.investmentAmount}
                    onChange={e => setPkgForm({...pkgForm, investmentAmount: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Duration (Days)</label>
                  <input 
                    type="number" required
                    value={pkgForm.durationDays}
                    onChange={e => setPkgForm({...pkgForm, durationDays: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Total Return (₹)</label>
                  <input 
                    type="number" required
                    value={pkgForm.totalReturn}
                    onChange={e => setPkgForm({...pkgForm, totalReturn: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Daily Return (₹)</label>
                  <input 
                    type="number" required
                    value={pkgForm.dailyReturn}
                    onChange={e => setPkgForm({...pkgForm, dailyReturn: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Badge (Optional)</label>
                  <input 
                    type="text"
                    value={pkgForm.badge}
                    onChange={e => setPkgForm({...pkgForm, badge: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Image URL</label>
                  <input 
                    type="url" required
                    value={pkgForm.imageUrl}
                    onChange={e => setPkgForm({...pkgForm, imageUrl: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Description</label>
                  <textarea 
                    required
                    value={pkgForm.description}
                    onChange={e => setPkgForm({...pkgForm, description: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none min-h-[100px]"
                  />
                </div>
                <div className="md:col-span-2 flex space-x-4 pt-4">
                  <button type="submit" className="flex-grow py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all">
                    {editingPkg ? 'Update Package' : 'Create Package'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {packages.map((pkg) => {
          const localImages: Record<string, string> = {
            'Marigold': TREE_IMAGES.marigold,
            'Rose': TREE_IMAGES.rose,
            'Tulsi': TREE_IMAGES.tulsi,
            'Mango': TREE_IMAGES.mango
          };
          const displayImage = localImages[pkg.name] || pkg.imageUrl;

          return (
          <div key={pkg.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md bg-slate-50">
                <img src={displayImage} alt={pkg.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">{pkg.name}</h4>
                <p className="text-sm text-slate-400">{pkg.tagline}</p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">₹{pkg.investmentAmount}</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{pkg.durationDays} Days</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => handleEdit(pkg)}
                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleDelete(pkg.id)}
                className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

const ManageUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userActivity, setUserActivity] = useState<{
    investments: any[],
    transactions: any[],
    withdrawals: any[]
  }>({ investments: [], transactions: [], withdrawals: [] });
  const [activityLoading, setActivityLoading] = useState(false);
  const [editBalance, setEditBalance] = useState<number>(0);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);

  useEffect(() => {
    const q = collection(db, 'users');
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      setUsers(data);
      setLoading(false);
    }, (error) => {
      console.error("ManageUsers onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'users');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchUserActivity = async (uid: string) => {
    setActivityLoading(true);
    try {
      const qInv = query(collection(db, 'investments'), where('userId', '==', uid));
      const qTrans = query(collection(db, 'transactions'), where('userId', '==', uid));
      const qWith = query(collection(db, 'withdrawals'), where('userId', '==', uid));

      const [snapInv, snapTrans, snapWith] = await Promise.all([
        getDocs(qInv),
        getDocs(qTrans),
        getDocs(qWith)
      ]);

      setUserActivity({
        investments: snapInv.docs.map(d => ({ id: d.id, ...d.data() })),
        transactions: snapTrans.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        withdrawals: snapWith.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      });
    } catch (err) {
      console.error("Error fetching user activity:", err);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleUpdateBalance = async (uid: string, amount: number) => {
    setIsUpdatingBalance(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        balance: increment(amount)
      });
      if (selectedUser && selectedUser.uid === uid) {
        setSelectedUser({ ...selectedUser, balance: selectedUser.balance + amount });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update balance");
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  const handleSetBalance = async (uid: string, newBalance: number) => {
    setIsUpdatingBalance(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        balance: newBalance
      });
      if (selectedUser && selectedUser.uid === uid) {
        setSelectedUser({ ...selectedUser, balance: newBalance });
      }
      alert("Balance updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to set balance");
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    setIsDeleting(true);
    try {
      const uid = user.uid;
      const email = user.email;

      // Collections to clean up
      const collections = [
        'investments',
        'transactions',
        'withdrawals',
        'referrals', // where referrerId == uid
        'tickets'
      ];

      for (const coll of collections) {
        let q;
        if (coll === 'referrals') {
          q = query(collection(db, coll), where('referrerId', '==', uid));
        } else {
          q = query(collection(db, coll), where('userId', '==', uid));
        }
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(doc(db, coll, d.id));
        }
      }

      // Also clean up referrals where the user was the one referred
      const qRefAsReferred = query(collection(db, 'referrals'), where('referredEmail', '==', email));
      const snapRefAsReferred = await getDocs(qRefAsReferred);
      for (const d of snapRefAsReferred.docs) {
        await deleteDoc(doc(db, 'referrals', d.id));
      }

      // Finally delete the user profile
      await deleteDoc(doc(db, 'users', uid));

      alert(`User ${user.displayName} and all associated data deleted successfully.`);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user completely.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">Platform Users</h2>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Invested</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center font-bold text-green-600">
                        {u.displayName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{u.displayName}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      u.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">₹{u.balance.toLocaleString()}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">₹{u.totalInvested.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedUser(u);
                          setEditBalance(u.balance);
                          setShowUserModal(true);
                          fetchUserActivity(u.uid);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => {
                          setUserToDelete(u);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete User"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowUserModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center font-bold text-2xl text-green-600">
                    {selectedUser.displayName[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedUser.displayName}</h3>
                    <p className="text-slate-500">{selectedUser.email}</p>
                    <p className="text-xs text-slate-400">UID: {selectedUser.uid}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Current Balance</div>
                  <div className="text-2xl font-black text-green-600">₹{selectedUser.balance.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      Modify Balance
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="number"
                          value={editBalance}
                          onChange={(e) => setEditBalance(Number(e.target.value))}
                          className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <button 
                          onClick={() => handleSetBalance(selectedUser.uid, editBalance)}
                          disabled={isUpdatingBalance}
                          className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                        >
                          Set
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateBalance(selectedUser.uid, 500)} className="flex-grow py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all">+₹500</button>
                        <button onClick={() => handleUpdateBalance(selectedUser.uid, 1000)} className="flex-grow py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all">+₹1000</button>
                        <button onClick={() => handleUpdateBalance(selectedUser.uid, -500)} className="flex-grow py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all">-₹500</button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-600" />
                      Active Investments
                    </h4>
                    <div className="space-y-3">
                      {activityLoading ? (
                        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
                      ) : userActivity.investments.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No active investments.</p>
                      ) : (
                        userActivity.investments.map(inv => (
                          <div key={inv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                            <div>
                              <div className="text-sm font-bold text-slate-700">{inv.packageName}</div>
                              <div className="text-[10px] text-slate-400">₹{inv.amount} • {inv.status}</div>
                            </div>
                            <div className="text-xs font-bold text-green-600">₹{inv.dailyReturn}/day</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <History className="h-5 w-5 text-purple-600" />
                      Recent Transactions
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {activityLoading ? (
                        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>
                      ) : userActivity.transactions.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No transactions found.</p>
                      ) : (
                        userActivity.transactions.map(tx => (
                          <div key={tx.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${tx.type === 'deposit' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                {tx.type === 'deposit' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-700 uppercase">{tx.type}</div>
                                <div className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-blue-600' : 'text-orange-600'}`}>
                              ₹{tx.amount}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && userToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete User?</h3>
              <p className="text-slate-500 mb-8">
                Are you sure you want to delete <span className="font-bold text-slate-900">{userToDelete.displayName}</span>? 
                This will permanently remove all their investments, transactions, and profile data. This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDeleteUser(userToDelete)}
                  disabled={isDeleting}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center space-x-2"
                >
                  {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                  <span>Delete Everything</span>
                </button>
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ManageMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
      setMessages(data);
      setLoading(false);
    }, (error) => {
      console.error("ManageMessages onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'messages');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">Contact Messages</h2>
      <div className="grid grid-cols-1 gap-4">
        {messages.length === 0 ? (
          <p className="text-center text-slate-400 py-10">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
              <button 
                onClick={() => handleDelete(msg.id)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center font-bold text-blue-600 uppercase">
                  {msg.name[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{msg.name}</div>
                  <div className="text-xs text-slate-400">{msg.email} • {new Date(msg.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{msg.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ManageFinance = () => {
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for pending deposits
    const qDep = query(collection(db, 'transactions'), where('type', '==', 'deposit'), where('status', '==', 'pending'));
    const unsubDep = onSnapshot(qDep, (snap) => {
      setPendingDeposits(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("ManageFinance unsubDep error:", error);
      handleFirestoreError(error, OperationType.GET, 'transactions');
    });

    // Listen for pending withdrawals
    const qWith = query(collection(db, 'withdrawals'), where('status', '==', 'pending'));
    const unsubWith = onSnapshot(qWith, (snap) => {
      setPendingWithdrawals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("ManageFinance unsubWith error:", error);
      handleFirestoreError(error, OperationType.GET, 'withdrawals');
    });

    // Listen for recent history (processed transactions)
    const qHist = query(collection(db, 'transactions'), where('status', 'in', ['success', 'rejected']), orderBy('date', 'desc'), limit(20));
    const unsubHist = onSnapshot(qHist, (snap) => {
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("ManageFinance unsubHist error:", error);
      handleFirestoreError(error, OperationType.GET, 'transactions');
    });

    setLoading(false);
    return () => {
      unsubDep();
      unsubWith();
      unsubHist();
    };
  }, []);

  const handleApproveDeposit = async (dep: any) => {
    try {
      // Update transaction status
      await updateDoc(doc(db, 'transactions', dep.id), {
        status: 'success'
      });

      // Update user balance
      await updateDoc(doc(db, 'users', dep.userId), {
        balance: increment(dep.amount)
      });

      alert("Deposit approved and balance updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to approve deposit");
    }
  };

  const handleRejectDeposit = async (dep: any) => {
    try {
      await updateDoc(doc(db, 'transactions', dep.id), {
        status: 'rejected',
        description: 'Admin has rejected your deposit'
      });
      alert("Deposit rejected");
    } catch (err) {
      console.error(err);
      alert("Failed to reject deposit");
    }
  };

  const handleApproveWithdrawal = async (withd: any) => {
    try {
      // Update withdrawal record
      await updateDoc(doc(db, 'withdrawals', withd.id), {
        status: 'success'
      });

      // Find and update the associated transaction
      const qTrans = query(collection(db, 'transactions'), where('userId', '==', withd.userId), where('amount', '==', withd.amount), where('type', '==', 'withdrawal'), where('status', '==', 'pending'));
      const snapTrans = await getDocs(qTrans);
      for (const d of snapTrans.docs) {
        await updateDoc(doc(db, 'transactions', d.id), {
          status: 'success'
        });
      }

      alert("Withdrawal marked as successful!");
    } catch (err) {
      console.error(err);
      alert("Failed to approve withdrawal");
    }
  };

  const handleRejectWithdrawal = async (withd: any) => {
    try {
      // Update withdrawal record
      await updateDoc(doc(db, 'withdrawals', withd.id), {
        status: 'rejected'
      });

      // Refund user balance
      await updateDoc(doc(db, 'users', withd.userId), {
        balance: increment(withd.amount)
      });

      // Update transaction
      const qTrans = query(collection(db, 'transactions'), where('userId', '==', withd.userId), where('amount', '==', withd.amount), where('type', '==', 'withdrawal'), where('status', '==', 'pending'));
      const snapTrans = await getDocs(qTrans);
      for (const d of snapTrans.docs) {
        await updateDoc(doc(db, 'transactions', d.id), {
          status: 'rejected',
          description: 'Admin has rejected your withdrawal (Refunded)'
        });
      }

      alert("Withdrawal rejected and balance refunded!");
    } catch (err) {
      console.error(err);
      alert("Failed to reject withdrawal");
    }
  };

  return (
    <div className="space-y-12">
      {/* Pending Deposits */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Pending Deposits</h2>
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">{pendingDeposits.length} Pending</span>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {pendingDeposits.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center text-slate-400">
              No pending deposits found.
            </div>
          ) : (
            pendingDeposits.map((dep) => (
              <div key={dep.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-50 rounded-2xl">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">₹{dep.amount.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">{dep.userName || 'Unknown'} ({dep.userEmail || dep.userId})</div>
                    <div className="text-xs text-slate-400">UTR: {dep.utrNumber} • {new Date(dep.date).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => handleApproveDeposit(dep)}
                    className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleRejectDeposit(dep)}
                    className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Pending Withdrawals */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Withdrawal Requests</h2>
          <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold">{pendingWithdrawals.length} Pending</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {pendingWithdrawals.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center text-slate-400">
              No pending withdrawals found.
            </div>
          ) : (
            pendingWithdrawals.map((withd) => (
              <div key={withd.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-orange-50 rounded-2xl">
                      <Wallet className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xl">₹{withd.amount.toLocaleString()}</div>
                      <div className="text-sm text-slate-400">{withd.userName} ({withd.userEmail})</div>
                      <div className="text-xs text-slate-400">{new Date(withd.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => handleApproveWithdrawal(withd)}
                      className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
                    >
                      Mark Paid
                    </button>
                    <button 
                      onClick={() => handleRejectWithdrawal(withd)}
                      className="px-6 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all"
                    >
                      Reject & Refund
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Full Name</div>
                    <div className="text-sm font-bold text-slate-700">{withd.bankDetails.fullName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</div>
                    <div className="text-sm font-bold text-slate-700">{withd.bankDetails.bankName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Account Number</div>
                    <div className="text-sm font-bold text-slate-700">{withd.bankDetails.accountNumber}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">IFSC Code</div>
                    <div className="text-sm font-bold text-slate-700">{withd.bankDetails.ifscCode}</div>
                  </div>
                  {withd.bankDetails.upiId && (
                    <div className="md:col-span-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">UPI ID</div>
                      <div className="text-sm font-bold text-slate-700">{withd.bankDetails.upiId}</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Finance History */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Finance History</h2>
          <span className="text-xs text-slate-400">Showing last 20 processed transactions</span>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Details</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                      No transaction history found.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">{item.userName || 'User'}</div>
                        <div className="text-[10px] text-slate-400">{item.userEmail || item.userId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          item.type === 'deposit' ? 'bg-blue-50 text-blue-600' : 
                          item.type === 'withdrawal' ? 'bg-orange-50 text-orange-600' : 
                          'bg-green-50 text-green-600'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">₹{item.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          item.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(item.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs max-w-[200px] truncate">
                        {item.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

const ManageReferrals = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'referrals'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
      // Sort in memory to avoid index requirements
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReferrals(data);
      setLoading(false);
    }, (error) => {
      console.error("Referrals onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'referrals');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Referral Tracking</h2>
          <p className="text-slate-500">Monitor user referrals and spin eligibility.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Referrer ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Referred User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Investment</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Spins (Used/Total)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No referrals found.</td>
                </tr>
              ) : (
                referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="text-xs font-mono text-slate-500">{ref.referrerId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{ref.referredName}</div>
                      <div className="text-[10px] text-slate-400">{ref.referredEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">₹{ref.investmentAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${ref.spinsUsed >= ref.spinsEarned ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-600'}`}>
                          {ref.spinsUsed} / {ref.spinsEarned}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ManageLottery = () => {
  const [tickets, setTickets] = useState<LotteryTicket[]>([]);
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [winningNumber, setWinningNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'tickets'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LotteryTicket));
      // Sort in memory to avoid index requirements
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTickets(data.slice(0, 100));
      setLoading(false);
    }, (error) => {
      console.error("Tickets onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'tickets');
      setLoading(false);
    });

    const unsubStats = onSnapshot(doc(db, 'stats', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ImpactStats;
        setStats(data);
        setWinningNumber(data.todayWinningTicket || '');
      }
    }, (error) => {
      console.error("Stats onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'stats/global');
    });

    return () => {
      unsubscribe();
      unsubStats();
    };
  }, []);

  const handleUpdateWinningNumber = async () => {
    if (!winningNumber || winningNumber.length !== 7) {
      alert("Please enter a valid 7-digit ticket number.");
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'stats', 'global'), {
        todayWinningTicket: winningNumber
      });
      alert("Winning ticket number updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update winning number.");
    } finally {
      setUpdating(false);
    }
  };

  const generateRandomWinningNumber = () => {
    const num = Math.floor(1000000 + Math.random() * 9000000).toString();
    setWinningNumber(num);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Lottery Management</h2>
          <p className="text-slate-500">Manage winning numbers and monitor ticket sales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Set Winning Number</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Today's Winning Ticket</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={winningNumber}
                    onChange={(e) => setWinningNumber(e.target.value.replace(/\D/g, '').slice(0, 7))}
                    placeholder="7-digit number"
                    className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button 
                    onClick={generateRandomWinningNumber}
                    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                    title="Generate Random"
                  >
                    <Sparkles className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <button 
                onClick={handleUpdateWinningNumber}
                disabled={updating}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center space-x-2"
              >
                {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                <span>Update Number</span>
              </button>
            </div>
          </div>

          <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-900/20">
            <div className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Total Tickets Sold</div>
            <div className="text-4xl font-black mb-4">{tickets.length}</div>
            <div className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Revenue Generated</div>
            <div className="text-4xl font-black">₹{(tickets.length * 100).toLocaleString()}</div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recent Ticket Purchases</h3>
              <span className="text-xs text-slate-400">Last 100 tickets</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Ticket Number</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">No tickets sold yet.</td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => {
                      const isWinner = ticket.ticketNumber === stats?.todayWinningTicket;
                      return (
                        <tr key={ticket.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                          <td className="px-6 py-4">
                            <div className="text-xs font-mono text-slate-500">{ticket.userId}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-black text-slate-900 font-mono tracking-widest">{ticket.ticketNumber}</div>
                          </td>
                          <td className="px-6 py-4">
                            {isWinner ? (
                              <span className="px-2 py-1 bg-green-100 text-green-600 text-[10px] font-black rounded-full uppercase flex items-center w-fit gap-1">
                                <Sparkles className="h-3 w-3" /> Winner
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full uppercase">No Match</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {new Date(ticket.date).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
