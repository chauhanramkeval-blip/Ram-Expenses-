import React from "react";
import {
  Coffee,
  ShoppingBag,
  Car,
  Utensils,
  Zap,
  Home,
  Package,
  TrendingUp,
  Activity,
  Tv,
  GraduationCap,
  Gift,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Store,
  Building2,
  PiggyBank,
  PlusCircle,
  Dumbbell,
  Sparkles,
  Plane,
  Heart,
  Stethoscope,
  Bus,
  Bike,
  Smartphone,
  Wrench,
  Shield,
  Film,
  Music,
  Key,
  Landmark,
  DollarSign,
  Wallet,
  Award,
  Baby,
  Dog,
  BookOpen,
  Clock,
  Tag,
  ShoppingCart,
  Fuel,
  Trophy,
  Lightbulb,
  Sun,
  Gem,
  LucideIcon,
} from "lucide-react";
import { CATEGORIES_DATA, INCOME_CATEGORIES_DATA } from "../data/categories";
import { CategoryMeta, ExpenseCategory, IncomeCategory, IncomeCategoryMeta } from "../types";

export const ICONS_MAP: Record<string, LucideIcon> = {
  Coffee,
  ShoppingBag,
  Car,
  Utensils,
  Zap,
  Home,
  Package,
  TrendingUp,
  Activity,
  Tv,
  GraduationCap,
  Gift,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Store,
  Building2,
  PiggyBank,
  PlusCircle,
  Dumbbell,
  Sparkles,
  Plane,
  Heart,
  Stethoscope,
  Bus,
  Bike,
  Smartphone,
  Wrench,
  Shield,
  Film,
  Music,
  Key,
  Landmark,
  DollarSign,
  Wallet,
  Award,
  Baby,
  Dog,
  BookOpen,
  Clock,
  Tag,
  ShoppingCart,
  Fuel,
  Trophy,
  Lightbulb,
  Sun,
  Gem,
};

// Deterministic color generator for any unknown custom category name
const COLOR_PALETTES = [
  { color: "#0F9D58", bgColor: "#E6F4EA", borderColor: "#CEEAD6", icon: "Sparkles" },
  { color: "#1A73E8", bgColor: "#E8F0FE", borderColor: "#D2E3FC", icon: "Tag" },
  { color: "#9333EA", bgColor: "#F3E8FF", borderColor: "#E9D5FF", icon: "Gem" },
  { color: "#DB2777", bgColor: "#FCE7F3", borderColor: "#FBCFE8", icon: "Heart" },
  { color: "#0D9488", bgColor: "#CCFBF1", borderColor: "#99F6E4", icon: "Sparkles" },
  { color: "#EA580C", bgColor: "#FFEDD5", borderColor: "#FED7AA", icon: "Zap" },
  { color: "#4F46E5", bgColor: "#EEF2FF", borderColor: "#E0E7FF", icon: "Award" },
  { color: "#0284C7", bgColor: "#E0F2FE", borderColor: "#BAE6FD", icon: "Lightbulb" },
];

export function resolveExpenseMeta(
  categoryName: string,
  customCategories?: CategoryMeta[]
): CategoryMeta {
  if (customCategories) {
    const found = customCategories.find((c) => c.name === categoryName || c.id === categoryName);
    if (found) return found;
  }
  if (CATEGORIES_DATA[categoryName as keyof typeof CATEGORIES_DATA]) {
    return CATEGORIES_DATA[categoryName as keyof typeof CATEGORIES_DATA];
  }
  // Try reading from localStorage
  try {
    const saved = localStorage.getItem("khata_expense_categories_v2");
    if (saved) {
      const list: CategoryMeta[] = JSON.parse(saved);
      const found = list.find((c) => c.name === categoryName || c.id === categoryName);
      if (found) return found;
    }
  } catch (e) {}

  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = COLOR_PALETTES[Math.abs(hash) % COLOR_PALETTES.length];
  return {
    id: categoryName as any,
    name: categoryName,
    iconName: palette.icon,
    color: palette.color,
    bgColor: palette.bgColor,
    borderColor: palette.borderColor,
    description: "Custom user spend category",
    defaultQuickAmounts: [100, 250, 500, 1000],
    isCustom: true,
  };
}

