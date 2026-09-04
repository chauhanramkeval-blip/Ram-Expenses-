import React, { useState } from "react";
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Users,
  Share2,
  Plus,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import {
  CallLogContact,
  SAMPLE_CALL_LOGS,
} from "../utils/permissionManager";

interface CallContactsLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContactForExpense: (contact: {
    name: string;
    phone: string;
    upiId?: string;
    action: "split" | "pay" | "lend";
  }) => void;
  onRequestNativeContacts?: () => void;
}

export const CallContactsLogModal: React.FC<CallContactsLogModalProps> = ({
  isOpen,
  onClose,
  onSelectContactForExpense,
  onRequestNativeContacts,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "recent_calls" | "split_contacts">("all");
  const [callLogs] = useState<CallLogContact[]>(SAMPLE_CALL_LOGS);

  if (!isOpen) return null;

  const filteredLogs = callLogs.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm) ||
      (item.upiId && item.upiId.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeFilter === "recent_calls") return item.callType !== undefined;
    if (activeFilter === "split_contacts") return item.suggestedAction === "split_expense";
    return true;
  });

  const handleActionClick = (
    contact: CallLogContact,
    actionType: "split" | "pay" | "lend"
  ) => {
    onSelectContactForExpense({
      name: contact.name,
      phone: contact.phone,
      upiId: contact.upiId,
      action: actionType,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="modal-call-contacts-log"
        className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border border-[#E8EAED] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F3F4] bg-linear-to-r from-[#E8F0FE]/60 via-white to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center border border-[#D2E3FC]">
              <PhoneCall size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#202124]">
                  Call History & Contacts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
                  Step 4 • Connected
                </span>
              </div>
              <p className="text-xs text-[#5F6368]">
                Split bills, log UPI payments & record udhar with recent phone contacts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-[#F1F3F4] bg-[#F8F9FA] space-y-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#80868B]"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone (+91), or UPI ID..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E8EAED] bg-white text-xs text-[#202124] placeholder-[#80868B] focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-[#1A73E8] text-white shadow-xs"
                  : "bg-white text-[#5F6368] border border-[#E8EAED] hover:bg-[#F1F3F4]"
              }`}
            >
              All Contacts
            </button>
            <button
              onClick={() => setActiveFilter("recent_calls")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === "recent_calls"
                  ? "bg-[#1A73E8] text-white shadow-xs"
                  : "bg-white text-[#5F6368] border border-[#E8EAED] hover:bg-[#F1F3F4]"
              }`}
            >
              📞 Recent Calls
            </button>
            <button
              onClick={() => setActiveFilter("split_contacts")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === "split_contacts"
                  ? "bg-[#1A73E8] text-white shadow-xs"
                  : "bg-white text-[#5F6368] border border-[#E8EAED] hover:bg-[#F1F3F4]"
              }`}
            >
              👥 Frequent Split Pals
            </button>
          </div>
        </div>

        {/* Contact List Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#5F6368] px-1">
            <span>Recent Phone Interactions</span>
            <span className="flex items-center gap-1 text-[#137333]">
              <ShieldCheck size={13} /> Zero Cloud Uploads
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#5F6368]">
              No contacts found matching &quot;{searchTerm}&quot;
            </div>
          ) : (
            filteredLogs.map((contact) => (
              <div
                key={contact.id}
                className="p-3.5 rounded-2xl bg-white border border-[#E8EAED] hover:border-[#1A73E8]/40 hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#F1F3F4] text-[#202124] font-bold text-sm flex items-center justify-center shrink-0 border border-[#E8EAED]">
                      {contact.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-[#202124] truncate">
                          {contact.name}
                        </h4>
                        {contact.callType && (
                          <span className="flex items-center gap-0.5 text-[10px] text-[#5F6368] bg-[#F1F3F4] px-1.5 py-0.5 rounded">
                            {contact.callType === "incoming" ? (
                              <PhoneIncoming size={11} className="text-[#137333]" />
                            ) : (
                              <PhoneOutgoing size={11} className="text-[#1A73E8]" />
                            )}
                            <span>{contact.duration}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5F6368] mt-0.5">
                        {contact.phone} {contact.upiId ? `• ${contact.upiId}` : ""}
                      </p>
                      <span className="text-[10px] text-[#80868B] block mt-0.5">
                        {contact.timestamp} • {contact.recentTransactionsCount || 0} past khata entries
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1-Tap Fast Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#F8F9FA]">
                  <button
                    onClick={() => handleActionClick(contact, "split")}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] text-[11px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Share2 size={13} /> Split Expense
                  </button>
                  <button
                    onClick={() => handleActionClick(contact, "pay")}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] text-[11px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CreditCard size={13} /> Log Payment
                  </button>
                  <button
                    onClick={() => handleActionClick(contact, "lend")}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-[#FEF7E0] hover:bg-[#FEEFC3] text-[#B06000] text-[11px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus size={13} /> Record Udhar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#F1F3F4] bg-[#F8F9FA] text-xs text-[#5F6368]">
          <span className="text-[11px]">Contacts are accessed locally via Contacts API.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#5F6368] hover:text-[#202124] hover:bg-[#E8EAED] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
