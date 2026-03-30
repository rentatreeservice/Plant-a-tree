import { TreePackage } from '../types';
import { TREE_IMAGES } from '../assets/treeImages';

export const DEFAULT_PACKAGES: TreePackage[] = [
  {
    id: 'free-plant',
    name: "Free Plant",
    tagline: "Start your journey for free - Get free money!",
    investmentAmount: 0,
    durationDays: 125,
    totalReturn: 250,
    dailyReturn: 2,
    badge: "Free for everyone",
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=400",
    description: "Start your journey for free - Get free money!"
  },
  {
    id: 'marigold',
    name: "Marigold",
    tagline: "Entry level plan - Perfect for beginners",
    investmentAmount: 300,
    durationDays: 45,
    totalReturn: 389.7,
    dailyReturn: 8.66,
    badge: "Perfect for beginners",
    imageUrl: TREE_IMAGES.marigold,
    description: "Entry level plan - Perfect for beginners"
  },
  {
    id: 'rose',
    name: "Rose",
    tagline: "Popular choice - Most popular",
    investmentAmount: 500,
    durationDays: 45,
    totalReturn: 769.95,
    dailyReturn: 17.11,
    badge: "Most popular",
    imageUrl: TREE_IMAGES.rose,
    description: "Popular choice - Most popular"
  },
  {
    id: 'tulsi',
    name: "Tulsi",
    tagline: "Value option - Best value",
    investmentAmount: 800,
    durationDays: 60,
    totalReturn: 1399.8,
    dailyReturn: 23.33,
    badge: "Best value",
    imageUrl: TREE_IMAGES.tulsi,
    description: "Value option - Best value"
  },
  {
    id: 'mango',
    name: "Mango",
    tagline: "Premium investment - Premium investor",
    investmentAmount: 1500,
    durationDays: 90,
    totalReturn: 3299.4,
    dailyReturn: 36.66,
    badge: "Premium investor",
    imageUrl: TREE_IMAGES.mango,
    description: "Premium investment - Premium investor"
  }
];
