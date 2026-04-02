export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  balance: number;
  totalInvested: number;
  totalReturns: number;
  referredBy?: string | null;
  createdAt: string;
  bankDetails?: {
    fullName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId?: string;
  };
}

export interface TreePackage {
  id: string;
  name: string;
  description: string;
  investmentAmount: number;
  durationDays: number;
  totalReturn: number;
  dailyReturn: number;
  imageUrl: string;
  badge?: string;
  tagline: string;
}

export interface Investment {
  id: string;
  userId: string;
  packageId: string;
  packageName: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
  expectedReturn: number;
  dailyReturn: number;
  lastClaimDate?: string;
  claimedAmount?: number;
}

export interface ImpactStats {
  treesPlanted: number;
  activeInvestors: number;
  totalInvested: number;
  returnsPaid: number;
  todayWinningTicket?: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referredEmail: string;
  referredName: string;
  investmentAmount: number;
  spinsEarned: number;
  spinsUsed: number;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  ticketNumber: string;
  amount: number;
  date: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  bankDetails: {
    fullName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
