import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';
// import axios from 'axios';
// import crypto from 'crypto';

dotenv.config();
// ... (rest of the imports and setup)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
const db = admin.firestore();

async function startServer() {
  const app = express();
  const DB_PATH = path.join(__dirname, 'db.json');
  const SECRET_KEY = process.env.JWT_SECRET || 'treeplant-secret-key';
  const PORT = 3000;

// ================== DB HELPERS ==================
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { users: [], transactions: [], rentals: [], messages: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
}

// ================== MIDDLEWARE ==================

app.use(cors());
app.use(express.json());

// ================== PAYMENT ROUTES ==================
// (Removed Instamojo integration)

// Logging
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Admin Middleware
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// ================== TREE PLANS ==================

const TREE_PLANS = [
  { id: 'marigold', name: 'Marigold', price: 500, dailyReturn: 25, durationDays: 40 },
  { id: 'rose', name: 'Rose', price: 1500, dailyReturn: 80, durationDays: 40 },
  { id: 'tulsi', name: 'Tulsi', price: 3000, dailyReturn: 170, durationDays: 40 },
  { id: 'mango', name: 'Mango', price: 5000, dailyReturn: 300, durationDays: 40 }
];

// ================== AUTH ROUTES ==================

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

  const db = readDB();
  const user = db.users.find(u => u.username === username || u.email === username);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, referralCode: user.referralCode }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password, referralCode } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: 'All fields required' });

  const db = readDB();
  if (db.users.find(u => u.username === username || u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const newUser = {
    id: Date.now().toString(),
    username,
    email,
    password,
    balance: 0,
    totalInvestment: 0,
    totalReturns: 0,
    referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    referredBy: referralCode || null,
    role: 'user',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDB(db);

  const token = generateToken(newUser);
  res.json({ token, user: newUser });
});

// ================== USER ROUTES ==================

app.get('/api/user/dashboard', authenticateToken, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const rentals = db.rentals.filter(r => r.userId === user.id);
  const transactions = db.transactions.filter(t => t.userId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const referralCount = db.users.filter(u => u.referredBy === user.referralCode).length;

  res.json({ user, rentals, transactions, referralCount });
});

app.get('/api/trees', (req, res) => {
  res.json(TREE_PLANS);
});

app.post('/api/rent', authenticateToken, (req, res) => {
  const { treeId } = req.body;
  const plan = TREE_PLANS.find(p => p.id === treeId);
  if (!plan) return res.status(400).json({ message: 'Invalid tree plan' });

  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (user.balance < plan.price) return res.status(400).json({ message: 'Insufficient balance' });

  user.balance -= plan.price;
  user.totalInvestment += plan.price;

  const rental = {
    id: Date.now().toString(),
    userId: user.id,
    planId: plan.id,
    planName: plan.name,
    amount: plan.price,
    dailyReturn: plan.dailyReturn,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active'
  };

  const transaction = {
    id: 'tx_' + Date.now(),
    userId: user.id,
    type: 'investment',
    amount: plan.price,
    description: `Rented ${plan.name} tree`,
    date: new Date().toISOString()
  };

  db.rentals.push(rental);
  db.transactions.push(transaction);
  writeDB(db);

  res.json({ message: 'Tree rented successfully', rental });
});

app.post('/api/user/withdraw', authenticateToken, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 150) return res.status(400).json({ message: 'Minimum withdrawal ₹150' });

  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (user.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

  user.balance -= amount;

  const transaction = {
    id: 'tx_' + Date.now(),
    userId: user.id,
    type: 'withdrawal',
    amount: amount,
    description: 'Withdrawal request',
    date: new Date().toISOString()
  };

  db.transactions.push(transaction);
  writeDB(db);

  res.json({ message: 'Withdrawal request submitted' });
});

// ================== ADMIN ROUTES ==================

app.get('/api/admin/stats', authenticateToken, isAdmin, (req, res) => {
  const db = readDB();
  const totalUsers = db.users.length;
  const totalRentals = db.rentals.length;
  const totalInvestment = db.users.reduce((sum, u) => sum + (u.totalInvestment || 0), 0);
  const totalBalance = db.users.reduce((sum, u) => sum + (u.balance || 0), 0);

  res.json({ totalUsers, totalRentals, totalInvestment, totalBalance });
});

app.get('/api/admin/users', authenticateToken, isAdmin, (req, res) => {
  const db = readDB();
  res.json(db.users);
});

app.get('/api/admin/transactions', authenticateToken, isAdmin, (req, res) => {
  const db = readDB();
  res.json(db.transactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

app.get('/api/admin/rentals', authenticateToken, isAdmin, (req, res) => {
  const db = readDB();
  res.json(db.rentals.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
});

app.post('/api/admin/update-user', authenticateToken, isAdmin, (req, res) => {
  const { userId, balance, role } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (balance !== undefined) user.balance = parseFloat(balance);
  if (role !== undefined) user.role = role;

  writeDB(db);
  res.json({ message: 'User updated successfully', user });
});

// ================== FALLBACK ==================

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

startServer();
