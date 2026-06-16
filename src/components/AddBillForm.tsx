"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, Receipt, Check, Users, CreditCard, Sparkles } from "lucide-react";
import { createBill } from "@/lib/actions/bill";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { useSWRConfig } from "swr";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import Tesseract from 'tesseract.js';

interface Member {
  _id: string;
  name: string;
  image?: string | null;
}

interface OCRItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedMembers: string[];
}

function parseRawText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let totalAmount = 0;
  const items: any[] = [];
  let merchant = "Hóa đơn mới";

  if (lines.length > 0) merchant = lines[0];

  const totalPatterns = [
    /(?:TỔNG|TONG|TOTAL|THANH TOAN|CỘNG|CONG)[:\s]+([\d.,]+)/i,
    /([\d.,]+)\s*(?:VNĐ|VND|Đ|D)/i,
  ];

  for (const line of lines) {
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        const value = parseInt(match[1].replace(/[.,]/g, ''));
        if (value > totalAmount) totalAmount = value;
      }
    }

    const itemMatch = line.match(/^(.+?)\s+([\d.,]+)$/);
    if (itemMatch) {
      const name = itemMatch[1].trim();
      const price = parseInt(itemMatch[2].replace(/[.,]/g, ''));
      if (price > 1000 && price < totalAmount && !line.toLowerCase().includes('tổng')) {
        items.push({
          name,
          quantity: 1,
          unitPrice: price,
          totalPrice: price
        });
      }
    }
  }

  return { merchant, totalAmount, items };
}

