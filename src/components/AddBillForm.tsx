"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, Receipt, Check, Users, CreditCard, Sparkles, X, Plus, Info } from "lucide-react";
import { createBill } from "@/lib/actions/bill";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { useSWRConfig } from "swr";

interface Member {
  _id: string;
  name: string;
  image?: string;
}

interface OCRItem {
  name: string;
  price: number;
  selectedMembers: string[];
}

export default function AddBillForm({ 
  groupId, 
  members, 
  currentUserId 
}: { 
  groupId: string; 
  members: Member[]; 
  currentUserId: string;
}) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(members.map(m => m._id));
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const [ocrItems, setOcrItems] = useState<OCRItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Auto-calculate equal splits
  const equalSplits = useMemo(() => {
    if (splitType !== "equal" || !totalAmount || selectedParticipants.length === 0) return {};
    
    const amount = Number(totalAmount);
    const perPerson = Math.floor((amount / selectedParticipants.length));
    const splits: Record<string, number> = {};
    
    let sum = 0;
    selectedParticipants.forEach((id, index) => {
      if (index === selectedParticipants.length - 1) {
        splits[id] = amount - sum;
      } else {
        splits[id] = perPerson;
        sum += perPerson;
      }
    });
    return splits;
  }, [totalAmount, selectedParticipants, splitType]);

  const currentSplits = splitType === "equal" ? equalSplits : customAmounts;
  
  const customTotal = useMemo(() => {
    return Object.values(customAmounts).reduce((a, b) => a + b, 0);
  }, [customAmounts]);

  const isValid = useMemo(() => {
    if (!description || !totalAmount || selectedParticipants.length === 0) return false;
    if (splitType === "custom") {
      return Math.abs(customTotal - Number(totalAmount)) < 100; // Allow small rounding error
    }
    return true;
  }, [description, totalAmount, selectedParticipants, splitType, customTotal]);

  const handleParticipantToggle = (id: string) => {
    setSelectedParticipants(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCustomAmountChange = (id: string, amount: string) => {
    const val = parseInt(amount) || 0;
    setCustomAmounts(prev => ({ ...prev, [id]: val }));
  };

  const handleScanBill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch("/api/ocr", {
            method: "POST",
            body: JSON.stringify({ imageBase64: base64 }),
          });
          const data = await res.json();
          
          if (data.items && Array.isArray(data.items)) {
            const newOcrItems = data.items.map((item: { name: string, price: number }) => ({
              name: item.name,
              price: item.price,
              selectedMembers: [...selectedParticipants]
            }));
            setOcrItems(newOcrItems);
            
            const sum = data.items.reduce((acc: number, item: { price: number }) => acc + item.price, 0);
            setTotalAmount(sum);
            if (!description) setDescription("Hóa đơn ăn uống ✨");
            
            setSplitType("custom");
            const newAmounts: Record<string, number> = {};
            members.forEach(m => newAmounts[m._id] = 0);
            
            newOcrItems.forEach((item: OCRItem) => {
              if (item.selectedMembers.length > 0) {
                const splitPrice = Math.floor(item.price / item.selectedMembers.length);
                item.selectedMembers.forEach((id: string) => {
                  newAmounts[id] += splitPrice;
                });
              }
            });
            setCustomAmounts(newAmounts);
          } else {
            setError(data.error || "Không thể nhận diện hóa đơn");
          }
        } catch {
          setError("Lỗi kết nối AI");
        } finally {
          setIsScanning(false);
        }
      };
    } catch {
      setError("Lỗi khi đọc file");
      setIsScanning(false);
    }
  };

  const handleOcrItemMemberToggle = (idx: number, memberId: string) => {
    const newItems = [...ocrItems];
    const item = newItems[idx];
    const isSelected = item.selectedMembers.includes(memberId);
    
    if (isSelected) {
      item.selectedMembers = item.selectedMembers.filter(id => id !== memberId);
    } else {
      item.selectedMembers.push(memberId);
    }
    setOcrItems(newItems);

    const newAmounts: Record<string, number> = {};
    members.forEach(m => newAmounts[m._id] = 0);
    
    newItems.forEach((i: OCRItem) => {
      if (i.selectedMembers.length > 0) {
        const splitPrice = Math.floor(i.price / i.selectedMembers.length);
        i.selectedMembers.forEach(id => {
          newAmounts[id] += splitPrice;
        });
      }
    });
    setCustomAmounts(newAmounts);
    setSplitType("custom");
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsPending(true);
    setError("");

    try {
      const splits = selectedParticipants.map(id => ({
        userId: id,
        amount: currentSplits[id] || 0
      }));

      await createBill(groupId, {
        description,
        totalAmount: Number(totalAmount),
        paidBy,
        splits
      });

      mutate(`/api/groups/${groupId}`);
      mutate("/api/groups");
      router.push(`/group/${groupId}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
      setError(errorMsg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-center">
        <div className="w-full max-w-md flex justify-between items-center">
          <Link href={`/group/${groupId}`} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-base font-black text-slate-900 uppercase tracking-widest">Thêm hóa đơn</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="w-full max-w-md px-6 pt-8 pb-36 space-y-10">
        {/* Main Info Card */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <label className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl text-[10px] font-black cursor-pointer active:scale-95 transition-all shadow-sm uppercase tracking-wider">
              <Sparkles size={14} className={isScanning ? "animate-pulse" : ""} />
              {isScanning ? "Đang quét..." : "Quét AI ✨"}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanBill} disabled={isScanning} />
            </label>
          </div>

          <div className="space-y-6 pt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-1">Nội dung chi tiêu</label>
              <input
                type="text"
                placeholder="Ăn sáng, cafe, taxi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-2xl font-black text-slate-900 placeholder:text-slate-200"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-1">Số tiền (VND)</label>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-indigo-600">₫</span>
                <input
                  type="number"
                  placeholder="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-transparent border-none outline-none text-5xl font-black text-slate-900 placeholder:text-slate-100 tracking-tighter"
                />
              </div>
            </div>
          </div>
        </section>

        {/* AI Line Items */}
        {ocrItems.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-500" />
                Chi tiết bóc tách AI
              </h3>
              <button onClick={() => setOcrItems([])} className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">Xóa hết</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {ocrItems.map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm leading-tight pr-4">{item.name}</span>
                    <span className="font-black text-indigo-600 text-sm">₫{item.price.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {members.map(member => {
                      const isSelected = item.selectedMembers.includes(member._id);
                      return (
                        <button
                          key={member._id}
                          onClick={() => handleOcrItemMemberToggle(idx, member._id)}
                          className={`relative w-10 h-10 rounded-full border-2 shrink-0 transition-all ${
                            isSelected ? "border-indigo-600 scale-110 z-10" : "border-transparent opacity-30 grayscale"
                          }`}
                        >
                          <Avatar src={member.image} name={member.name} size={40} className="rounded-full" />
                          {isSelected && <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center border border-white"><Check size={10} className="text-white" /></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Paid By Selection */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Ai là người trả?</h3>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {members.map((member) => (
              <button
                key={member._id}
                onClick={() => setPaidBy(member._id)}
                className={`flex flex-col items-center gap-2 p-2 rounded-3xl border-2 transition-all shrink-0 min-w-[80px] ${
                  paidBy === member._id 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105" 
                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm">
                  <Avatar src={member.image} name={member.name} size={48} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter truncate w-16 text-center">{member.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Split Logic */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phân chia hóa đơn</h3>
            <div className="flex bg-slate-200/50 p-1 rounded-xl">
              <button
                onClick={() => setSplitType("equal")}
                className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                  splitType === "equal" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                }`}
              >
                Đều
              </button>
              <button
                onClick={() => setSplitType("custom")}
                className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                  splitType === "custom" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                }`}
              >
                Tùy ý
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
            {members.map((member) => {
              const isSelected = selectedParticipants.includes(member._id);
              return (
                <div key={member._id} className={`flex items-center justify-between p-5 transition-colors ${isSelected ? "bg-white" : "bg-slate-50/30"}`}>
                  <button
                    onClick={() => handleParticipantToggle(member._id)}
                    className="flex items-center gap-4 flex-1 text-left group"
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isSelected ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" : "border-slate-200 group-hover:border-slate-300"
                    }`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100">
                        <Avatar src={member.image} name={member.name} size={32} />
                      </div>
                      <span className={`font-bold text-sm ${isSelected ? "text-slate-900" : "text-slate-300"}`}>
                        {member.name}
                      </span>
                    </div>
                  </button>

                  {isSelected && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                      {splitType === "equal" ? (
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-slate-900">
                            ₫{currentSplits[member._id]?.toLocaleString() || 0}
                          </span>
                        </div>
                      ) : (
                        <div className="relative flex items-center">
                           <span className="absolute left-3 text-[10px] font-black text-indigo-400">₫</span>
                           <input
                            type="number"
                            placeholder="0"
                            value={customAmounts[member._id] || ""}
                            onChange={(e) => handleCustomAmountChange(member._id, e.target.value)}
                            className="w-28 text-right bg-indigo-50 pl-6 pr-3 py-2 rounded-xl outline-none font-black text-indigo-600 text-sm focus:ring-2 focus:ring-indigo-100 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {splitType === "custom" && (
            <div className="px-4 py-2 flex justify-between items-center bg-slate-900/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Info size={14} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Đã chia: ₫{customTotal.toLocaleString()}</span>
              </div>
              <p className={`text-xs font-black uppercase tracking-tighter ${Math.abs(customTotal - Number(totalAmount)) < 100 ? "text-emerald-500" : "text-rose-500"}`}>
                {Math.abs(customTotal - Number(totalAmount)) < 100 ? "✓ Hợp lệ" : `Thiếu ₫${(Number(totalAmount) - customTotal).toLocaleString()}`}
              </p>
            </div>
          )}
        </section>

        {error && (
          <div className="bg-rose-50 text-rose-500 p-4 rounded-2xl text-xs font-bold text-center border border-rose-100 animate-bounce">
            {error}
          </div>
        )}
      </main>

      {/* Fixed Action Button */}
      <div className="fixed bottom-8 w-full max-w-md px-6 z-40">
        <button
          onClick={handleSubmit}
          disabled={!isValid || isPending}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-slate-300 active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100 hover:bg-slate-800"
        >
          {isPending ? (
            <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Check size={24} />
              XÁC NHẬN HÓA ĐƠN
            </>
          )}
        </button>
      </div>
    </div>
  );
}
