import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  Sparkles,
  CalendarRange,
  Clock,
  ArrowRight,
  X,
} from "lucide-react";

export type PeriodPreset =
  | "today"
  | "this-week"
  | "this-month"
  | "quarterly" // "Quality" / Quarterly
  | "last-30-days"
  | "ytd"
  | "custom";

export interface DateRangeValue {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  preset: PeriodPreset;
  label?: string;
}

interface DatePeriodFilterProps {
  value: DateRangeValue;
  onChange: (newValue: DateRangeValue) => void;
  className?: string;
}

// Utility to format YYYY-MM-DD to DD/MM/YY
export function formatToDDMMYY(dateStr: string): string {
  if (!dateStr) return "DD/MM/YY";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parts[0].slice(-2);
      const month = parts[1];
      const day = parts[2];
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// Utility to format date as YYYY-MM-DD
function formatToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Compute Start and End Dates for Presets
export function calculatePresetRange(preset: PeriodPreset): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const todayStr = formatToYYYYMMDD(now);

  switch (preset) {
    case "today": {
      return {
        startDate: todayStr,
        endDate: todayStr,
        label: "Today",
      };
    }
    case "this-week": {
      const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
      // Standard week starting on Monday
      const diffToMonday = (dayOfWeek + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return {
        startDate: formatToYYYYMMDD(monday),
        endDate: formatToYYYYMMDD(sunday > now ? now : sunday),
        label: "This Week",
      };
    }
    case "this-month": {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startDate: formatToYYYYMMDD(firstDay),
        endDate: formatToYYYYMMDD(lastDay > now ? now : lastDay),
        label: "This Month",
      };
    }
    case "quarterly": {
      // Quality / Quarterly: Current Calendar Quarter
      const currentMonth = now.getMonth();
      const quarterIndex = Math.floor(currentMonth / 3); // 0: Q1 (Jan-Mar), 1: Q2 (Apr-Jun), 2: Q3 (Jul-Sep), 3: Q4 (Oct-Dec)
      const qStartMonth = quarterIndex * 3;
      const qEndMonth = qStartMonth + 2;

      const firstDay = new Date(now.getFullYear(), qStartMonth, 1);
      const lastDay = new Date(now.getFullYear(), qEndMonth + 1, 0);

      const qName = `Q${quarterIndex + 1} (${now.getFullYear()})`;
      return {
        startDate: formatToYYYYMMDD(firstDay),
        endDate: formatToYYYYMMDD(lastDay > now ? now : lastDay),
        label: `Quality / Quarterly (${qName})`,
      };
    }
    case "last-30-days": {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return {
        startDate: formatToYYYYMMDD(thirtyDaysAgo),
        endDate: todayStr,
        label: "Last 30 Days",
      };
    }
    case "ytd": {
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: formatToYYYYMMDD(firstDayOfYear),
        endDate: todayStr,
        label: "Year-to-Date (YTD)",
      };
    }
    case "custom":
    default: {
      return {
        startDate: todayStr,
        endDate: todayStr,
        label: "Custom Range",
      };
    }
  }
}

const PRESET_OPTIONS: { id: PeriodPreset; title: string; subtitle: string; icon: string }[] = [
  { id: "today", title: "Today", subtitle: "Single day overview", icon: "⚡" },
  { id: "this-week", title: "This Week", subtitle: "Mon to Sun spending", icon: "📅" },
  { id: "this-month", title: "This Month", subtitle: "Current calendar month", icon: "🗓️" },
  { id: "quarterly", title: "Quality (Quarterly)", subtitle: "3-Month fiscal quarter cycle", icon: "📊" },
  { id: "last-30-days", title: "Last 30 Days", subtitle: "Rolling 30-day velocity", icon: "⏱️" },
  { id: "ytd", title: "Year-to-Date", subtitle: "Jan 1 to current date", icon: "📈" },
  { id: "custom", title: "Custom Range", subtitle: "Select specific start & end dates", icon: "🎯" },
];

