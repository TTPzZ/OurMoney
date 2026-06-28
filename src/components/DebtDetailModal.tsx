"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRightLeft, Receipt, ExternalLink } from "lucide-react";
import Avatar from "@/components/Avatar";
import { formatDistanceToNow } from "date-fns";
import type { BillWithPayer, Settlement, GroupMember } from "@/lib/money-types";
import Card from "@/components/ui/Card";

interface TransactionItem {
  id: string;
  type: 'bill' | 'settlement';
  date: Date;
  description: string;
  amount: number;
  isUser1OwesUser2: boolean;
  rawBill?: BillWithPayer;
}

export default function DebtDetailModal({
  open,
  onClose,
  user1Id,
  user2Id,
  groupMembers,
  bills,
  settlements,
  onSelectBill,
}: {
  open: boolean;
  onClose: () => void;
  user1Id: string;
  user2Id: string;
  groupMembers: GroupMember[];
  bills: BillWithPayer[];
  settlements: Settlement[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectBill: (bill: any) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const user2 = groupMembers.find(m => m._id === user2Id);
  if (!user2) return null;

  const transactions: TransactionItem[] = [];
  let directDebtUser1ToUser2 = 0; // Negative means user2 owes user1

  // Process Bills
  bills.forEach((bill) => {
    const isUser1Paid = bill.paidBy._id === user1Id;
    const isUser2Paid = bill.paidBy._id === user2Id;

    if (isUser1Paid) {
      const splitForUser2 = bill.splits.find((s) => s.userId._id === user2Id);
      if (splitForUser2) {
        transactions.push({
          id: bill._id,
          type: 'bill',
          date: new Date(bill.createdAt),
          description: bill.description,
          amount: splitForUser2.amount,
          isUser1OwesUser2: false, // User2 owes User1
          rawBill: bill,
        });
        directDebtUser1ToUser2 -= splitForUser2.amount;
      }
    } else if (isUser2Paid) {
      const splitForUser1 = bill.splits.find((s) => s.userId._id === user1Id);
      if (splitForUser1) {
        transactions.push({
          id: bill._id,
          type: 'bill',
          date: new Date(bill.createdAt),
          description: bill.description,
          amount: splitForUser1.amount,
          isUser1OwesUser2: true, // User1 owes User2
          rawBill: bill,
        });
        directDebtUser1ToUser2 += splitForUser1.amount;
      }
    }
  });

  // Process Settlements
  settlements.forEach((settlement) => {
    // Only completed settlements? Actually all settlements affect balance if they are completed
    // Let's only include completed settlements. Pending means it's not resolved yet.
    if (settlement.status !== 'completed') return;

    if (settlement.from._id === user1Id && settlement.to._id === user2Id) {
      transactions.push({
        id: settlement._id,
        type: 'settlement',
        // eslint-disable-next-line react-hooks/purity
        date: new Date(settlement.paidAt || settlement.completedAt || Date.now()),
        description: "Thanh toán nợ",
        amount: settlement.amount,
        isUser1OwesUser2: false, // User1 paid User2, reducing User1's debt -> effectively User2 "owes" User1 the refund, or it's a negative debt
      });
      directDebtUser1ToUser2 -= settlement.amount;
    } else if (settlement.from._id === user2Id && settlement.to._id === user1Id) {
      transactions.push({
        id: settlement._id,
        type: 'settlement',
        // eslint-disable-next-line react-hooks/purity
        date: new Date(settlement.paidAt || settlement.completedAt || Date.now()),
        description: "Thanh toán nợ",
        amount: settlement.amount,
        isUser1OwesUser2: true, // User2 paid User1
      });
      directDebtUser1ToUser2 += settlement.amount;
    }
  });

  // Sort chronological
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden relative flex flex-col"
        style={{ maxHeight: '90vh' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              Lịch sử giao dịch
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Bạn và {user2.name.split(" ")[0]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-slate-50">
          {transactions.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-400">Chưa có giao dịch trực tiếp nào giữa 2 bạn.</p>
            </div>
          ) : (
            transactions.map((t, idx) => (
              <Card 
                key={idx} 
                className={`p-4 ${t.type === 'bill' ? 'cursor-pointer hover:border-indigo-200 active:scale-[0.98]' : 'bg-slate-100/50'} transition-all`}
                onClick={() => {
                  if (t.type === 'bill' && t.rawBill) {
                    onSelectBill(t.rawBill);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'bill' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      {t.type === 'bill' ? <Receipt size={20} /> : <ArrowRightLeft size={20} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{t.description}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                        {formatDistanceToNow(t.date)} ago
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className={`text-sm font-black ${t.isUser1OwesUser2 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {t.isUser1OwesUser2 ? '-' : '+'}₫{t.amount.toLocaleString()}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                      {t.isUser1OwesUser2 ? `Bạn nợ ${user2.name.split(" ")[0]}` : `${user2.name.split(" ")[0]} nợ bạn`}
                    </p>
                  </div>
                </div>
                {t.type === 'bill' && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                    <span className="text-[9px] font-black text-indigo-400 flex items-center gap-1 uppercase tracking-widest">
                      Xem hóa đơn <ExternalLink size={10} />
                    </span>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        <div className="p-5 bg-white border-t border-slate-100 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Nợ trực tiếp</span>
            <span className={`text-lg font-black ${directDebtUser1ToUser2 > 0 ? 'text-red-500' : directDebtUser1ToUser2 < 0 ? 'text-emerald-500' : 'text-slate-900'}`}>
              {directDebtUser1ToUser2 > 0 ? `Bạn nợ ₫${directDebtUser1ToUser2.toLocaleString()}` : directDebtUser1ToUser2 < 0 ? `Nhận ₫${Math.abs(directDebtUser1ToUser2).toLocaleString()}` : 'Hòa vốn'}
            </span>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <p className="text-[10px] leading-relaxed font-medium text-amber-700">
              <span className="font-bold">Lưu ý:</span> Tổng nợ hiển thị bên ngoài màn hình chính có thể khác do hệ thống đã tự động tính toán bù trừ vòng tròn (A nợ B, B nợ C ➔ A nợ C) để tối ưu số lần chuyển khoản cho cả nhóm.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
