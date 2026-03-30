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
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy, increment } from 'firebase/firestore';
import { TreePackage, UserProfile, ImpactStats, ContactMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { TREE_IMAGES } from '../assets/treeImages';

const AdminPanel: React.FC = () => {
  const { user, profile, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      navigate('/dashboard');
    }
  }, [user, profile, loading, navigate]);

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
    { icon: <Users className="h-5 w-5" />, label: 'Users', path: '/admin/users' },
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
            src="/logo.png" 
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
                  <span className="font-semibold">{item.label}</span>
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
          <Route path="/users" element={<ManageUsers />} />
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
      }
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

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Platform Overview</h3>
        <div className="h-64 flex items-center justify-center text-slate-300 font-bold italic">
          Platform analytics chart will appear here
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
        badge: 'Free for everyone',
        description: 'A special gift for everyone to start their sustainable wealth journey. Plant a tree for free and watch it grow into real returns.',
        imageUrl: 'https://picsum.photos/seed/freeplant/400/400'
      },
      {
        name: 'Marigold',
        tagline: 'Entry level plan - Perfect for beginners',
        investmentAmount: 300,
        durationDays: 45,
        totalReturn: 90,
        badge: 'Perfect for beginners',
        description: 'Marigolds are easy to grow and provide a steady entry into the world of green investments.',
        imageUrl: 'https://picsum.photos/seed/marigold/400/400'
      },
      {
        name: 'Rose',
        tagline: 'Popular choice - Most popular',
        investmentAmount: 500,
        durationDays: 45,
        totalReturn: 270,
        badge: 'Most popular',
        description: 'The most popular choice for our investors, offering a beautiful balance of investment and returns.',
        imageUrl: 'https://picsum.photos/seed/rose/400/400'
      },
      {
        name: 'Tulsi',
        tagline: 'Value option - Best value',
        investmentAmount: 800,
        durationDays: 60,
        totalReturn: 600,
        badge: 'Best value',
        description: 'Known for its healing properties, Tulsi also provides excellent value for your investment.',
        imageUrl: 'https://picsum.photos/seed/tulsi/400/400'
      },
      {
        name: 'Mango',
        tagline: 'Premium investment - Premium investor',
        investmentAmount: 1500,
        durationDays: 90,
        totalReturn: 1800,
        badge: 'Premium investor',
        description: 'Our premium package for serious investors looking for significant long-term growth.',
        imageUrl: 'https://picsum.photos/seed/mango/400/400'
      }
    ];

    try {
      for (const pkg of defaultPackages) {
        await addDoc(collection(db, 'packages'), {
          ...pkg,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        });
      }
      alert("Successfully seeded default packages!");
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
      setPkgForm({ name: '', description: '', investmentAmount: 0, durationDays: 0, totalReturn: 0, imageUrl: '', badge: '', tagline: '' });
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
              setPkgForm({ name: '', description: '', investmentAmount: 0, durationDays: 0, totalReturn: 0, imageUrl: '', badge: '', tagline: '' });
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

  useEffect(() => {
    const q = collection(db, 'users');
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      setUsers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateBalance = async (uid: string, amount: number) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        balance: increment(amount)
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update balance");
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">Platform Users</h2>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Invested</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
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
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleUpdateBalance(u.uid, 100)}
                      className="px-3 py-1 bg-green-50 text-green-600 font-bold rounded-lg text-xs hover:bg-green-600 hover:text-white transition-all"
                    >
                      +₹100
                    </button>
                    <button 
                      onClick={() => handleUpdateBalance(u.uid, -100)}
                      className="px-3 py-1 bg-red-50 text-red-600 font-bold rounded-lg text-xs hover:bg-red-600 hover:text-white transition-all"
                    >
                      -₹100
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

export default AdminPanel;