export const DatePeriodFilter: React.FC<DatePeriodFilterProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCalendarMode, setIsCalendarMode] = useState(value.preset === "custom");

  // Temporary state when picking custom range
  const [tempStart, setTempStart] = useState<string>(value.startDate);
  const [tempEnd, setTempEnd] = useState<string>(value.endDate);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Calendar navigation month/year
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const d = value.startDate ? new Date(value.startDate) : new Date();
    return isNaN(d.getTime()) ? new Date() : new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state when value prop changes or modal opens
  useEffect(() => {
    setTempStart(value.startDate);
    setTempEnd(value.endDate);
    if (value.preset === "custom") {
      setIsCalendarMode(true);
    }
  }, [value, isOpen]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle Preset selection
  const handleSelectPreset = (preset: PeriodPreset) => {
    if (preset === "custom") {
      setIsCalendarMode(true);
      return;
    }

    const calculated = calculatePresetRange(preset);
    onChange({
      startDate: calculated.startDate,
      endDate: calculated.endDate,
      preset: preset,
      label: calculated.label,
    });
    setIsOpen(false);
  };

  // Calendar Day Click Handler
  const handleDayClick = (dateStr: string) => {
    // If no start date or both start and end are already selected, start a new selection
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd("");
    } else if (tempStart && !tempEnd) {
      // Second click: determine chronological order
      if (new Date(dateStr) < new Date(tempStart)) {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const handleApplyCustom = () => {
    if (!tempStart) return;
    const finalStart = tempStart;
    const finalEnd = tempEnd || tempStart; // if only 1 day selected, make it single day range
    onChange({
      startDate: finalStart,
      endDate: finalEnd,
      preset: "custom",
      label: "Custom Range",
    });
    setIsOpen(false);
  };

  const handleResetToCurrentMonth = () => {
    const m = calculatePresetRange("this-month");
    setTempStart(m.startDate);
    setTempEnd(m.endDate);
    onChange({
      startDate: m.startDate,
      endDate: m.endDate,
      preset: "this-month",
      label: m.label,
    });
    setIsCalendarMode(false);
    setIsOpen(false);
  };

  // Month navigation
  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  // Calendar days grid generation
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 for Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dateStr: formatToYYYYMMDD(prevDate),
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      days.push({
        dateStr: formatToYYYYMMDD(curDate),
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Next month padding to reach multiple of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      days.push({
        dateStr: formatToYYYYMMDD(nextDate),
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewMonth]);

  // Formatted date values
  const formattedStart = formatToDDMMYY(value.startDate);
  const formattedEnd = formatToDDMMYY(value.endDate);

  const activePresetTitle =
    PRESET_OPTIONS.find((p) => p.id === value.preset)?.title || "Period";

  return (
    <div
      ref={dropdownRef}
      id="date-range-period-filter-wrapper"
      className={`relative inline-block text-left ${className}`}
    >
      {/* ============================================================ */}
      {/* 1. DARK MODE FILTER BAR (Date Display + Period ⌵ Button) */}
      {/* ============================================================ */}
      <div
        id="date-range-period-bar"
        className="flex items-center gap-1.5 sm:gap-2 bg-[#1E1F24] border border-[#32353B] rounded-2xl p-1.5 shadow-md transition-all hover:border-[#4E525C] overflow-x-auto no-scrollbar max-w-full touch-pan-x"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Left Side: Date Display with Calendar Icons (DD/MM/YY 📅 ~ DD/MM/YY 📅) */}
        <button
          id="btn-date-range-display"
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setIsCalendarMode(false);
          }}
          title="Click to change date period or range"
          className="shrink-0 flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-[#2B2D33] hover:bg-[#353840] text-[#F8F9FA] rounded-xl text-xs font-semibold tracking-wide border border-[#3E424B] transition-colors cursor-pointer group"
        >
          {/* Start Date */}
          <span className="flex items-center gap-1 text-[#E8EAED] group-hover:text-white">
            <span className="font-mono text-[11px] sm:text-xs">{formattedStart}</span>
            <span className="text-[12px] sm:text-[13px]" role="img" aria-label="start calendar">
              📅
            </span>
          </span>

          {/* Range Separator */}
          <span className="text-[#80868B] font-bold px-0.5">~</span>

          {/* End Date */}
          <span className="flex items-center gap-1 text-[#E8EAED] group-hover:text-white">
            <span className="font-mono text-[11px] sm:text-xs">{formattedEnd}</span>
            <span className="text-[12px] sm:text-[13px]" role="img" aria-label="end calendar">
              📅
            </span>
          </span>
        </button>

        {/* Right Side: Period Dropdown Button (Period ⌵) */}
        <button
          id="btn-period-dropdown"
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setIsCalendarMode(false);
          }}
          aria-expanded={isOpen}
          className={`shrink-0 flex-shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            isOpen
              ? "bg-[#388BFD] text-white border-[#388BFD] shadow-sm"
              : "bg-[#2B2D33] hover:bg-[#353840] text-[#F1F3F4] border-[#3E424B]"
          }`}
        >
          <span className="hidden sm:inline text-[#9AA0A6] font-normal mr-0.5">
            {value.preset !== "custom" && activePresetTitle !== "Period" ? activePresetTitle : "Period"}
          </span>
          <span className="sm:hidden font-semibold">Period</span>
          <span className="text-sm font-black transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
            ⌵
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 2. POPUP MENU (Presets & Interactive Date-Picker Calendar) */}
      {/* ============================================================ */}
      {isOpen && (
        <div
          id="period-filter-dropdown-menu"
          className="absolute right-0 mt-2 z-50 w-[330px] sm:w-[380px] bg-[#18191C] border border-[#3A3D46] rounded-2xl shadow-2xl overflow-hidden animate-fadeIn text-[#E8EAED]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#202226] border-b border-[#30333A]">
            <div className="flex items-center gap-2">
              <CalendarRange size={16} className="text-[#388BFD]" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {isCalendarMode ? "Custom Date Picker" : "Select Period Range"}
              </h4>
            </div>

            <div className="flex items-center gap-1">
              {isCalendarMode && (
                <button
                  type="button"
                  onClick={() => setIsCalendarMode(false)}
                  className="text-[11px] font-semibold text-[#8AB4F8] hover:text-white px-2 py-0.5 rounded bg-[#2B2D33] transition-colors"
                >
                  ← Presets
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[#9AA0A6] hover:text-white hover:bg-[#2B2D33] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Current Active Range Tag in Dropdown */}
          <div className="px-4 py-2 bg-[#1B1D21] border-b border-[#2B2D33] flex items-center justify-between text-xs">
            <span className="text-[#9AA0A6]">Current Filter:</span>
            <span className="font-semibold text-[#8AB4F8] bg-[#22272E] px-2 py-0.5 rounded-md border border-[#30363D] font-mono">
              {formattedStart} 📅 ~ {formattedEnd} 📅
            </span>
          </div>

          {/* VIEW 1: PRESET OPTIONS LIST */}
          {!isCalendarMode ? (
            <div className="p-3 space-y-1.5 max-h-[380px] overflow-y-auto">
              {PRESET_OPTIONS.map((opt) => {
                const isSelected = value.preset === opt.id;
                const calc = opt.id !== "custom" ? calculatePresetRange(opt.id) : null;

                return (
                  <button
                    key={opt.id}
                    id={`btn-preset-${opt.id}`}
                    type="button"
                    onClick={() => handleSelectPreset(opt.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#21262D] border-[#388BFD] text-white shadow-xs"
                        : "bg-[#1E1F24] hover:bg-[#282A30] border-transparent hover:border-[#3A3D46] text-[#E8EAED]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-6 text-center">{opt.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{opt.title}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-[#1A73E8] text-white px-1.5 py-0.2 rounded font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#9AA0A6] mt-0.5">
                          {calc
                            ? `${formatToDDMMYY(calc.startDate)} ~ ${formatToDDMMYY(calc.endDate)}`
                            : opt.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center text-[#9AA0A6]">
                      {isSelected ? (
                        <Check size={16} className="text-[#388BFD]" />
                      ) : opt.id === "custom" ? (
                        <ArrowRight size={14} />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* VIEW 2: INTERACTIVE CUSTOM DATE-PICKER CALENDAR */
            <div className="p-4 space-y-3.5 animate-fadeIn">
              {/* Month Navigation Header */}
              <div className="flex items-center justify-between border-b border-[#2B2D33] pb-2.5">
                <button
                  type="button"
                  onClick={prevMonth}
                  title="Previous Month"
                  className="p-1.5 rounded-lg bg-[#2B2D33] hover:bg-[#353840] text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="text-xs font-bold text-white tracking-wide">
                  {viewMonth.toLocaleString("en-IN", { month: "long", year: "numeric" })}
                </div>

                <button
                  type="button"
                  onClick={nextMonth}
                  title="Next Month"
                  className="p-1.5 rounded-lg bg-[#2B2D33] hover:bg-[#353840] text-white transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day of Week Header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#80868B]">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days Matrix */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarDays.map(({ dateStr, dayNum, isCurrentMonth }, idx) => {
                  const isStart = tempStart === dateStr;
                  const isEnd = tempEnd === dateStr;
                  const inSelectedRange =
                    tempStart &&
                    tempEnd &&
                    new Date(dateStr) >= new Date(tempStart) &&
                    new Date(dateStr) <= new Date(tempEnd);

                  const inHoverRange =
                    tempStart &&
                    !tempEnd &&
                    hoverDate &&
                    new Date(dateStr) >=
                      new Date(Math.min(new Date(tempStart).getTime(), new Date(hoverDate).getTime())) &&
                    new Date(dateStr) <=
                      new Date(Math.max(new Date(tempStart).getTime(), new Date(hoverDate).getTime()));

                  return (
                    <button
                      key={`${dateStr}-${idx}`}
                      type="button"
                      onClick={() => handleDayClick(dateStr)}
                      onMouseEnter={() => setHoverDate(dateStr)}
                      onMouseLeave={() => setHoverDate(null)}
                      className={`h-8 w-full rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                        !isCurrentMonth ? "opacity-30 text-[#80868B]" : "text-[#F8F9FA]"
                      } ${
                        isStart || isEnd
                          ? "bg-[#1A73E8] text-white font-bold shadow-xs z-10"
                          : inSelectedRange
                          ? "bg-[#1A73E8]/25 text-[#8AB4F8] rounded-none first:rounded-l-lg last:rounded-r-lg"
                          : inHoverRange
                          ? "bg-[#2B2D33] text-[#8AB4F8]"
                          : "hover:bg-[#2B2D33]"
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>

              {/* Date Input Boxes Fallback & Summary */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2B2D33]">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#9AA0A6] block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    className="w-full bg-[#202226] border border-[#383B42] rounded-lg px-2 py-1 text-xs text-white focus:border-[#388BFD] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#9AA0A6] block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tempEnd || tempStart}
                    onChange={(e) => setTempEnd(e.target.value)}
                    className="w-full bg-[#202226] border border-[#383B42] rounded-lg px-2 py-1 text-xs text-white focus:border-[#388BFD] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetToCurrentMonth}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#9AA0A6] hover:text-white px-2.5 py-1.5 rounded-lg bg-[#2B2D33] hover:bg-[#353840] transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset Month</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCalendarMode(false)}
                    className="text-xs font-semibold text-[#9AA0A6] hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-apply-custom-range"
                    type="button"
                    onClick={handleApplyCustom}
                    className="px-4 py-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>Apply Range</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