export function resolveIncomeMeta(
  categoryName: string,
  customCategories?: IncomeCategoryMeta[]
): IncomeCategoryMeta {
  if (customCategories) {
    const found = customCategories.find((c) => c.name === categoryName || c.id === categoryName);
    if (found) return found;
  }
  if (INCOME_CATEGORIES_DATA[categoryName as keyof typeof INCOME_CATEGORIES_DATA]) {
    return INCOME_CATEGORIES_DATA[categoryName as keyof typeof INCOME_CATEGORIES_DATA];
  }
  // Try reading from localStorage
  try {
    const saved = localStorage.getItem("khata_income_categories_v2");
    if (saved) {
      const list: IncomeCategoryMeta[] = JSON.parse(saved);
      const found = list.find((c) => c.name === categoryName || c.id === categoryName);
      if (found) return found;
    }
  } catch (e) {}

  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = COLOR_PALETTES[Math.abs(hash) % COLOR_PALETTES.length];
  return {
    id: categoryName as any,
    name: categoryName,
    iconName: palette.icon,
    streamType: categoryName.toLowerCase().includes("salary") || categoryName.toLowerCase().includes("bonus") ? "salary_bonus" : "extra_income",
    color: palette.color,
    bgColor: palette.bgColor,
    borderColor: palette.borderColor,
    description: "Custom user income category",
    defaultQuickAmounts: [5000, 15000, 30000, 50000],
    isCustom: true,
  };
}

interface CategoryIconProps {
  category: ExpenseCategory;
  customCategories?: CategoryMeta[];
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  customCategories,
  size = 18,
  className = "",
}) => {
  const meta = resolveExpenseMeta(category, customCategories);
  const IconComponent = ICONS_MAP[meta.iconName] || MoreHorizontal;

  return <IconComponent size={size} className={className} style={{ color: meta.color }} />;
};

export const CategoryBadge: React.FC<{
  category: ExpenseCategory;
  customCategories?: CategoryMeta[];
  showText?: boolean;
}> = ({ category, customCategories, showText = true }) => {
  const meta = resolveExpenseMeta(category, customCategories);
  const IconComponent = ICONS_MAP[meta.iconName] || MoreHorizontal;

  return (
    <span
      id={`cat-badge-${category.replace(/\s+/g, "-").toLowerCase()}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: meta.bgColor,
        borderColor: meta.borderColor,
        color: meta.color,
      }}
    >
      <IconComponent size={14} style={{ color: meta.color }} />
      {showText && <span>{meta.name || category}</span>}
    </span>
  );
};

export const IncomeIcon: React.FC<{
  category: IncomeCategory;
  customCategories?: IncomeCategoryMeta[];
  size?: number;
  className?: string;
}> = ({ category, customCategories, size = 18, className = "" }) => {
  const meta = resolveIncomeMeta(category, customCategories);
  const IconComponent = ICONS_MAP[meta.iconName] || Briefcase;

  return <IconComponent size={size} className={className} style={{ color: meta.color }} />;
};

export const IncomeBadge: React.FC<{
  category: IncomeCategory;
  customCategories?: IncomeCategoryMeta[];
  showText?: boolean;
}> = ({ category, customCategories, showText = true }) => {
  const meta = resolveIncomeMeta(category, customCategories);
  const IconComponent = ICONS_MAP[meta.iconName] || Briefcase;

  return (
    <span
      id={`inc-badge-${category.replace(/\s+/g, "-").toLowerCase()}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: meta.bgColor,
        borderColor: meta.borderColor,
        color: meta.color,
      }}
    >
      <IconComponent size={14} style={{ color: meta.color }} />
      {showText && <span>{meta.name || category}</span>}
    </span>
  );
};

