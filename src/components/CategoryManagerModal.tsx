import React, { useState } from "react";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Check,
  RotateCcw,
  Search,
  Tag,
  Briefcase,
  TrendingUp,
  HelpCircle,
  LucideIcon,
} from "lucide-react";
import { CategoryMeta, IncomeCategoryMeta, IncomeStreamType } from "../types";
import {
  CATEGORIES_DATA,
  INCOME_CATEGORIES_DATA,
  CATEGORY_COLOR_PRESETS,
  AVAILABLE_CATEGORY_ICONS,
} from "../data/categories";
import { ICONS_MAP, CategoryBadge, IncomeBadge } from "./CategoryIcon";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseCategories: CategoryMeta[];
  incomeCategories: IncomeCategoryMeta[];
  onSaveExpenseCategories: (categories: CategoryMeta[]) => void;
  onSaveIncomeCategories: (categories: IncomeCategoryMeta[]) => void;
  onResetDefaultCategories: () => void;
  initialTab?: "expense" | "income";
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  expenseCategories,
  incomeCategories,
  onSaveExpenseCategories,
  onSaveIncomeCategories,
  onResetDefaultCategories,
  initialTab = "expense",
}) => {
  const [activeTab, setActiveTab] = useState<"expense" | "income">(initialTab);
  const [streamFilter, setStreamFilter] = useState<"ALL" | "salary_bonus" | "extra_income">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null); // null if creating new
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("Tag");
  const [formColorIndex, setFormColorIndex] = useState(0);
  const [formStreamType, setFormStreamType] = useState<IncomeStreamType>("extra_income");
  const [formDescription, setFormDescription] = useState("");
  const [formQuickAmounts, setFormQuickAmounts] = useState("100, 250, 500, 1000");

  if (!isOpen) return null;

  const currentPreset = CATEGORY_COLOR_PRESETS[formColorIndex] || CATEGORY_COLOR_PRESETS[0];

  const handleOpenAdd = () => {
    setIsEditing(true);
    setEditingTargetId(null);
    setFormName("");
    setFormIcon(activeTab === "expense" ? "Tag" : "Briefcase");
    setFormColorIndex(0);
    setFormStreamType("extra_income");
    setFormDescription("");
    setFormQuickAmounts(activeTab === "expense" ? "100, 250, 500, 1000" : "5000, 15000, 30000, 50000");
  };

  const handleOpenEdit = (item: CategoryMeta | IncomeCategoryMeta) => {
    setIsEditing(true);
    setEditingTargetId(item.id);
    setFormName(item.name);
    setFormIcon(item.iconName || "Tag");
    
    // Find matching color index
    const colIdx = CATEGORY_COLOR_PRESETS.findIndex((p) => p.color.toLowerCase() === item.color.toLowerCase());
    setFormColorIndex(colIdx >= 0 ? colIdx : 0);

    if ("streamType" in item) {
      setFormStreamType(item.streamType);
    }
    setFormDescription(item.description || "");
    setFormQuickAmounts(item.defaultQuickAmounts?.join(", ") || "100, 500, 1000");
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedAmounts = formQuickAmounts
      .split(",")
      .map((a) => parseInt(a.trim(), 10))
      .filter((a) => !isNaN(a) && a > 0);
    
    const finalAmounts = parsedAmounts.length > 0 ? parsedAmounts : [100, 500, 1000, 2000];

    if (activeTab === "expense") {
      if (editingTargetId) {
        // Update existing
        const updated = expenseCategories.map((c) => {
          if (c.id === editingTargetId) {
            return {
              ...c,
              name: formName.trim(),
              iconName: formIcon,
              color: currentPreset.color,
              bgColor: currentPreset.bgColor,
              borderColor: currentPreset.borderColor,
              description: formDescription.trim() || `${formName.trim()} spend tracking`,
              defaultQuickAmounts: finalAmounts,
              isCustom: true,
            };
          }
          return c;
        });
        onSaveExpenseCategories(updated);
      } else {
        // Create new
        const newCategory: CategoryMeta = {
          id: formName.trim() as any,
          name: formName.trim(),
          iconName: formIcon,
          color: currentPreset.color,
          bgColor: currentPreset.bgColor,
          borderColor: currentPreset.borderColor,
          description: formDescription.trim() || `${formName.trim()} personal spend`,
          defaultQuickAmounts: finalAmounts,
          isCustom: true,
        };
        onSaveExpenseCategories([...expenseCategories, newCategory]);
      }
    } else {
      // Income
      if (editingTargetId) {
        const updated = incomeCategories.map((c) => {
          if (c.id === editingTargetId) {
            return {
              ...c,
              name: formName.trim(),
              iconName: formIcon,
              streamType: formStreamType,
              color: currentPreset.color,
              bgColor: currentPreset.bgColor,
              borderColor: currentPreset.borderColor,
              description: formDescription.trim() || `${formName.trim()} inflow stream`,
              defaultQuickAmounts: finalAmounts,
              isCustom: true,
            };
          }
          return c;
        });
        onSaveIncomeCategories(updated);
      } else {
        const newIncomeCategory: IncomeCategoryMeta = {
          id: formName.trim() as any,
          name: formName.trim(),
          iconName: formIcon,
          streamType: formStreamType,
          color: currentPreset.color,
          bgColor: currentPreset.bgColor,
          borderColor: currentPreset.borderColor,
          description: formDescription.trim() || `${formName.trim()} income stream`,
          defaultQuickAmounts: finalAmounts,
          isCustom: true,
        };
        onSaveIncomeCategories([...incomeCategories, newIncomeCategory]);
      }
    }

    setIsEditing(false);
    setEditingTargetId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to remove the category "${id}"?`)) {
      if (activeTab === "expense") {
        onSaveExpenseCategories(expenseCategories.filter((c) => c.id !== id));
      } else {
        onSaveIncomeCategories(incomeCategories.filter((c) => c.id !== id));
      }
    }
  };

  // Filtered list
  const filteredExpenseList = expenseCategories.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  const filteredIncomeList = incomeCategories.filter((c) => {
    if (streamFilter !== "ALL" && c.streamType !== streamFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  const FormIconComponent = ICONS_MAP[formIcon] || Tag;

  return (
    <div
      id="category-manager-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div
        id="category-manager-dialog"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E8EAED] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#F1F3F4] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#202124]">
                Categories & Streams Manager
              </h2>
              <p className="text-xs text-[#5F6368]">
                Customise names, color swatches, icons and quick amounts
              </p>
            </div>
          </div>

          <button
            id="btn-close-category-manager"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6368] hover:bg-[#E8EAED] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector: Expense vs Income Categories */}
        <div className="p-3 bg-white border-b border-[#F1F3F4] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center bg-[#F1F3F4] p-1 rounded-2xl gap-1">
            <button
              id="tab-btn-cat-expense"
              type="button"
              onClick={() => {
                setActiveTab("expense");
                setIsEditing(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "expense"
                  ? "bg-white text-[#1A73E8] shadow-xs font-bold"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              <span>🛒 Expense Categories</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E8F0FE] text-[#1A73E8]">
                {expenseCategories.length}
              </span>
            </button>

            <button
              id="tab-btn-cat-income"
              type="button"
              onClick={() => {
                setActiveTab("income");
                setIsEditing(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "income"
                  ? "bg-white text-[#0F9D58] shadow-xs font-bold"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              <span>💰 Income & Streams</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E6F4EA] text-[#0F9D58]">
                {incomeCategories.length}
              </span>
            </button>
          </div>

          {!isEditing && (
            <button
              id="btn-add-new-category-modal"
              type="button"
              onClick={handleOpenAdd}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer ${
                activeTab === "expense"
                  ? "bg-[#1A73E8] hover:bg-[#1557B0]"
                  : "bg-[#0F9D58] hover:bg-[#0B8043]"
              }`}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>+ Add {activeTab === "expense" ? "Spend" : "Income"} Category</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* EDIT / CREATE FORM DRAWER */}
          {isEditing ? (
            <form
              onSubmit={handleSaveForm}
              className="bg-[#F8F9FA] rounded-2xl border border-[#DADCE0] p-4 sm:p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#E8EAED] pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center border"
                    style={{
                      backgroundColor: currentPreset.bgColor,
                      borderColor: currentPreset.borderColor,
                      color: currentPreset.color,
                    }}
                  >
                    <FormIconComponent size={16} />
                  </span>
                  <h3 className="text-sm font-bold text-[#202124]">
                    {editingTargetId ? `Edit Category "${formName}"` : `Create New ${activeTab === "expense" ? "Expense" : "Income"} Category`}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-[#5F6368] hover:text-[#202124] underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Income Stream Type Selector (If Income Tab) */}
              {activeTab === "income" && (
                <div>
                  <label className="block text-xs font-semibold text-[#5F6368] mb-1.5">
                    Income Stream Classification:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormStreamType("salary_bonus")}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        formStreamType === "salary_bonus"
                          ? "bg-[#E6F4EA] border-[#0F9D58] text-[#0F9D58] font-bold ring-2 ring-[#0F9D58]/20"
                          : "bg-white border-[#DADCE0] text-[#3C4043] hover:bg-[#F1F3F4]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={14} />
                        <span>💼 Salary & Bonus</span>
                      </div>
                      <p className="text-[10px] text-[#5F6368] mt-0.5 font-normal">
                        Fixed salary, corporate appraisal, monthly retainer
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormStreamType("extra_income")}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        formStreamType === "extra_income"
                          ? "bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] font-bold ring-2 ring-[#1A73E8]/20"
                          : "bg-white border-[#DADCE0] text-[#3C4043] hover:bg-[#F1F3F4]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={14} />
                        <span>⚡ Extra & Side Income</span>
                      </div>
                      <p className="text-[10px] text-[#5F6368] mt-0.5 font-normal">
                        Freelance, trading, rental, cash gifts, side hustles
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Category Name Input */}
              <div>
                <label className="block text-xs font-semibold text-[#5F6368] mb-1">
                  Category Name <span className="text-[#EA4335]">*</span>
                </label>
                <input
                  id="input-cat-form-name"
                  type="text"
                  required
                  placeholder={
                    activeTab === "expense"
                      ? "e.g. Gym & Fitness, Pet Care, House Maid, Bike Fuel"
                      : "e.g. YouTube AdSense, Consulting, Agriculture Mandi, Airbnb"
                  }
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white text-xs font-medium text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none"
                />
              </div>

              {/* Color Preset Palette */}
              <div>
                <label className="block text-xs font-semibold text-[#5F6368] mb-1.5">
                  Color Theme Swatch:
                </label>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {CATEGORY_COLOR_PRESETS.map((preset, idx) => {
                    const isSelected = formColorIndex === idx;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setFormColorIndex(idx)}
                        title={preset.name}
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform cursor-pointer border ${
                          isSelected ? "scale-115 ring-2 ring-offset-2 ring-[#202124]" : "hover:scale-105"
                        }`}
                        style={{
                          backgroundColor: preset.color,
                          borderColor: preset.borderColor,
                        }}
                      >
                        {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Selector Grid */}
              <div>
                <label className="block text-xs font-semibold text-[#5F6368] mb-1.5">
                  Select Icon ({AVAILABLE_CATEGORY_ICONS.length} options):
                </label>
                <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 max-h-32 overflow-y-auto bg-white p-2 rounded-xl border border-[#DADCE0]">
                  {AVAILABLE_CATEGORY_ICONS.map((iconName) => {
                    const IconComp = ICONS_MAP[iconName] || Tag;
                    const isSelected = formIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        title={iconName}
                        onClick={() => setFormIcon(iconName)}
                        className={`p-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#202124] text-white shadow-xs"
                            : "text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]"
                        }`}
                      >
                        <IconComp size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description & Quick Amounts in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5F6368] mb-1">
                    Short Description:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly gym subscription & protein"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-xs text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5F6368] mb-1">
                    Quick Amount Chips (comma separated):
                  </label>
                  <input
                    type="text"
                    placeholder="100, 250, 500, 1000"
                    value={formQuickAmounts}
                    onChange={(e) => setFormQuickAmounts(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-xs text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                  />
                </div>
              </div>

              {/* Save / Submit buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5F6368] hover:bg-[#E8EAED] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-category-form"
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer ${
                    activeTab === "expense"
                      ? "bg-[#1A73E8] hover:bg-[#1557B0]"
                      : "bg-[#0F9D58] hover:bg-[#0B8043]"
                  }`}
                >
                  {editingTargetId ? "Save Category Changes" : "Create Category"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Category Search & Filter Toolbar */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
                <div className="relative flex-1 min-w-[180px]">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]"
                  />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab === "expense" ? "expense" : "income"} categories...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#F8F9FA] text-xs text-[#202124] rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none"
                  />
                </div>

                {activeTab === "income" && (
                  <div className="flex items-center gap-1 bg-[#F1F3F4] p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setStreamFilter("ALL")}
                      className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                        streamFilter === "ALL" ? "bg-white text-[#202124] shadow-2xs font-bold" : "text-[#5F6368]"
                      }`}
                    >
                      All Inflows
                    </button>
                    <button
                      type="button"
                      onClick={() => setStreamFilter("salary_bonus")}
                      className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                        streamFilter === "salary_bonus" ? "bg-[#E6F4EA] text-[#0F9D58] font-bold shadow-2xs" : "text-[#5F6368]"
                      }`}
                    >
                      💼 Salary & Bonus
                    </button>
                    <button
                      type="button"
                      onClick={() => setStreamFilter("extra_income")}
                      className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                        streamFilter === "extra_income" ? "bg-[#E8F0FE] text-[#1A73E8] font-bold shadow-2xs" : "text-[#5F6368]"
                      }`}
                    >
                      ⚡ Extra Income
                    </button>
                  </div>
                )}
              </div>

              {/* Categories Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeTab === "expense" ? (
                  filteredExpenseList.map((cat) => {
                    const IconComp = ICONS_MAP[cat.iconName] || Tag;
                    return (
                      <div
                        key={cat.id}
                        id={`card-cat-exp-${cat.id.replace(/\s+/g, "-").toLowerCase()}`}
                        className="p-3 bg-white hover:bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] transition-all flex items-center justify-between gap-3 shadow-2xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: cat.bgColor,
                              borderColor: cat.borderColor,
                              color: cat.color,
                            }}
                          >
                            <IconComp size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-[#202124] truncate">
                                {cat.name}
                              </h4>
                              {cat.isCustom && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]">
                                  CUSTOM
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#5F6368] truncate mt-0.5">
                              {cat.description}
                            </p>
                          </div>
                        </div>

                        {/* Actions: Edit in GREEN, Delete in RED */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            title="Edit Category"
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#0F9D58] bg-[#E6F4EA] hover:bg-[#CEEAD6] border border-[#CEEAD6] rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            <Edit2 size={12} strokeWidth={2.2} />
                            <span>Edit</span>
                          </button>

                          {cat.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDelete(cat.id)}
                              title="Delete Category"
                              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#EA4335] bg-[#FCE8E6] hover:bg-[#FAD2CF] border border-[#FAD2CF] rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              <Trash2 size={12} strokeWidth={2.2} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  filteredIncomeList.map((cat) => {
                    const IconComp = ICONS_MAP[cat.iconName] || Briefcase;
                    const isSalary = cat.streamType === "salary_bonus";
                    return (
                      <div
                        key={cat.id}
                        id={`card-cat-inc-${cat.id.replace(/\s+/g, "-").toLowerCase()}`}
                        className="p-3 bg-white hover:bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] transition-all flex items-center justify-between gap-3 shadow-2xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: cat.bgColor,
                              borderColor: cat.borderColor,
                              color: cat.color,
                            }}
                          >
                            <IconComp size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-[#202124] truncate">
                                {cat.name}
                              </h4>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  isSalary
                                    ? "bg-[#E6F4EA] text-[#0F9D58]"
                                    : "bg-[#E8F0FE] text-[#1A73E8]"
                                }`}
                              >
                                {isSalary ? "💼 Salary & Bonus" : "⚡ Extra Income"}
                              </span>
                              {cat.isCustom && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]">
                                  CUSTOM
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#5F6368] truncate mt-0.5">
                              {cat.description}
                            </p>
                          </div>
                        </div>

                        {/* Actions: Edit in Green, Delete in Red */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            title="Edit Category"
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#0F9D58] bg-[#E6F4EA] hover:bg-[#CEEAD6] border border-[#CEEAD6] rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            <Edit2 size={12} strokeWidth={2.2} />
                            <span>Edit</span>
                          </button>

                          {cat.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDelete(cat.id)}
                              title="Delete Category"
                              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#EA4335] bg-[#FCE8E6] hover:bg-[#FAD2CF] border border-[#FAD2CF] rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              <Trash2 size={12} strokeWidth={2.2} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer: Reset to defaults & Done */}
        <div className="p-3.5 sm:p-4 bg-[#F8F9FA] border-t border-[#F1F3F4] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (confirm("Reset all categories back to initial standard categories?")) {
                onResetDefaultCategories();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-[#5F6368] hover:text-[#EA4335] transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset to Standard Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#202124] hover:bg-[#3C4043] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
