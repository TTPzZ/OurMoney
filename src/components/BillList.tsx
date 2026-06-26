import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Avatar from "@/components/Avatar";
import { X, Receipt, Users, CreditCard, ExternalLink, Maximize2, QrCode } from "lucide-react";
import Card from "@/components/ui/Card";
import PaymentQRModal from "@/components/PaymentQRModal";

interface BillSplit {
  userId: {
    _id: string;
    name: string;
    image?: string;
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
    image?: string;
    hasPaymentQR?: boolean;
  };
  splits: BillSplit[];
  imageUrl?: string;
  scanSource?: 'ocr' | 'ai' | null;
  createdAt: string;
}

export default function BillList({ bills }: { bills: Bill[] }) {
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

      {/* Bill Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300 relative"
            style={{ maxHeight: '90vh' }}
          >
            {/* Modal Header */}
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900">Chi tiết hóa đơn</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {formatDistanceToNow(new Date(selectedBill.createdAt))} ago
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedBill(null);
                  setShowFullImage(false);
                }}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(90vh - 100px)' }}>
              {/* Summary Card */}
              <Card className="p-5 bg-white border-none shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nội dung</p>
                    <p className="text-lg font-bold text-slate-900">{selectedBill.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 font-black text-xl">
                    ₫
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng số tiền</p>
                    <p className="text-2xl font-black text-slate-900">₫{selectedBill.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </Card>

              {/* Bill Image View */}
              {selectedBill.imageUrl && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard size={14} /> Ảnh hóa đơn
                    </p>
                    <button 
                      onClick={() => setShowFullImage(true)}
                      className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline"
                    >
                      Phóng to <ExternalLink size={10} />
                    </button>
                  </div>
                  <div 
                    onClick={() => setShowFullImage(true)}
                    className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-200 cursor-zoom-in relative group"
                  >
                    <img 
                      src={selectedBill.imageUrl} 
                      alt="Bill" 
                      className="w-full h-auto max-h-48 object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 className="text-white" size={32} />
                    </div>
                  </div>
                </div>
              )}

              {/* Full Image Overlay */}
              {showFullImage && selectedBill.imageUrl && (
                <div 
                  className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in zoom-in-95 duration-200"
                  onClick={() => setShowFullImage(false)}
                >
                  <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center backdrop-blur-md">
                    <X size={24} />
                  </button>
                  <img 
                    src={selectedBill.imageUrl} 
                    alt="Full Bill" 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                  />
                  <p className="mt-4 text-white/60 text-xs font-bold uppercase tracking-widest">Chạm để đóng</p>
                </div>
              )}

              {/* Paid By & Splits */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Users size={14} /> Phân chia chi phí
                </p>
                
                <div className="space-y-2">
                  {/* Payer */}
                  <div className="flex items-center justify-between p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden">
                        <Avatar src={selectedBill.paidBy.image} name={selectedBill.paidBy.name} size={40} />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">Người trả tiền</p>
                        <p className="font-bold text-white text-sm">{selectedBill.paidBy.name}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-xs font-black text-white">₫{selectedBill.totalAmount.toLocaleString()}</p>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedBill.paidBy.hasPaymentQR) setShowQR(true);
                        }}
                        disabled={!selectedBill.paidBy.hasPaymentQR}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border transition-all ${
                          selectedBill.paidBy.hasPaymentQR
                            ? "bg-white/20 text-white border-white/30 hover:bg-white/30 active:scale-95"
                            : "bg-white/5 text-white/40 border-white/10 cursor-not-allowed"
                        }`}
                        aria-label="Mã QR"
                      >
                        <QrCode size={12} />
                        Mã QR
                      </button>
                    </div>
                  </div>

                  {/* Splits */}
                  {selectedBill.splits && selectedBill.splits.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                      {selectedBill.splits.map((split, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={split.userId?.image} name={split.userId?.name || "Thành viên"} size={32} />
                            <span className="font-bold text-slate-700 text-sm">{split.userId?.name || "Thành viên"}</span>
                          </div>
                          <span className="font-black text-slate-900 text-sm">₫{split.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedBill && (
        <PaymentQRModal
          open={showQR}
          onClose={() => setShowQR(false)}
          userId={selectedBill.paidBy._id}
          userName={selectedBill.paidBy.name}
          userImage={selectedBill.paidBy.image}
        />
      )}
    </div>
  );
}
