import { CategoryMeta, ExpenseCategory, IncomeCategory, IncomeCategoryMeta } from "../types";

export const CATEGORIES_DATA: Record<ExpenseCategory, CategoryMeta> = {
  "Chai & Street Food": {
    id: "Chai & Street Food",
    name: "Chai & Street Food",
    iconName: "Coffee",
    color: "#D97706", // warm amber
    bgColor: "#FEF3C7",
    borderColor: "#FDE68A",
    description: "Tapri Chai, Samosa, Maggie, Evening Snacks",
    defaultQuickAmounts: [20, 50, 100, 150],
  },
  "Kirana & Groceries": {
    id: "Kirana & Groceries",
    name: "Kirana & Groceries",
    iconName: "ShoppingBag",
    color: "#16A34A", // fresh green
    bgColor: "#DCFCE7",
    borderColor: "#BBF7D0",
    description: "Blinkit, Zepto, DMart, Local Mandi & Ration",
    defaultQuickAmounts: [200, 500, 1000, 2500],
  },
  "Commute & Auto/Metro": {
    id: "Commute & Auto/Metro",
    name: "Commute & Auto/Metro",
    iconName: "Car",
    color: "#2563EB", // Google Blue
    bgColor: "#DBEAFE",
    borderColor: "#BFDBFE",
    description: "Auto, Metro smart card, Ola/Uber, Rapido, Petrol",
    defaultQuickAmounts: [50, 100, 200, 500],
  },
  "Food Delivery & Dining": {
    id: "Food Delivery & Dining",
    name: "Food Delivery & Dining",
    iconName: "Utensils",
    color: "#EA580C", // Swiggy/Zomato orange
    bgColor: "#FFEDD5",
    borderColor: "#FED7AA",
    description: "Swiggy, Zomato, Restaurants, Dhabas & Weekend Dinners",
    defaultQuickAmounts: [250, 450, 800, 1500],
  },
  "Bills & Mobile Recharge": {
    id: "Bills & Mobile Recharge",
    name: "Bills & Mobile Recharge",
    iconName: "Zap",
    color: "#CA8A04", // Yellow/Gold
    bgColor: "#FEF9C3",
    borderColor: "#FEF08A",
    description: "Electricity, Jio/Airtel recharge, Wifi, Gas cylinder",
    defaultQuickAmounts: [299, 699, 1200, 2500],
  },
  "Rent & Home Maintenance": {
    id: "Rent & Home Maintenance",
    name: "Rent & Home Maintenance",
    iconName: "Home",
    color: "#7C3AED", // Purple
    bgColor: "#EDE9FE",
    borderColor: "#DDD6FE",
    description: "PG Rent, Flat Rent, Maid/Cook, Maintenance",
    defaultQuickAmounts: [5000, 10000, 15000, 25000],
  },
  "Shopping & E-commerce": {
    id: "Shopping & E-commerce",
    name: "Shopping & E-commerce",
    iconName: "Package",
    color: "#DB2777", // Pink/Rose
    bgColor: "#FCE7F3",
    borderColor: "#FBCFE8",
    description: "Amazon, Myntra, Flipkart, Local Market Clothes",
    defaultQuickAmounts: [500, 1000, 2000, 5000],
  },
  "Investments & SIP": {
    id: "Investments & SIP",
    name: "Investments & SIP",
    iconName: "TrendingUp",
    color: "#059669", // Emerald
    bgColor: "#D1FAE5",
    borderColor: "#A7F3D0",
    description: "Mutual Funds, Nifty Index SIP, PPF, Digital Gold, FD",
    defaultQuickAmounts: [1000, 2500, 5000, 10000],
  },
  "Healthcare & Medicine": {
    id: "Healthcare & Medicine",
    name: "Healthcare & Medicine",
    iconName: "Activity",
    color: "#E11D48", // Crimson Red
    bgColor: "#FFE4E6",
    borderColor: "#FECDD3",
    description: "Pharmacy, Apollo, 1mg, Doctor Consultation, Lab tests",
    defaultQuickAmounts: [150, 500, 1200, 3000],
  },
  "Entertainment & OTT": {
    id: "Entertainment & OTT",
    name: "Entertainment & OTT",
    iconName: "Tv",
    color: "#4F46E5", // Indigo
    bgColor: "#E0E7FF",
    borderColor: "#C7D2FE",
    description: "Hotstar, Netflix, Prime, Movie Tickets, Gaming",
    defaultQuickAmounts: [149, 499, 800, 1500],
  },
  "Education & Learning": {
    id: "Education & Learning",
    name: "Education & Learning",
    iconName: "GraduationCap",
    color: "#0284C7", // Sky Blue
    bgColor: "#E0F2FE",
    borderColor: "#BAE6FD",
    description: "Courses, Books, Certification, Stationery, School Fees",
    defaultQuickAmounts: [300, 1000, 2500, 8000],
  },
  "Family, Gifts & Puja": {
    id: "Family, Gifts & Puja",
    name: "Family, Gifts & Puja",
    iconName: "Gift",
    color: "#9333EA", // Violet
    bgColor: "#F3E8FF",
    borderColor: "#E9D5FF",
    description: "Festival Gifts, Shagun, Family remittances, Puja items",
    defaultQuickAmounts: [500, 1100, 2100, 5100],
  },
  "Other Spends": {
    id: "Other Spends",
    name: "Other Spends",
    iconName: "MoreHorizontal",
    color: "#64748B", // Slate
    bgColor: "#F1F5F9",
    borderColor: "#E2E8F0",
    description: "Miscellaneous personal expenses",
    defaultQuickAmounts: [100, 250, 500, 1000],
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES_DATA);

export const INCOME_CATEGORIES_DATA: Record<IncomeCategory, IncomeCategoryMeta> = {
  "Salary & Bonus": {
    id: "Salary & Bonus",
    name: "Salary & Bonus",
    iconName: "Briefcase",
    streamType: "salary_bonus",
    color: "#0F9D58", // Google Emerald Green
    bgColor: "#E6F4EA",
    borderColor: "#CEEAD6",
    description: "Monthly In-hand Salary, Corporate Bonus, Incentive, Appraisal",
    defaultQuickAmounts: [25000, 50000, 75000, 100000],
  },
  "Freelance & Consulting": {
    id: "Freelance & Consulting",
    name: "Freelance & Consulting",
    iconName: "Laptop",
    streamType: "extra_income",
    color: "#1A73E8", // Google Blue
    bgColor: "#E8F0FE",
    borderColor: "#D2E3FC",
    description: "Client Projects, Coding, Design, Content, Advisory gigs",
    defaultQuickAmounts: [5000, 15000, 30000, 60000],
  },
  "Business & Trading": {
    id: "Business & Trading",
    name: "Business & Trading",
    iconName: "Store",
    streamType: "extra_income",
    color: "#9333EA", // Purple
    bgColor: "#F3E8FF",
    borderColor: "#E9D5FF",
    description: "Shop sales, E-commerce, Trading profits, Business invoices",
    defaultQuickAmounts: [10000, 25000, 50000, 150000],
  },
  "Investments & Dividends": {
    id: "Investments & Dividends",
    name: "Investments & Dividends",
    iconName: "TrendingUp",
    streamType: "extra_income",
    color: "#137333", // Deep Green
    bgColor: "#CEEAD6",
    borderColor: "#A8DAB5",
    description: "Stock Dividends, Mutual Fund payouts, Capital Gains, Gold sales",
    defaultQuickAmounts: [1000, 3000, 8000, 20000],
  },
  "Rental & Property": {
    id: "Rental & Property",
    name: "Rental & Property",
    iconName: "Building2",
    streamType: "extra_income",
    color: "#CA8A04", // Amber/Gold
    bgColor: "#FEF9C3",
    borderColor: "#FEF08A",
    description: "Flat/House rent collected, Commercial leasing, Airbnb",
    defaultQuickAmounts: [12000, 22000, 35000, 60000],
  },
  "Gifts & Cashback": {
    id: "Gifts & Cashback",
    name: "Gifts & Cashback",
    iconName: "Gift",
    streamType: "extra_income",
    color: "#DB2777", // Rose
    bgColor: "#FCE7F3",
    borderColor: "#FBCFE8",
    description: "GPay Scratch Card, Credit Card Cashback, Shagun & Festival Gifts",
    defaultQuickAmounts: [100, 500, 1100, 5000],
  },
  "Interest & FD": {
    id: "Interest & FD",
    name: "Interest & FD",
    iconName: "PiggyBank",
    streamType: "extra_income",
    color: "#0284C7", // Sky Blue
    bgColor: "#E0F2FE",
    borderColor: "#BAE6FD",
    description: "Bank Savings Account Interest, Fixed Deposit maturity, PPF Interest",
    defaultQuickAmounts: [500, 2000, 6000, 15000],
  },
  "Other Income": {
    id: "Other Income",
    name: "Other Income",
    iconName: "PlusCircle",
    streamType: "extra_income",
    color: "#5F6368", // Slate/Grey
    bgColor: "#F1F3F4",
    borderColor: "#DADCE0",
    description: "Reimbursements, Tax Refunds, Miscellaneous Inflow",
    defaultQuickAmounts: [1000, 3000, 5000, 10000],
  },
};

export const INCOME_CATEGORY_LIST = Object.values(INCOME_CATEGORIES_DATA);

// Color Palette Presets for Custom Category Creation
export const CATEGORY_COLOR_PRESETS = [
  { name: "Emerald Green", color: "#0F9D58", bgColor: "#E6F4EA", borderColor: "#CEEAD6" },
  { name: "Google Blue", color: "#1A73E8", bgColor: "#E8F0FE", borderColor: "#D2E3FC" },
  { name: "Amber Yellow", color: "#F9AB00", bgColor: "#FEF7E0", borderColor: "#FEEFC3" },
  { name: "Red Rose", color: "#EA4335", bgColor: "#FCE8E6", borderColor: "#FAD2CF" },
  { name: "Royal Purple", color: "#9333EA", bgColor: "#F3E8FF", borderColor: "#E9D5FF" },
  { name: "Deep Pink", color: "#DB2777", bgColor: "#FCE7F3", borderColor: "#FBCFE8" },
  { name: "Cyan Teal", color: "#0D9488", bgColor: "#CCFBF1", borderColor: "#99F6E4" },
  { name: "Sky Blue", color: "#0284C7", bgColor: "#E0F2FE", borderColor: "#BAE6FD" },
  { name: "Orange Saffron", color: "#EA580C", bgColor: "#FFEDD5", borderColor: "#FED7AA" },
  { name: "Indigo", color: "#4F46E5", bgColor: "#EEF2FF", borderColor: "#E0E7FF" },
  { name: "Slate Grey", color: "#64748B", bgColor: "#F1F5F9", borderColor: "#E2E8F0" },
];

export const AVAILABLE_CATEGORY_ICONS = [
  "Coffee",
  "ShoppingBag",
  "Car",
  "Utensils",
  "Zap",
  "Home",
  "Package",
  "TrendingUp",
  "Activity",
  "Tv",
  "GraduationCap",
  "Gift",
  "MoreHorizontal",
  "Briefcase",
  "Laptop",
  "Store",
  "Building2",
  "PiggyBank",
  "PlusCircle",
  "Dumbbell",
  "Sparkles",
  "Plane",
  "Heart",
  "Stethoscope",
  "Bus",
  "Bike",
  "Smartphone",
  "Wrench",
  "Shield",
  "Film",
  "Music",
  "Key",
  "Landmark",
  "DollarSign",
  "Wallet",
  "Award",
  "Baby",
  "Dog",
  "BookOpen",
  "Clock",
  "Tag",
  "ShoppingCart",
  "Fuel",
  "Trophy",
  "Lightbulb",
  "Sun",
  "Gem",
];