export default function AddBillForm({ 
  groupId, 
  members, 
  currentUserId,
  onSuccess,
  onCancel,
  isModal = false
}: { 
  groupId: string; 
  members: Member[]; 
  currentUserId: string;
  onSuccess?: () => void | Promise<void>;
  onCancel?: () => void;
  isModal?: boolean;
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
  const [scanSource, setScanSource] = useState<'ocr' | 'ai' | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);

  const waitForNextPaint = () => {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  };

  // Auto-calculate equal splits
  const equalSplits = useMemo(() => {
    if (splitType !== "equal" || !totalAmount || selectedParticipants.length === 0) return {};
    
    const amount = Number(totalAmount);
    const perPerson = Math.floor((amount / selectedParticipants.length) * 100) / 100;
    const splits: Record<string, number> = {};
    
    let sum = 0;
    selectedParticipants.forEach((id, index) => {
      if (index === selectedParticipants.length - 1) {
        splits[id] = Math.round((amount - sum) * 100) / 100;
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
      return Math.abs(customTotal - Number(totalAmount)) < 10; // Allow small rounding error up to 10 VND
    }
    return true;
  }, [description, totalAmount, selectedParticipants, splitType, customTotal]);
  
  const handleParticipantToggle = (id: string) => {
    setSelectedParticipants(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCustomAmountChange = (id: string, amount: string) => {
    const val = parseFloat(amount) || 0;
    setCustomAmounts(prev => ({ ...prev, [id]: val }));
  };

  const handleScanBill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setOcrProgress(0);
    setError("");

    const startTime = Date.now();
    console.log(`[OCR CLIENT] Start processing image. Size: ${(file.size / 1024).toFixed(2)} KB`);

    try {
      // 1. Client-Side Tesseract OCR
      const result = await Tesseract.recognize(file, 'vie+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      const ocrDuration = Date.now() - startTime;
      console.log(`[OCR CLIENT] OCR finished in ${ocrDuration}ms. Extracted text length: ${result.data.text.length}`);

      const ocrResult = parseRawText(result.data.text);
      console.log(`[OCR PARSER] Found ${ocrResult.items.length} items. Total: ${ocrResult.totalAmount}`);

      let finalData = null;

      // 2. Success check (Total found and at least 1 item)
      if (ocrResult.totalAmount > 0 && ocrResult.items.length > 0) {
        finalData = { ...ocrResult, scanSource: 'ocr' };
      } else {
        // 3. Fallback to Gemini
        console.log("[OCR CLIENT] Local OCR failed or insufficient, falling back to AI...");
        const reader = new FileReader();
        
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const base64 = await base64Promise;
        const res = await fetch("/api/ocr", {
          method: "POST",
          body: JSON.stringify({ imageBase64: base64 }),
        });

        const aiData = await res.json();
        if (res.ok) {
          finalData = aiData;
        } else {
          throw new Error(aiData.error || "Không thể nhận diện hóa đơn");
        }
      }

      if (finalData && finalData.items && Array.isArray(finalData.items)) {
        const newOcrItems = finalData.items.map((item: any) => ({
          ...item,
          selectedMembers: selectedParticipants
        }));
        setOcrItems(newOcrItems);
        setScanSource(finalData.scanSource || null);
        
        if (!totalAmount) {
          setTotalAmount(finalData.totalAmount || 0);
        }
        if (!description || description === "" || description === "Hóa đơn từ AI" || description === "Hóa đơn mới") {
          setDescription(finalData.merchant || "Hóa đơn mới");
        }
        
        setSplitType("custom");
        const newAmounts: Record<string, number> = {};
        members.forEach(m => newAmounts[m._id] = 0);
        
        newOcrItems.forEach((item: OCRItem) => {
          if (item.selectedMembers.length > 0) {
            const splitPrice = item.totalPrice / item.selectedMembers.length;
            item.selectedMembers.forEach((id: string) => {
              newAmounts[id] += splitPrice;
            });
          }
        });
        
        Object.keys(newAmounts).forEach(id => {
          newAmounts[id] = Math.round(newAmounts[id]);
        });
        setCustomAmounts(newAmounts);
      }
    } catch (err: any) {
      console.error("[OCR CLIENT] Error:", err);
      setError(err.message || "Lỗi khi quét hóa đơn");
    } finally {
      setIsScanning(false);
      setOcrProgress(0);
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

    // Recalculate custom amounts whenever an OCR item split changes
    const newAmounts: Record<string, number> = {};
    members.forEach(m => newAmounts[m._id] = 0);
    
    newItems.forEach((i: OCRItem) => {
      if (i.selectedMembers.length > 0) {
        const splitPrice = i.totalPrice / i.selectedMembers.length;
        i.selectedMembers.forEach(id => {
          newAmounts[id] += splitPrice;
        });
      }
    });
    
    Object.keys(newAmounts).forEach(id => {
      newAmounts[id] = Math.round(newAmounts[id]);
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
        splits,
        scanSource
      });

      if (onSuccess) {
        // If onSuccess is provided, we assume the parent (GroupClient) will handle the mutation
        await onSuccess();
        await waitForNextPaint();
      } else {
        // Fallback for standalone page, but even here we should be targeted
        await mutate(`/api/groups/${groupId}`);
        // Background refresh for other keys
        mutate("/api/groups");
        router.push(`/group/${groupId}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
      setError(errorMsg);
    } finally {
      setIsPending(false);
    }
  };

  const Container = isModal ? "div" : "main";

  return (
    <Container className={`${isModal ? "" : "min-h-screen"} bg-slate-50 flex flex-col items-center p-4 pb-32`}>
      {/* Header - Only show if not in modal */}
      {!isModal && (
        <div className="w-full max-w-md flex justify-between items-center mb-6 pt-4">
          <Link 
            href={`/group/${groupId}`} 
            onClick={(e) => {
              if (onCancel) {
                e.preventDefault();
                onCancel();
              }
            }}
            className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 active:scale-95 transition-transform"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Thêm hóa đơn</h1>
          <div className="w-10"></div>
        </div>
      )}

      <div className={`w-full ${isModal ? "" : "max-w-md"} space-y-6`}>
        
        {/* Info Header with AI Button */}
        <div className="flex justify-between items-center px-1">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Receipt size={16} />
            Thông tin hóa đơn
          </h2>
          <label className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-transform shadow-sm border border-indigo-100">
            <Sparkles size={14} className={isScanning ? "animate-spin" : ""} />
            {isScanning ? (ocrProgress > 0 ? `Đang quét... ${ocrProgress}%` : "Đang chuẩn bị...") : "Quét hóa đơn ✨"}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanBill} disabled={isScanning} />
          </label>
        </div>

        {/* Step 1: Info */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
              <Receipt size={20} />
            </div>
            <input
              type="text"
              placeholder="Nội dung (ví dụ: Ăn trưa)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-0 bg-transparent text-base font-medium text-slate-900 placeholder:text-slate-400 outline-none sm:text-lg"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black shrink-0">
              ₫
            </div>
            <input
              type="number"
              placeholder="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border-0 bg-transparent text-2xl font-bold text-slate-900 placeholder:text-slate-400 outline-none sm:text-3xl"
            />
          </div>
        </Card>

        {/* AI Line Items Section */}
        {ocrItems.length > 0 && (
          <Section title="Chi tiết hóa đơn" icon={<Sparkles size={16} />}>
            <div className="space-y-3">
              {ocrItems.map((item, idx) => (
                <Card key={idx} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        {item.quantity} x ₫{item.unitPrice.toLocaleString()}
                      </p>
                    </div>
                    <span className="font-black text-indigo-600 shrink-0">₫{item.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-50">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Ai đã dùng món này?</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {members.map(member => {
                        const isSelected = item.selectedMembers.includes(member._id);
                        return (
                          <button
                            key={member._id}
                            onClick={() => handleOcrItemMemberToggle(idx, member._id)}
                            className={`w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 transition-all ${
                              isSelected ? "border-indigo-600 opacity-100 scale-110 shadow-sm" : "border-transparent opacity-40 grayscale"
                            }`}
                          >
                            <Avatar src={member.image} name={member.name} size={40} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Step 2: Paid By */}
        <Section title="Người trả tiền" icon={<CreditCard size={16} />}>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
            {members.map((member) => (
              <button
                key={member._id}
                onClick={() => setPaidBy(member._id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all shrink-0 active:scale-95 ${
                  paidBy === member._id 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                    : "bg-white border-slate-100 text-slate-700 font-medium"
                }`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200">
                  <Avatar src={member.image} name={member.name} size={24} />
                </div>
                <span className="text-sm font-bold">{member.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Step 3: Participants & Split */}
        <Section 
          title="Cùng tham gia" 
          icon={<Users size={16} />}
          action={
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setSplitType("equal")}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                  splitType === "equal" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                }`}
              >
                Chia đều
              </button>
              <button
                onClick={() => setSplitType("custom")}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                  splitType === "custom" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                }`}
              >
                Tùy chỉnh
              </button>
            </div>
          }
        >
          <Card className="overflow-hidden divide-y divide-slate-50">
            {members.map((member) => {
              const isSelected = selectedParticipants.includes(member._id);
              return (
                <div key={member._id} className="flex items-center justify-between p-4">
                  <button
                    onClick={() => handleParticipantToggle(member._id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200"
                    }`}>
                      {isSelected && <Check size={14} />}
                    </div>
                    <span className={`font-bold text-sm ${isSelected ? "text-slate-900" : "text-slate-300"}`}>
                      {member.name}
                    </span>
                  </button>

                  {isSelected && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-300">₫</span>
                      {splitType === "equal" ? (
                        <span className="text-sm font-black text-slate-900">
                          {currentSplits[member._id]?.toLocaleString() || 0}
                        </span>
                      ) : (
                        <input
                          type="number"
                          placeholder="0"
                          value={customAmounts[member._id] || ""}
                          onChange={(e) => handleCustomAmountChange(member._id, e.target.value)}
                          className="w-24 text-right bg-white px-2 py-1 rounded-lg outline-none font-black text-indigo-600 placeholder:text-slate-400 text-sm border border-indigo-100"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
          
          {splitType === "custom" && (
            <div className="px-4 py-2 flex justify-between items-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đã chia: ₫{customTotal.toLocaleString()}</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${Math.abs(customTotal - Number(totalAmount)) < 10 ? "text-emerald-500" : "text-red-500"}`}>
                Còn lại: ₫{(Number(totalAmount) - customTotal).toLocaleString()}
              </p>
            </div>
          )}
        </Section>

        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
      </div>

      {/* Action Button */}
      <div className="mt-8 w-full z-10">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isPending}
          size="xl"
          className="w-full shadow-2xl"
          loading={isPending}
          loadingText="Đang lưu..."
        >
          Xác nhận
        </Button>
      </div>
    </Container>
  );
}
