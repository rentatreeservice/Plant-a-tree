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
  Gift,
  Ticket,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, increment, getDocs, orderBy, limit } from 'firebase/firestore';
import { Investment, TreePackage, WithdrawalRequest } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { TREE_IMAGES } from '../assets/treeImages';
import { DEFAULT_PACKAGES } from '../constants/treeData';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';
const logo = "https://raw.githubusercontent.com/rentatreeservice/Plant-a-tree/main/src/assets/logo.png";

const UPI_ID = "rentatreeservice@gmail.com";
// However, for the QR code to work, we need a valid UPI ID. 
// The user said "I dont want you to show my upi id" - I can hide the text but the QR must contain it.
const PAYEE_NAME = "Plant a Tree";

const Dashboard: React.FC = () => {
  const { user, profile, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isTicketDeposit, setIsTicketDeposit] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

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
    { icon: <Gift className="h-5 w-5" />, label: 'Referral', path: '/dashboard/referral' },
    { icon: <Sparkles className="h-5 w-5" />, label: 'Earn More', path: '/dashboard/earn-more' },
    { icon: <UserIcon className="h-5 w-5" />, label: 'Profile', path: '/dashboard/profile' },
  ];

  if (profile.role === 'admin') {
    navItems.push({ icon: <Shield className="h-5 w-5" />, label: 'Admin Panel', path: '/admin' });
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !depositAmount) return;

    const amount = Number(depositAmount);
    if (amount < 1) {
      alert("Minimum deposit amount is ₹1.");
      return;
    }

    setShowQR(true);
  };

  const handleConfirmPayment = async () => {
    if (!utrNumber || utrNumber.length < 12) {
      alert("Please enter a valid 12-digit UTR/Transaction ID.");
      return;
    }

    setIsConfirming(true);
    try {
      // Log the deposit request in Firestore
      await addDoc(collection(db, 'transactions'), {
        userId: user?.uid,
        userEmail: profile?.email || user?.email,
        userName: profile?.displayName || user?.displayName || 'Anonymous',
        type: 'deposit',
        amount: Number(depositAmount),
        description: isTicketDeposit ? 'Lottery Ticket Deposit' : `Wallet Deposit (UTR: ${utrNumber})`,
        date: new Date().toISOString(),
        status: 'pending',
        utrNumber: utrNumber,
        isTicketDeposit: isTicketDeposit
      });

      if (isTicketDeposit) {
        // Generate ticket immediately for the "Oops" message
        const ticketNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
        // We don't save it to 'tickets' yet because it's pending, 
        // but the user wants to see the "Oops" message now.
        // Actually, let's save it but mark it as pending? 
        // Or just show it in UI.
        // The user said "give them random ticket number must not be matched with today ticket number"
        window.dispatchEvent(new CustomEvent('ticket-purchased', { detail: { ticketNumber } }));
      }

      alert(isTicketDeposit ? "Ticket request submitted! Your ticket will be active once deposit is verified." : "Deposit request submitted! Your balance will be updated once verified (usually within 30-60 minutes).");
      setShowQR(false);
      setShowDeposit(false);
      setDepositAmount('');
      setUtrNumber('');
      setIsTicketDeposit(false);
    } catch (err) {
      console.error('Confirm payment error:', err);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !withdrawAmount) return;
    
    const amount = Number(withdrawAmount);
    
    if (amount < 300) {
      alert("Minimum withdrawal amount is ₹300.");
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

      // Create withdrawal record
      await addDoc(collection(db, 'withdrawals'), {
        userId: profile.uid,
        userEmail: profile.email,
        userName: profile.displayName,
        amount: amount,
        bankDetails: bankDetails,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Log transaction
      await addDoc(collection(db, 'transactions'), {
        userId: profile.uid,
        userEmail: profile.email,
        userName: profile.displayName,
        amount: amount,
        type: 'withdrawal',
        description: 'Withdrawal sent',
        date: new Date().toISOString(),
        status: 'pending'
      });

      setShowWithdraw(false);
      setWithdrawAmount('');
      alert(`Withdrawal of ₹${amount} request submitted! The funds will be transferred to your bank account after verification.`);
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
              <p className="text-slate-500 mb-8">Add money to your wallet to start planting.</p>
              
              {!showQR ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {[100, 300, 500, 1000].map((amount) => (
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
                        <Wallet className="h-5 w-5" />
                        Next
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
                <div className="flex flex-col items-center space-y-6">
                  <div className="bg-white p-6 rounded-[2rem] shadow-inner border-2 border-slate-50">
                    <QRCodeSVG 
                      value={`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${depositAmount}&cu=INR`}
                      size={200}
                      level="H"
                    />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold text-slate-400 uppercase">Scan to Pay</p>
                    <p className="text-3xl font-black text-slate-900">₹{Number(depositAmount).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Payee: {PAYEE_NAME}</p>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-400 uppercase">Enter 12-digit UTR/Transaction ID</label>
                      <input 
                        type="text" 
                        maxLength={12}
                        value={utrNumber}
                        onChange={e => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="0000 0000 0000"
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-center text-xl tracking-widest"
                      />
                    </div>

                    <div className="flex space-x-4">
                      <button 
                        onClick={handleConfirmPayment}
                        disabled={isConfirming || utrNumber.length < 12}
                        className="flex-grow py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isConfirming ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                        Confirm Payment
                      </button>
                      <button 
                        onClick={() => setShowQR(false)}
                        className="px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                      >
                        Back
                      </button>
                    </div>
                  </div>
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
          <Route path="/referral" element={<ReferralSection />} />
          <Route path="/earn-more" element={<EarnMoreSection setShowDeposit={setShowDeposit} setDepositAmount={setDepositAmount} setIsTicketDeposit={setIsTicketDeposit} />} />
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
    }, (error) => {
      console.error("AdminWithdrawals onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'withdrawals');
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
    }, (error) => {
      console.error("Overview Transactions onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'transactions');
    });

    // Fetch active investments count
    const qInv = query(collection(db, 'investments'), where('userId', '==', user.uid), where('status', '==', 'active'));
    const unsubInv = onSnapshot(qInv, (snap) => {
      setActiveTrees(snap.size);
    }, (error) => {
      console.error("Overview Investments onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'investments');
    });

    // Fetch featured packages
    const qPkg = query(collection(db, 'packages'), limit(3));
    const unsubPkg = onSnapshot(qPkg, (snap) => {
      setFeaturedPackages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TreePackage)));
    }, (error) => {
      console.error("Overview Packages onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'packages');
    });

    // Fetch global stats if admin
    let unsubStats = () => {};
    if (profile?.role === 'admin') {
      unsubStats = onSnapshot(doc(db, 'stats', 'global'), (doc) => {
        setGlobalStats(doc.data());
      }, (error) => {
        console.error("Overview Stats onSnapshot error:", error);
        handleFirestoreError(error, OperationType.GET, 'stats/global');
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
      {/* Celebration Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border-4 border-red-600 p-8 rounded-[2.5rem] text-center shadow-2xl shadow-red-100 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
        <h2 className="text-2xl md:text-3xl font-black text-red-600 mb-2 tracking-tight">
          We are celebrating two years of success in planting real trees
        </h2>
        <p className="text-red-500 text-xl font-extrabold">
          Giving 250Rs Signup bonus as a free package For new Users
        </p>
      </motion.div>

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
                      <div className={`text-[10px] font-bold uppercase ${
                        activity.status === 'rejected' ? 'text-red-600' : 
                        activity.status === 'pending' ? 'text-orange-600' : 
                        'text-green-600'
                      }`}>{activity.status}</div>
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
    }, (error) => {
      console.error("MyInvestments onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'investments');
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
  const [showClaimSuccess, setShowClaimSuccess] = useState<{ amount: number; packageName: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

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
        userEmail: profile?.email || user?.email,
        userName: profile?.displayName || user?.displayName || 'Anonymous',
        amount: earned,
        type: 'return',
        description: `Returns from ${inv.packageName}`,
        date: new Date().toISOString(),
        status: 'success'
      });

      // Update global stats
      await updateDoc(doc(db, 'stats', 'global'), {
        returnsPaid: increment(earned)
      });

      console.log('Claim successful!');
      setShowClaimSuccess({ amount: earned, packageName: inv.packageName });
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

  const filteredInvestments = investments.filter(inv => inv.status === activeTab);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">My Investments</h2>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'active' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Active
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'completed' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Completed
          </button>
        </div>
      </div>
      
      {filteredInvestments.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center">
          <div className="bg-green-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <TreePine className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No {activeTab} investments</h3>
          <p className="text-slate-500 mb-8">
            {activeTab === 'active' 
              ? "Start your journey by choosing a tree package." 
              : "Your completed investments will appear here."}
          </p>
          {activeTab === 'active' && (
            <Link to="/dashboard/packages" className="inline-flex px-8 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-200">
              Browse Packages
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInvestments.map((inv) => (
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
                  <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Expected Return</div>
                  <div className="text-lg font-bold text-green-700">₹{inv.expectedReturn.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Earned So Far</div>
                  <div className="text-lg font-bold text-blue-700">₹{calculateEarned(inv).toFixed(2)}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Daily Return</div>
                  <div className="text-lg font-bold text-orange-700">₹{inv.dailyReturn.toFixed(2)}</div>
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
      <AnimatePresence>
        {showClaimSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-green-600"></div>
              <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Claim Successful!</h3>
              <p className="text-slate-500 mb-6">You've successfully claimed your returns from {showClaimSuccess.packageName}.</p>
              
              <div className="bg-green-50 p-6 rounded-3xl mb-8">
                <div className="text-[10px] text-green-400 font-black uppercase mb-1">Amount Claimed</div>
                <div className="text-3xl font-black text-green-600">₹{showClaimSuccess.amount.toFixed(2)}</div>
              </div>

              <button 
                onClick={() => setShowClaimSuccess(null)}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Packages = () => {
  const { profile } = useAuth();
  const [packages, setPackages] = useState<TreePackage[]>([]);
  const [userInvestments, setUserInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<{ packageName: string; amount: number } | null>(null);

  useEffect(() => {
    const q = collection(db, 'packages');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TreePackage));
      setPackages(data);
    }, (error) => {
      console.error("Packages onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'packages');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'investments'), where('userId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserInvestments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment)));
      setLoading(false);
    }, (error) => {
      console.error("UserInvestments onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'investments');
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
      
      // If this is the user's first investment, award a spin to the referrer
      if (profile.totalInvested === 0 && profile.referredBy) {
        const refQuery = query(
          collection(db, 'referrals'), 
          where('referredId', '==', profile.uid)
        );
        const refSnap = await getDocs(refQuery);
        
        if (refSnap.empty) {
          await addDoc(collection(db, 'referrals'), {
            referrerId: profile.referredBy,
            referredId: profile.uid,
            referredEmail: profile.email,
            referredName: profile.displayName,
            investmentAmount: pkg.investmentAmount,
            spinsEarned: 1,
            spinsUsed: 0,
            createdAt: new Date().toISOString()
          });
        }
      }

      // Update user profile
      await updateDoc(doc(db, 'users', profile.uid), {
        balance: increment(-pkg.investmentAmount),
        totalInvested: increment(pkg.investmentAmount)
      });

      // Update global stats
      const statsUpdate: any = {
        treesPlanted: increment(1),
        totalInvested: increment(pkg.investmentAmount)
      };

      // If this is the user's first investment, increment active investors
      if (profile.totalInvested === 0) {
        statsUpdate.activeInvestors = increment(1);
      }

      await updateDoc(doc(db, 'stats', 'global'), statsUpdate);

      setShowSuccessModal({ packageName: pkg.name, amount: pkg.investmentAmount });
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
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-green-600"></div>
              <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <TreePine className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Investment Successful!</h3>
              <p className="text-slate-500 mb-6">You've successfully invested in the {showSuccessModal.packageName} package.</p>
              
              <div className="bg-green-50 p-6 rounded-3xl mb-8">
                <div className="text-[10px] text-green-400 font-black uppercase mb-1">Amount Invested</div>
                <div className="text-3xl font-black text-green-600">₹{showSuccessModal.amount.toLocaleString()}</div>
              </div>

              <button 
                onClick={() => setShowSuccessModal(null)}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200"
              >
                Start Growing!
              </button>
            </motion.div>
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
                  <div className="text-green-700 font-bold text-sm">Return: ₹{pkg.totalReturn} (Principal inc.)</div>
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
    }, (error) => {
      console.error("AdminUsers onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'users');
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

const ReferralSection = () => {
  const { profile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'referrals'), where('referrerId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setReferrals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral)));
      setLoading(false);
    }, (error) => {
      console.error("Referrals onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'referrals');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile]);

  const totalSpins = referrals.reduce((acc, ref) => acc + (ref.spinsEarned - ref.spinsUsed), 0);
  const referralLink = `${window.location.origin}/signup?ref=${profile?.uid}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpin = async () => {
    if (totalSpins <= 0 || spinning) return;

    setSpinning(true);
    setShowSpinModal(true);

    // Simulate spin animation
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Random reward: 0 or random 5 Rs up to 150
    const rewards = [0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150];
    const result = rewards[Math.floor(Math.random() * rewards.length)];
    
    setSpinResult(result);

    try {
      // Find the first referral with an unused spin
      const referralToUpdate = referrals.find(ref => ref.spinsEarned > ref.spinsUsed);
      if (referralToUpdate) {
        await updateDoc(doc(db, 'referrals', referralToUpdate.id), {
          spinsUsed: increment(1)
        });

        if (result > 0) {
          await updateDoc(doc(db, 'users', profile!.uid), {
            balance: increment(result)
          });

          await addDoc(collection(db, 'transactions'), {
            userId: profile!.uid,
            userEmail: profile?.email || user?.email,
            userName: profile?.displayName || user?.displayName || 'Anonymous',
            amount: result,
            type: 'return',
            description: 'Lucky Spin Reward',
            date: new Date().toISOString(),
            status: 'success'
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSpinning(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-red-50 rounded-2xl">
            <Gift className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Refer & Earn</h2>
            <p className="text-slate-500">Refer a friend to get a chance to lucky spin</p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Your Referral Link</label>
          <div className="flex items-center space-x-4">
            <div className="flex-grow bg-white px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm text-slate-600 truncate">
              {referralLink}
            </div>
            <button 
              onClick={copyToClipboard}
              className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center space-x-2"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              <span className="font-bold text-sm">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
              <Sparkles className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-900 mb-2">Lucky Spin</h3>
            <p className="text-red-600/70 text-sm mb-6">You have {totalSpins} spins available</p>
            <button 
              onClick={handleSpin}
              disabled={totalSpins <= 0 || spinning}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
                totalSpins > 0 
                  ? 'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] active:scale-95' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {spinning ? 'Spinning...' : 'Spin Now'}
            </button>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Referral History</h3>
            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
              {referrals.length === 0 ? (
                <p className="text-slate-400 italic text-sm">No referrals yet. Start sharing!</p>
              ) : (
                referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{ref.referredName}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Invested: ₹{ref.investmentAmount.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${ref.spinsUsed >= ref.spinsEarned ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-600'}`}>
                        {ref.spinsUsed >= ref.spinsEarned ? 'Spin Used' : 'Spin Ready'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSpinModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
              
              {spinning ? (
                <div className="py-10">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                    className="w-32 h-32 border-8 border-red-100 border-t-red-600 rounded-full mx-auto mb-8"
                  />
                  <h3 className="text-2xl font-black text-slate-900 animate-pulse">Spinning...</h3>
                  <p className="text-slate-500 mt-2">Good luck! You could win up to ₹150</p>
                </div>
              ) : (
                <div className="py-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Sparkles className="h-12 w-12 text-green-600" />
                  </motion.div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2">
                    {spinResult === 0 ? 'Better luck next time!' : 'Congratulations!'}
                  </h3>
                  <div className="text-5xl font-black text-red-600 mb-6">
                    ₹{spinResult}
                  </div>
                  <p className="text-slate-500 mb-8">
                    {spinResult === 0 
                      ? 'Don\'t worry, refer more friends for more chances!' 
                      : 'The reward has been added to your wallet balance.'}
                  </p>
                  <button 
                    onClick={() => setShowSpinModal(false)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EarnMoreSection = ({ setShowDeposit, setDepositAmount, setIsTicketDeposit }: { setShowDeposit: any, setDepositAmount: any, setIsTicketDeposit: any }) => {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [globalStats, setGlobalStats] = useState<ImpactStats | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState<string | null>(null);
  const [showTicketResultModal, setShowTicketResultModal] = useState(false);

  useEffect(() => {
    const handleTicketPurchased = (e: any) => {
      const { ticketNumber } = e.detail;
      setNewTicket(ticketNumber);
      setShowTicketResultModal(true);
    };
    window.addEventListener('ticket-purchased', handleTicketPurchased);
    return () => window.removeEventListener('ticket-purchased', handleTicketPurchased);
  }, []);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'tickets'), where('userId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      // Sort in memory to avoid index requirements
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTickets(data);
    }, (error) => {
      console.error("Tickets onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'tickets');
    });

    const unsubStats = onSnapshot(doc(db, 'stats', 'global'), (doc) => {
      if (doc.exists()) setGlobalStats(doc.data() as ImpactStats);
    }, (error) => {
      console.error("Stats onSnapshot error:", error);
      handleFirestoreError(error, OperationType.GET, 'stats/global');
    });

    return () => {
      unsubscribe();
      unsubStats();
    };
  }, [profile]);

  const handleBuyTicket = async () => {
    if (!profile || isBuying) return;

    if (profile.balance < 100) {
      setDepositAmount('100');
      setIsTicketDeposit(true);
      setShowDeposit(true);
      return;
    }

    setIsBuying(true);
    try {
      let ticketNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
      
      // Ensure it doesn't match today's winning ticket
      if (globalStats?.todayWinningTicket && ticketNumber === globalStats.todayWinningTicket) {
        ticketNumber = (Number(ticketNumber) + 1).toString().padStart(7, '0');
      }
      
      await addDoc(collection(db, 'tickets'), {
        userId: profile.uid,
        ticketNumber,
        amount: 100,
        date: new Date().toISOString()
      });

      await updateDoc(doc(db, 'users', profile.uid), {
        balance: increment(-100)
      });

      await addDoc(collection(db, 'transactions'), {
        userId: profile.uid,
        userEmail: profile.email,
        userName: profile.displayName,
        amount: 100,
        type: 'investment',
        description: 'Lottery Ticket Purchase',
        date: new Date().toISOString(),
        status: 'success'
      });

      setNewTicket(ticketNumber);
      setShowTicketResultModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to buy ticket. Please try again.");
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-4 bg-blue-600 text-white rounded-2xl font-black text-xl animate-pulse">
        COMING SOON
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scratch and Win */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-4 right-4 px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-black rounded-full uppercase">Coming Soon</div>
          <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Sparkles className="h-10 w-10 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Scratch & Win</h3>
          <p className="text-slate-500 text-sm mb-6">Scratch digital cards to win instant cash prizes!</p>
          <button disabled className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl font-bold cursor-not-allowed">Locked</button>
        </div>

        {/* Merge Plants */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-4 right-4 px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-black rounded-full uppercase">Coming Soon</div>
          <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Leaf className="h-10 w-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Merge & Win</h3>
          <p className="text-slate-500 text-sm mb-6">Merge your plants to create rare species and earn rewards.</p>
          <button disabled className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl font-bold cursor-not-allowed">Locked</button>
        </div>

        {/* Buy a Ticket */}
        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-blue-600 shadow-xl flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase">Active</div>
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Ticket className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Buy a Ticket</h3>
          <p className="text-slate-500 text-sm mb-6">Chance to win a free <span className="font-bold text-orange-600">Mango Plan</span>!</p>
          <div className="w-full p-4 bg-blue-50 rounded-2xl mb-6">
            <div className="text-[10px] text-blue-400 font-black uppercase mb-1">Today's Winning Number</div>
            <div className="text-2xl font-black text-blue-600 tracking-widest font-mono">
              {globalStats?.todayWinningTicket || '-------'}
            </div>
          </div>
          <button 
            onClick={handleBuyTicket}
            disabled={isBuying}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center space-x-2"
          >
            {isBuying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            <span>Buy Ticket (₹100)</span>
          </button>
        </div>
      </div>

      {tickets.length > 0 && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Your Tickets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="text-[10px] text-slate-400 font-black uppercase mb-1">Ticket Number</div>
                <div className="text-lg font-black text-slate-900 font-mono tracking-tighter">{ticket.ticketNumber}</div>
                <div className="text-[10px] text-slate-400 mt-1">{new Date(ticket.date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showTicketResultModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden"
            >
              {newTicket === globalStats?.todayWinningTicket ? (
                <>
                  <div className="absolute top-0 left-0 w-full h-2 bg-green-600"></div>
                  <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Congratulations!</h3>
                  <p className="text-slate-500 mb-6">Your ticket matches today's winning number!</p>
                </>
              ) : (
                <>
                  <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
                  <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Ticket className="h-10 w-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Oops!</h3>
                  <p className="text-slate-500 mb-6">Ticket doesn't match. Try again!</p>
                </>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] text-slate-400 font-black uppercase mb-1">Your Ticket</div>
                  <div className="text-xl font-black text-slate-900 font-mono">{newTicket}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl">
                  <div className="text-[10px] text-blue-400 font-black uppercase mb-1">Today's Winning</div>
                  <div className="text-xl font-black text-blue-600 font-mono">{globalStats?.todayWinningTicket || '-------'}</div>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowTicketResultModal(false);
                    handleBuyTicket();
                  }}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  {newTicket === globalStats?.todayWinningTicket ? 'Buy Another Ticket' : 'Try Again & Buy Ticket'}
                </button>
                <button 
                  onClick={() => setShowTicketResultModal(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTicketModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Ticket className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Ticket Purchased!</h3>
              <p className="text-slate-500 mb-6">Your lucky 7-digit ticket number is:</p>
              <div className="text-4xl font-black text-blue-600 font-mono tracking-widest mb-8 bg-blue-50 py-4 rounded-2xl">
                {newTicket}
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl mb-8 text-left">
                <div className="text-[10px] text-slate-400 font-black uppercase mb-1">Today's Winning Number</div>
                <div className="text-xl font-black text-slate-900 font-mono">{globalStats?.todayWinningTicket || '-------'}</div>
                <p className="text-[10px] text-slate-500 mt-2 italic">* If your ticket matches today's number, you win a free Mango Plan!</p>
              </div>
              <button 
                onClick={() => setShowTicketModal(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                Got it
              </button>
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
