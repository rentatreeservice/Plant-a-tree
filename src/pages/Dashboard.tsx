import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TreePine, 
  Package, 
  User as UserIcon, 
  LogOut, 
  TrendingUp, 
  Wallet, 
  Leaf,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowDownToLine,
  Loader2,
  Shield,
  Copy,
  Check,
  QrCode
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, increment, getDocs, orderBy, limit } from 'firebase/firestore';
import { Investment, TreePackage, WithdrawalRequest } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { TREE_IMAGES } from '../assets/treeImages';
import { DEFAULT_PACKAGES } from '../constants/treeData';
import { QRCodeSVG } from 'qrcode.react';

const UPI_ID = "suruhh@ibl"; 
const PAYEE_NAME = "Plant a Tree";

const Dashboard: React.FC = () => {
  const { user, profile, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    fullName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  useEffect(() => {
    if (profile?.bankDetails) {
      setBankDetails(profile.bankDetails);
    }
  }, [profile]);

  useEffect(() => {
    console.log('Dashboard state:', { loading, user: !!user, profile: !!profile });
    if (!loading && !user) {
      console.log('No user, navigating to login');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
          <p className="text-slate-500 text-sm animate-pulse">
            {loading ? 'Loading your profile...' : !user ? 'Redirecting to login...' : 'Preparing your dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Overview', path: '/dashboard' },
    { icon: <TreePine className="h-5 w-5" />, label: 'My Investments', path: '/dashboard/investments' },
    { icon: <Package className="h-5 w-5" />, label: 'Tree Packages', path: '/dashboard/packages' },
    { icon: <UserIcon className="h-5 w-5" />, label: 'Profile', path: '/dashboard/profile' },
  ];

  if (profile.role === 'admin') {
    navItems.splice(1, 0, { icon: <Shield className="h-5 w-5" />, label: 'All Users', path: '/dashboard/users' });
    navItems.splice(2, 0, { icon: <ArrowDownToLine className="h-5 w-5" />, label: 'Withdrawals', path: '/dashboard/withdrawals' });
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !depositAmount || Number(depositAmount) <= 0) return;
    setShowQRCode(true);
  };

  const handleConfirmPayment = async () => {
    if (!profile || !depositAmount || !utrNumber) {
      alert("Please enter the Transaction ID / UTR Number.");
      return;
    }

    setIsDepositing(true);
    try {
      const amount = Number(depositAmount);
      
      // Log pending transaction in Firestore for admin approval
      await addDoc(collection(db, 'transactions'), {
        userId: profile.uid,
        userEmail: profile.email,
        userName: profile.displayName,
        amount: amount,
        type: 'deposit',
        description: `Wallet Deposit (UPI QR)`,
        utrNumber: utrNumber,
        date: new Date().toISOString(),
        status: 'pending'
      });

      alert("Payment details submitted! Your balance will be updated once verified by our team.");
      setShowQRCode(false);
      setShowDeposit(false);
      setDepositAmount('');
      setUtrNumber('');
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !withdrawAmount) return;
    
    const amount = Number(withdrawAmount);
    
    if (amount < 150) {
      alert("Minimum withdrawal amount is ₹150.");
      return;
    }

    if (amount > profile.balance) {
      alert("Insufficient balance. You cannot withdraw more than your current wallet balance.");
      return;
    }

    // Check if bank details are filled (except UPI ID which is optional)
    if (!bankDetails.fullName || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      alert("Please fill in all required bank details.");
      return;
    }

    setIsWithdrawing(true);
    try {
      // Save bank details to profile and deduct balance
      await updateDoc(doc(db, 'users', profile.uid), {
        bankDetails: bankDetails,
        balance: increment(-amount)
      });

      // Create withdrawal record (Success status as requested for amount >= 150)
      await addDoc(collection(db, 'withdrawals'), {
        userId: profile.uid,
        userEmail: profile.email,
        userName: profile.displayName,
        amount: amount,
        bankDetails: bankDetails,
        status: 'success',
        createdAt: new Date().toISOString()
      });

      // Log transaction
      await addDoc(collection(db, 'transactions'), {
        userId: profile.uid,
        amount: amount,
        type: 'withdrawal',
        description: 'Withdrawal Successful',
        date: new Date().toISOString(),
        status: 'success'
      });

      setShowWithdraw(false);
      setWithdrawAmount('');
      alert(`Withdrawal of ₹${amount} was successful! The funds will be transferred to your bank account.`);
    } catch (err) {
      console.error('Withdrawal error:', err);
      alert("Withdrawal failed. Please check your connection and try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Deposit Modal */}
      <AnimatePresence>
        {showDeposit && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Deposit Funds</h3>
              <p className="text-slate-500 mb-8">Add money to your wallet to start investing.</p>
              
              {!showQRCode ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {[300, 500, 800, 1500].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setDepositAmount(amount.toString())}
                        className={`py-4 rounded-2xl border-2 font-bold transition-all ${
                          depositAmount === amount.toString() 
                            ? 'border-green-600 bg-green-50 text-green-600' 
                            : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-green-200'
                        }`}
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleDeposit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400 uppercase">Custom Amount (₹)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input 
                          type="number" 
                          required
                          min="1"
                          value={depositAmount}
                          onChange={e => setDepositAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-lg"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      <button 
                        type="submit" 
                        className="flex-grow py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                      >
                        <QrCode className="h-5 w-5" />
                        Generate QR Code
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowDeposit(false)}
                        className="px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="space-y-6 flex flex-col items-center">
                  <div className="p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-sm">
                    <QRCodeSVG 
                      value={`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${depositAmount}&cu=INR&tn=Wallet%20Deposit`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  
                  <div className="text-center space-y-1">
                    <div className="text-lg font-bold text-slate-900">₹{depositAmount}</div>
                    <div className="text-sm text-slate-500">
                      Scan to pay securely via UPI
                    </div>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Transaction ID / UTR Number</label>
                      <input 
                        type="text" 
                        required
                        value={utrNumber}
                        onChange={e => setUtrNumber(e.target.value)}
                        placeholder="Enter 12-digit UTR number"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button 
                        onClick={handleConfirmPayment}
                        disabled={isDepositing}
                        className="flex-grow py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isDepositing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                        Confirm Payment
                      </button>
                      <button 
                        onClick={() => setShowQRCode(false)}
                        className="px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 text-center italic">
                    Scan the QR code with any UPI app (GPay, PhonePe, Paytm) and enter the transaction ID after payment.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showWithdraw && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Withdraw Funds</h3>
              <p className="text-slate-500 mb-8">Transfer your earnings to your bank account.</p>
              
              <form onSubmit={handleWithdraw} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Withdrawal Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input 
                      type="number" 
                      required
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-lg"
                    />
                  </div>
                  <p className="text-xs text-slate-400">Available Balance: ₹{profile.balance.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={bankDetails.fullName}
                      onChange={e => setBankDetails({...bankDetails, fullName: e.target.value})}
                      placeholder="As per bank record"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase">Bank Name</label>
                    <input 
                      type="text" 
                      required
                      value={bankDetails.bankName}
                      onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})}
                      placeholder="e.g. HDFC Bank"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase">Account Number</label>
                    <input 
                      type="text" 
                      required
                      value={bankDetails.accountNumber}
                      onChange={e => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                      placeholder="Enter account number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase">IFSC Code</label>
                    <input 
                      type="text" 
                      required
                      value={bankDetails.ifscCode}
                      onChange={e => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-400 uppercase">UPI ID (Optional)</label>
                    <input 
                      type="text" 
                      value={bankDetails.upiId}
                      onChange={e => setBankDetails({...bankDetails, upiId: e.target.value})}
                      placeholder="e.g. name@upi"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button 
                    type="submit" 
                    disabled={isWithdrawing}
                    className="flex-grow py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isWithdrawing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowDownToLine className="h-5 w-5" />}
                    {isWithdrawing ? 'Processing...' : 'Request Withdrawal'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowWithdraw(false)}
                    className="px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
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
                      ? 'bg-green-600 text-white shadow-lg shadow-green-100' 
                      : 'text-slate-500 hover:bg-green-50 hover:text-green-600'
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
          className="mt-auto flex items-center space-x-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
          whileHover={{ x: 5, backgroundColor: "rgba(254, 226, 226, 0.5)" }}
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
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {profile.role === 'admin' ? 'TreeAdmin' : profile.displayName}!
            </h1>
            <p className="text-slate-500">Here's what's happening with your trees today.</p>
          </div>
          <div className="flex items-center space-x-4">
            <motion.button 
              onClick={() => setShowWithdraw(true)}
              className="px-4 py-2 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowDownToLine className="h-4 w-4" />
              Withdraw
            </motion.button>
            <motion.button 
              onClick={() => setShowDeposit(true)}
              className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(22, 163, 74, 0.3)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-4 w-4" />
              Deposit
            </motion.button>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center space-x-3">
              <div className="bg-green-100 p-1.5 rounded-lg">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">Balance</div>
                <div className="text-lg font-bold text-slate-900">₹{profile.balance.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/investments" element={<MyInvestments />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/profile" element={<Profile />} />
          {profile.role === 'admin' && (
            <>
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/withdrawals" element={<AdminWithdrawals />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
};

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setWithdrawals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected', userId: string, amount: number) => {
    try {
      await updateDoc(doc(db, 'withdrawals', id), { status });
      
      // If rejected, refund the balance
      if (status === 'rejected') {
        await updateDoc(doc(db, 'users', userId), {
          balance: increment(amount)
        });
        
        await addDoc(collection(db, 'transactions'), {
          userId,
          amount,
          type: 'refund',
          description: 'Withdrawal Rejected - Refunded',
          date: new Date().toISOString(),
          status: 'success'
        });
      }

      alert(`Withdrawal ${status} successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Withdrawal Requests</h2>
        <p className="text-slate-500 text-sm">Manage user withdrawal requests and bank transfers.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Bank Details</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {withdrawals.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{w.userName}</div>
                  <div className="text-xs text-slate-400">{w.userEmail}</div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-900">₹{w.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="text-xs space-y-1">
                    <p><span className="font-bold">Bank:</span> {w.bankDetails.bankName}</p>
                    <p><span className="font-bold">Acc:</span> {w.bankDetails.accountNumber}</p>
                    <p><span className="font-bold">IFSC:</span> {w.bankDetails.ifscCode}</p>
                    {w.bankDetails.upiId && <p><span className="font-bold">UPI:</span> {w.bankDetails.upiId}</p>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    w.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                    w.status === 'approved' ? 'bg-green-100 text-green-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {w.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(w.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {w.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleStatusUpdate(w.id, 'approved', w.userId, w.amount)}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(w.id, 'rejected', w.userId, w.amount)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Reject"
                      >
                        <AlertCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {withdrawals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                  No withdrawal requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Sub-components
const Overview = () => {
  const { user, profile } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [activeTrees, setActiveTrees] = useState(0);
  const [featuredPackages, setFeaturedPackages] = useState<TreePackage[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    
    // Fetch recent transactions
    const qTrans = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc'), limit(5));
    const unsubTrans = onSnapshot(qTrans, (snap) => {
      setActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch active investments count
    const qInv = query(collection(db, 'investments'), where('userId', '==', user.uid), where('status', '==', 'active'));
    const unsubInv = onSnapshot(qInv, (snap) => {
      setActiveTrees(snap.size);
    });

    // Fetch featured packages
    const qPkg = query(collection(db, 'packages'), limit(3));
    const unsubPkg = onSnapshot(qPkg, (snap) => {
      setFeaturedPackages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TreePackage)));
    });

    // Fetch global stats if admin
    let unsubStats = () => {};
    if (profile?.role === 'admin') {
      unsubStats = onSnapshot(doc(db, 'stats', 'global'), (doc) => {
        setGlobalStats(doc.data());
      });
    }

    return () => {
      unsubTrans();
      unsubInv();
      unsubPkg();
      unsubStats();
    };
  }, [user, profile]);

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">
            {isAdmin ? 'Global Total Invested' : 'Total Invested'}
          </div>
          <div className="text-3xl font-bold text-slate-900">
            ₹{(isAdmin ? globalStats?.totalInvested : profile?.totalInvested)?.toLocaleString() || 0}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-2xl">
              <Wallet className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">
            {isAdmin ? 'Global Returns Paid' : 'Total Returns'}
          </div>
          <div className="text-3xl font-bold text-slate-900">
            ₹{(isAdmin ? globalStats?.returnsPaid : profile?.totalReturns)?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-2xl">
              <TreePine className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">
            {isAdmin ? 'Global Trees Planted' : 'Active Trees'}
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {isAdmin ? globalStats?.treesPlanted : activeTrees}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Featured Packages */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Featured Packages</h3>
            <Link to="/dashboard/packages" className="text-sm font-bold text-green-600 hover:text-green-700">View All</Link>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {(featuredPackages.length > 0 ? featuredPackages : DEFAULT_PACKAGES.slice(0, 3)).map((pkg) => (
                <Link key={pkg.id} to="/dashboard/packages" className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl overflow-hidden">
                      <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{pkg.name}</div>
                      <div className="text-xs text-slate-400">₹{pkg.investmentAmount} • {pkg.durationDays} Days</div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Recent Activity</h3>
            <Link to="/dashboard/investments" className="text-sm font-bold text-green-600 hover:text-green-700">View All</Link>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {activities.length === 0 ? (
                <p className="text-center text-slate-400 py-4">No recent activity</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-xl ${activity.type === 'deposit' ? 'bg-blue-50' : 'bg-green-50'}`}>
                        {activity.type === 'deposit' ? <Wallet className="h-5 w-5 text-blue-600" /> : <Leaf className="h-5 w-5 text-green-600" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{activity.description}</div>
                        <div className="text-xs text-slate-400">{new Date(activity.date).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${activity.type === 'deposit' || activity.type === 'return' || activity.type === 'refund' ? 'text-green-600' : 'text-slate-900'}`}>
                        {activity.type === 'deposit' || activity.type === 'return' || activity.type === 'refund' ? '+' : '-'}₹{activity.amount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-green-600 font-bold uppercase">{activity.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyInvestments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'investments'), where('userId', '==', user.uid), orderBy('startDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment));
      setInvestments(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const isClaimedToday = (inv: Investment) => {
    if (!inv.lastClaimDate) return false;
    const today = new Date();
    const lastClaim = new Date(inv.lastClaimDate);
    return today.getFullYear() === lastClaim.getFullYear() &&
           today.getMonth() === lastClaim.getMonth() &&
           today.getDate() === lastClaim.getDate();
  };

  const calculateEarned = (inv: Investment) => {
    if (inv.status === 'completed') return inv.expectedReturn - (inv.claimedAmount || 0);
    
    // If already claimed today, earned for today is 0
    if (isClaimedToday(inv)) return 0;

    const lastClaim = inv.lastClaimDate ? new Date(inv.lastClaimDate).getTime() : new Date(inv.startDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.max(0, Math.floor((now - lastClaim) / (1000 * 60 * 60 * 24)));
    
    const remainingToEarn = inv.expectedReturn - (inv.claimedAmount || 0);
    const earned = Math.min(remainingToEarn, diffDays * inv.dailyReturn);
    return earned;
  };

  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (inv: Investment) => {
    if (claimingId) return;
    
    const earned = calculateEarned(inv);
    console.log('Attempting to claim returns:', { investmentId: inv.id, earned, userId: user?.uid });

    if (earned <= 0) {
      if (isClaimedToday(inv)) {
        alert("You have already claimed your returns for today. Please come back tomorrow!");
      } else {
        alert("No returns available to claim yet. Returns are calculated daily from the start of your investment.");
      }
      return;
    }

    setClaimingId(inv.id);
    try {
      const investmentRef = doc(db, 'investments', inv.id);
      const userRef = doc(db, 'users', user!.uid);

      console.log('Updating Firestore documents...');
      
      // Update investment
      await updateDoc(investmentRef, {
        claimedAmount: increment(earned),
        lastClaimDate: new Date().toISOString(),
        status: (inv.claimedAmount || 0) + earned >= inv.expectedReturn ? 'completed' : 'active'
      });

      // Update user balance
      await updateDoc(userRef, {
        balance: increment(earned),
        totalReturns: increment(earned)
      });

      // Log transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user!.uid,
        amount: earned,
        type: 'return',
        description: `Returns from ${inv.packageName}`,
        date: new Date().toISOString(),
        status: 'success'
      });

      console.log('Claim successful!');
      alert(`Successfully claimed ₹${earned.toFixed(2)} in returns! Your balance has been updated.`);
    } catch (err) {
      console.error('Error claiming returns:', err);
      alert("Failed to claim returns. Please check your internet connection and try again.");
    } finally {
      setClaimingId(null);
    }
  };

  const getProgress = (inv: Investment) => {
    if (inv.status === 'completed') return 100;
    const start = new Date(inv.startDate).getTime();
    const end = new Date(inv.endDate).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const current = now - start;
    return Math.min(100, Math.max(0, (current / total) * 100));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" /></div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">My Investments</h2>
      
      {investments.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center">
          <div className="bg-green-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <TreePine className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No investments yet</h3>
          <p className="text-slate-500 mb-8">Start your journey by choosing a tree package.</p>
          <Link to="/dashboard/packages" className="inline-flex px-8 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-200">
            Browse Packages
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {investments.map((inv) => (
            <div key={inv.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{inv.packageName}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Started {new Date(inv.startDate).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  inv.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {inv.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Invested</div>
                  <div className="text-lg font-bold text-slate-900">₹{inv.amount.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Earned</div>
                  <div className="text-lg font-bold text-green-700">₹{calculateEarned(inv).toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Growth Progress</span>
                  <span>{Math.round(getProgress(inv))}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgress(inv)}%` }}
                    className="h-full bg-green-600 rounded-full"
                  />
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-50 flex flex-col space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <div className="text-slate-400">Daily Return: <span className="text-green-600 font-bold">₹{inv.dailyReturn.toFixed(2)}</span></div>
                  <div className="text-slate-400">Ends: <span className="text-slate-900 font-bold">{new Date(inv.endDate).toLocaleDateString()}</span></div>
                </div>
                
                {inv.status === 'active' && (
                  <motion.button
                    onClick={() => handleClaim(inv)}
                    disabled={isClaimedToday(inv) || claimingId === inv.id}
                    whileHover={isClaimedToday(inv) || claimingId === inv.id ? {} : { scale: 1.02 }}
                    whileTap={isClaimedToday(inv) || claimingId === inv.id ? {} : { scale: 0.98 }}
                    className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      isClaimedToday(inv) 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : claimingId === inv.id
                        ? 'bg-green-100 text-green-600 cursor-wait'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {claimingId === inv.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Claiming...
                      </>
                    ) : isClaimedToday(inv) ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Claimed Today
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4" />
                        Claim Returns (₹{calculateEarned(inv).toFixed(2)})
                      </>
                    )}
                  </motion.button>
                )}
                
                {inv.claimedAmount && inv.claimedAmount > 0 && (
                  <div className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                    Total Claimed: ₹{inv.claimedAmount.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Packages = () => {
  const { profile } = useAuth();
  const [packages, setPackages] = useState<TreePackage[]>([]);
  const [userInvestments, setUserInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const q = collection(db, 'packages');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TreePackage));
      setPackages(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'investments'), where('userId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserInvestments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile]);

  const [error, setError] = useState<string | null>(null);

  const handleInvest = async (pkg: TreePackage) => {
    if (!profile) return;

    // Check if it's a free plant and if user already has one
    if (pkg.investmentAmount === 0 || pkg.name.toLowerCase().includes('free')) {
      const hasFreePlant = userInvestments.some(inv => 
        inv.packageName.toLowerCase().includes('free') || inv.amount === 0
      );
      if (hasFreePlant) {
        setError("You have already claimed your Free Plant! This package can only be activated once per lifetime.");
        setTimeout(() => setError(null), 5000);
        return;
      }
    }

    if (profile.balance < pkg.investmentAmount) {
      setError("Insufficient balance! Please add funds to your wallet.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setInvesting(pkg.id);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + pkg.durationDays);

      const investmentData = {
        userId: profile.uid,
        packageId: pkg.id,
        packageName: pkg.name,
        amount: pkg.investmentAmount,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active',
        expectedReturn: pkg.totalReturn,
        dailyReturn: pkg.dailyReturn
      };

      await addDoc(collection(db, 'investments'), investmentData);
      
      // Update user profile
      await updateDoc(doc(db, 'users', profile.uid), {
        balance: increment(-pkg.investmentAmount),
        totalInvested: increment(pkg.investmentAmount)
      });

      // Update global stats
      await updateDoc(doc(db, 'stats', 'global'), {
        treesPlanted: increment(1),
        totalInvested: increment(pkg.investmentAmount)
      });

      setSuccess(pkg.name);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Investment failed. Please try again.");
    } finally {
      setInvesting(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Tree Packages</h2>
        <p className="text-slate-500 text-lg">Choose from our variety of tree packages to grow your wealth sustainably</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg mb-6"
          >
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6" />
              <span className="font-bold">{error}</span>
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg mb-6"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-6 w-6" />
              <span className="font-bold">Successfully invested in {success}!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(packages.length > 0 ? packages : DEFAULT_PACKAGES).map((pkg) => {
          // Map local images if available
          const localImages: Record<string, string> = {
            'Marigold': TREE_IMAGES.marigold,
            'Rose': TREE_IMAGES.rose,
            'Tulsi': TREE_IMAGES.tulsi,
            'Mango': TREE_IMAGES.mango
          };
          const displayImage = localImages[pkg.name] || pkg.imageUrl;
          const isFree = pkg.investmentAmount === 0 || pkg.name.toLowerCase().includes('free');
          const alreadyClaimed = isFree && userInvestments.some(inv => 
            inv.packageName.toLowerCase().includes('free') || inv.amount === 0
          );

          return (
            <motion.div 
              key={pkg.id} 
              className={`bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm transition-all group ${alreadyClaimed ? 'opacity-75' : ''}`}
              whileHover={alreadyClaimed ? {} : { y: -10, scale: 1.02, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="relative h-40 overflow-hidden bg-green-50/50">
                <motion.img 
                  src={displayImage} 
                  alt={pkg.name} 
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
                  referrerPolicy="no-referrer" 
                />
                {pkg.badge && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-green-700">
                    {pkg.badge}
                  </div>
                )}
                {alreadyClaimed && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-white px-4 py-2 rounded-full text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Already Claimed
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{pkg.name}</h3>
                <p className="text-slate-400 text-xs mb-6">{pkg.tagline}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 p-3 rounded-xl text-center">
                    <div className="text-green-600 font-bold">₹{pkg.investmentAmount}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Invest</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl text-center">
                    <div className="text-green-600 font-bold">{pkg.durationDays}d</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Period</div>
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded-xl text-center mb-6 border border-green-100">
                  <div className="text-green-700 font-bold text-sm">Return: ₹{pkg.totalReturn} + Principal</div>
                </div>

                  <motion.button 
                    onClick={() => !alreadyClaimed && handleInvest(pkg)}
                    disabled={investing === pkg.id || alreadyClaimed}
                    className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      alreadyClaimed 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    whileHover={alreadyClaimed ? {} : { scale: 1.05 }}
                    whileTap={alreadyClaimed ? {} : { scale: 0.95 }}
                  >
                    {investing === pkg.id ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : alreadyClaimed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Wallet className="h-4 w-4" />
                    )}
                    {investing === pkg.id 
                      ? 'Processing...' 
                      : alreadyClaimed 
                        ? 'Claimed' 
                        : pkg.investmentAmount === 0 
                          ? 'Get Free Plant' 
                          : `Invest in ${pkg.name}`}
                  </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="text-center mt-12">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Choose a plan to start earning</p>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userInvestments, setUserInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserInvestments = async (userId: string) => {
    const q = query(collection(db, 'investments'), where('userId', '==', userId));
    const snap = await getDocs(q);
    setUserInvestments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment)));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-500">
          Total Users: {users.length}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Invested</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Returns</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.uid} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
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
                    <td className="px-6 py-4 font-bold text-slate-900">₹{u.balance.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-blue-600">₹{u.totalInvested.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-green-600">₹{u.totalReturns.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedUser(u);
                          fetchUserInvestments(u.uid);
                        }}
                        className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-all"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                <LogOut className="h-6 w-6 text-slate-400" />
              </button>

              <div className="flex items-center space-x-6 mb-10">
                <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center text-2xl font-bold text-green-600">
                  {selectedUser.displayName[0]}
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-900">{selectedUser.displayName}</h3>
                  <p className="text-slate-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-50 p-6 rounded-3xl">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Wallet Balance</div>
                  <div className="text-2xl font-bold text-slate-900">₹{selectedUser.balance.toLocaleString()}</div>
                </div>
                <div className="bg-blue-50 p-6 rounded-3xl">
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Total Invested</div>
                  <div className="text-2xl font-bold text-blue-600">₹{selectedUser.totalInvested.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 p-6 rounded-3xl">
                  <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">Total Returns</div>
                  <div className="text-2xl font-bold text-green-600">₹{selectedUser.totalReturns.toLocaleString()}</div>
                </div>
              </div>

              {selectedUser.bankDetails && (
                <div className="mb-10 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    Bank Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Full Name</div>
                      <div className="font-bold text-slate-900">{selectedUser.bankDetails.fullName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bank Name</div>
                      <div className="font-bold text-slate-900">{selectedUser.bankDetails.bankName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Account Number</div>
                      <div className="font-bold text-slate-900 font-mono">{selectedUser.bankDetails.accountNumber}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">IFSC Code</div>
                      <div className="font-bold text-slate-900 font-mono">{selectedUser.bankDetails.ifscCode}</div>
                    </div>
                    {selectedUser.bankDetails.upiId && (
                      <div className="md:col-span-2">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">UPI ID</div>
                        <div className="font-bold text-green-600">{selectedUser.bankDetails.upiId}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <h4 className="text-xl font-bold text-slate-900 mb-6">Investments</h4>
              <div className="space-y-4">
                {userInvestments.length === 0 ? (
                  <p className="text-slate-400 italic">No investments found for this user.</p>
                ) : (
                  userInvestments.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-900">{inv.packageName}</div>
                        <div className="text-xs text-slate-400">₹{inv.amount.toLocaleString()} • {inv.status}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">Return: ₹{inv.expectedReturn.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Ends: {new Date(inv.endDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Profile = () => {
  const { profile } = useAuth();
  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">Account Profile</h2>
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center text-3xl font-bold text-green-600">
            {profile?.displayName[0]}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{profile?.displayName}</h3>
            <p className="text-slate-500">{profile?.email}</p>
            <div className="mt-2 inline-flex px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full uppercase">
              {profile?.role} Account
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-100">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Member Since</label>
            <div className="text-slate-900 font-bold mt-1">{new Date(profile?.createdAt || '').toLocaleDateString()}</div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Status</label>
            <div className="text-green-600 font-bold mt-1 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Verified</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100">
          <button className="px-6 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
