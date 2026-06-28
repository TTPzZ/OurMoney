/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Avatar from "@/components/Avatar";
import { X, Receipt, Users, CreditCard, ExternalLink, Maximize2, QrCode } from "lucide-react";
import Card from "@/components/ui/Card";
import BillDetailModal from "@/components/BillDetailModal";

interface BillSplit {
  userId: {
    _id: string;
    name: string;
    image?: string | null;
  };
  amount: number;
}

interface Bill {
  _id: string;
  description: string;
  totalAmount: number;
  paidBy: {
    _id: string;
    name: string;
    image?: string | null;
    hasPaymentQR?: boolean;
  };
  splits: BillSplit[];
  imageUrl?: string;
  scanSource?: 'ocr' | 'ai' | null;
  createdAt: string;
}

export default function BillList({ 
  bills,
  currentUserId,
  isGroupCreator,
  onDeleteBill,
}: { 
  bills: Bill[];
  currentUserId?: string;
  isGroupCreator?: boolean;
  onDeleteBill?: (billId: string) => void;
}) {
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (bills.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {bills.map((bill) => (
        <div
          key={bill._id}
          onClick={() => setSelectedBill(bill)}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shrink-0">
              <Avatar src={bill.paidBy.image} name={bill.paidBy.name} size={40} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 leading-tight">
                  {bill.description}
                </h3>
                {bill.scanSource === 'ocr' && (
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-tighter">
                    📄 OCR
                  </span>
                )}
                {bill.scanSource === 'ai' && (
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase tracking-tighter border border-indigo-100">
                    ✨ AI
                  </span>
                )}
                {bill.imageUrl && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-[4px] border border-emerald-100 shadow-sm animate-pulse">
                    <Maximize2 size={8} className="font-black" />
                    <span className="text-[7px] font-black uppercase">Ảnh</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                Paid by {bill.paidBy.name.split(" ")[0]} • {formatDistanceToNow(new Date(bill.createdAt))} ago
              </p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <p className="text-sm font-black text-gray-900">
              ₫{bill.totalAmount.toLocaleString()}
            </p>
            <div className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Bấm để xem chi tiết →
            </div>
          </div>
        </div>
      ))}

      <BillDetailModal
        bill={selectedBill}
        onClose={() => setSelectedBill(null)}
        currentUserId={currentUserId}
        isGroupCreator={isGroupCreator}
        onDelete={(billId) => {
          setSelectedBill(null);
          if (onDeleteBill) onDeleteBill(billId);
        }}
      />
    </div>
  );
}
