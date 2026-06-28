/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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

export interface OCRItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedMembers: string[];
}

export function parseRawText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let totalAmount = 0;
  let items: any[] = [];
  let merchant = "Hóa đơn mới";
  let maxConfidence = 0;

  // 1. TỪ KHÓA TỔNG (Fuzzy & Multilingual)
  const totalKeywords = [
    "TỔNG", "TONG", "TNG", "TÔNG", "T0NG", "TOTAL", "TOTL", "T0TAL", "TTAL", "SUM", 
    "THANH TOAN", "THANH TUAN", "TTAN", "CỘNG", "CONG", "SỐ TIỀN", "SO TIN", 
    "TỔNG TIỀN", "TNG TIN", "TỔNG CỘNG", "TIỀN MẶT", "TIEN MAT", "CASH", "TM", "GIAO DỊCH"
  ];
  
  // 2. TỪ KHÓA RÁC (Phone, Date, ID, etc.)
  const ignoreKeywords = [
    "NGÀY", "DATE", "TIME", "GIỜ", "HOTLINE", "TEL", "ĐIỆN THOẠI", "PHONE", "MOBILE", "SDT", "SĐT", "CALL",
    "MÃ HD", "MA HD", "SỐ HD", "BILL NO", "INV", "MÃ VẠCH", "BÀN", "TABLE", "KHÁCH", "GUEST",
    "CHỈ SỐ", "TIÊU THỤ", "M3", "ĐỊNH MỨC", "ĐƠN GIÁ", "VAT", "THUẾ", "PHÍ", "LIÊN HỆ", "CONTACT", "CSKH"
  ];

  interface Candidate {
    value: number;
    score: number;
    lineIdx: number;
  }
  const candidates: Candidate[] = [];
  const rawItems: any[] = [];

  // Regex nhận diện SĐT Việt Nam
  const phoneRegex = /(?:0|\+84|1900|1800)(?:\s?\d){7,10}/g;

  lines.forEach((line, idx) => {
    const originalUpperLine = line.toUpperCase();
    // Chuẩn hóa nhẹ để so khớp keyword (ví dụ: TÔNG -> TỔNG, TIN -> TIỀN)
    const upperLine = originalUpperLine
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Bỏ dấu
      .replace(/0/g, 'O'); 
    
    // 1. DÒ TÌM SỐ TIỀN
    const amountMatch = line.match(/([\d.,\s]{4,})\s*(?:VNĐ|VND|Đ|D|TIN|TÌN|₫)?$/i) || 
                        line.match(/(?:VNĐ|VND|Đ|D|₫)\s*([\d.,\s]{4,})/i);
    
    if (amountMatch) {
      const valStr = amountMatch[1].trim();
      const value = parseInt(valStr.replace(/[.,\s]/g, ''));
      
      const isPhoneLike = phoneRegex.test(line.replace(/[.\-\s]/g, ''));
      const isDatePart = line.includes(`/${valStr}`) || line.includes(`-${valStr}`) || line.includes(`${valStr}/`);

      if (!isNaN(value) && value >= 5000 && value < 100000000 && !isDatePart) {
        let score = 0;
        
        // CỘNG ĐIỂM CHIẾN THUẬT
        const hasTotalKeyword = totalKeywords.some(k => originalUpperLine.includes(k) || upperLine.includes(k));
        
        if (hasTotalKeyword) score += 300; // Bonus cực lớn cho từ khóa Tổng
        
        // Vị trí: Ưu tiên 20% cuối hóa đơn (nơi thường đặt tổng tiền)
        const positionFactor = idx / lines.length;
        if (positionFactor > 0.8) score += 150;
        else if (positionFactor > 0.5) score += 50;

        // Định dạng: Số có dấu phân cách (1.000.000) tin cậy hơn số viết liền (700928)
        if (valStr.includes(".") || valStr.includes(",") || valStr.includes(" ")) score += 100;
        
        if (line.includes("₫") || line.toLowerCase().endsWith("đ") || line.toLowerCase().endsWith("d")) score += 80;

        // TRỪ ĐIỂM (Rác)
        if (ignoreKeywords.some(k => originalUpperLine.includes(k))) score -= 300; 
        if (isPhoneLike) score -= 500;
        if (valStr.length >= 10) score -= 400; 
        if (value >= 2020 && value <= 2030) score -= 400;
        if (line.includes("/") || (line.includes("-") && !hasTotalKeyword) || line.includes(":")) score -= 150;

        candidates.push({ value, score, lineIdx: idx });
      }
    }

    // 2. DÒ TÌM MÓN (ITEM)
    const itemMatch = line.match(/^(.+?)(?:\s+[\d.,]{4,})?\s+([\d., ]{4,})\s*(?:VNĐ|VND|Đ|D|₫)?$/i);
    if (itemMatch) {
      const name = itemMatch[1].trim();
      const price = parseInt(itemMatch[2].replace(/[.,\s]/g, ''));
      
      const isBadItem = ignoreKeywords.some(k => name.toUpperCase().includes(k)) || 
                        name.toUpperCase().includes("M3") || 
                        phoneRegex.test(name.replace(/[.\-\s]/g, '')) ||
                        name.length < 3;

      if (price >= 1000 && !isBadItem && !totalKeywords.some(k => name.toUpperCase().includes(k))) {
        rawItems.push({ name, price, lineIdx: idx });
      }
    }
  });

  // Chọn ứng viên có điểm cao nhất
  candidates.sort((a, b) => b.score - a.score);
  if (candidates.length > 0) {
    totalAmount = candidates[0].value;
    maxConfidence = candidates[0].score;
  }

  // 3. LỌC ITEMS
  items = rawItems
    .filter(it => it.price < totalAmount && it.lineIdx !== candidates[0]?.lineIdx)
    .map(it => ({
      name: it.name,
      quantity: 1,
      unitPrice: it.price,
      totalPrice: it.price
    }));

  // 4. XÁC ĐỊNH MERCHANT
  if (lines.length > 0) {
    const companyLine = lines.find(l => 
      l.toUpperCase().includes("CÔNG TY") || 
      l.toUpperCase().includes("CẤP NƯỚC") ||
      l.toUpperCase().includes("CHI NHÁNH") ||
      l.toUpperCase().includes("NHÀ HÀNG") ||
      l.toUpperCase().includes("COFFEE") ||
      l.toUpperCase().includes("QUÁN") ||
      l.toUpperCase().includes("GIA ĐỊNH")
    );
    merchant = companyLine ? companyLine.replace(/[:\-]/g, "").trim() : lines[0];
    if (merchant.length > 50) merchant = merchant.substring(0, 50) + "...";
  }

  return { merchant, totalAmount, items, confidence: maxConfidence + (items.length * 10) };
}

enum OCRFailureReason {
  NO_TEXT = "NO_TEXT",
  NO_ITEMS = "NO_ITEMS",
  NO_TOTAL = "NO_TOTAL",
  OCR_ERROR = "OCR_ERROR"
}

const OCR_FAILURE_MESSAGES: Record<OCRFailureReason, string> = {
  [OCRFailureReason.NO_TEXT]: "Không phát hiện được chữ trong ảnh. Hãy thử ảnh rõ hơn hoặc dùng Gemini OCR.",
  [OCRFailureReason.NO_ITEMS]: "Đã đọc được văn bản nhưng không nhận diện được món ăn.",
  [OCRFailureReason.NO_TOTAL]: "Không tìm thấy tổng tiền trên hóa đơn.",
  [OCRFailureReason.OCR_ERROR]: "OCR gặp lỗi trong quá trình xử lý ảnh."
};

export const compressImageForUpload = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Không thể khởi tạo canvas context"));

        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Quality 0.6 is good enough for receipts and reduces size drastically (usually < 200KB)
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = () => reject(new Error("Lỗi khi tải ảnh"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Lỗi khi đọc file"));
    reader.readAsDataURL(file);
  });
};

/**
 * Tiền xử lý ảnh nâng cao cho Tesseract OCR
 * Sử dụng Adaptive Thresholding (Ngưỡng thích nghi) để tự động xử lý đổ bóng và ánh sáng không đều
 */
export const preprocessImage = (file: File, manualThreshold: number = 0): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Không thể khởi tạo canvas context"));

        const MAX_DIM = 2000;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // BƯỚC 1: Grayscale và tăng nhẹ Contrast ban đầu
        ctx.filter = 'grayscale(1) contrast(1.2)';
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const widthRes = imageData.width;
        const heightRes = imageData.height;

        // Tạo mảng chứa độ sáng (Grayscale)
        const grayData = new Uint8Array(widthRes * heightRes);
        for (let i = 0; i < data.length; i += 4) {
          grayData[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        // BƯỚC 2: Tính toán Integral Image để tối ưu hóa việc tính trung bình vùng (Moving Average)
        // Đây là kỹ thuật giúp tính Adaptive Threshold cực nhanh (O(1) cho mỗi pixel)
        const integral = new Float64Array(widthRes * heightRes);
        for (let y = 0; y < heightRes; y++) {
          let sum = 0;
          for (let x = 0; x < widthRes; x++) {
            const idx = y * widthRes + x;
            sum += grayData[idx];
            if (y === 0) {
              integral[idx] = sum;
            } else {
              integral[idx] = integral[idx - widthRes] + sum;
            }
          }
        }

        // BƯỚC 3: Adaptive Thresholding & Morphological Dilation (Nở ảnh nhẹ)
        const finalData = new Uint8ClampedArray(grayData.length * 4);
        const s = Math.floor(widthRes / 16);
        const t = manualThreshold > 0 ? manualThreshold / 255 : 0.15;

        for (let y = 0; y < heightRes; y++) {
          for (let x = 0; x < widthRes; x++) {
            const idx = y * widthRes + x;
            const x1 = Math.max(0, x - s / 2);
            const x2 = Math.min(widthRes - 1, x + s / 2);
            const y1 = Math.max(0, y - s / 2);
            const y2 = Math.min(heightRes - 1, y + s / 2);
            
            const count = (x2 - x1) * (y2 - y1);
            const sum = integral[Math.floor(y2 * widthRes + x2)] 
                      - integral[Math.floor(y1 * widthRes + x2)] 
                      - integral[Math.floor(y2 * widthRes + x1)] 
                      + integral[Math.floor(y1 * widthRes + x1)];
            
            // Ngưỡng hóa
            let v = (grayData[idx] * count) < (sum * (1.0 - t)) ? 0 : 255;
            
            // Dilation nhẹ: Nếu pixel hiện tại là trắng nhưng có hàng xóm là đen, 
            // ta "nở" pixel đen ra để nối các nét chữ in kim (dotted text)
            // (Chỉ áp dụng nếu x,y không nằm sát rìa)
            if (v === 255 && x > 0 && y > 0 && x < widthRes - 1 && y < heightRes - 1) {
              if (grayData[idx + 1] < 100 || grayData[idx - 1] < 100 || grayData[idx + widthRes] < 100) {
                 v = 0; // Nở đen
              }
            }

            const outIdx = idx * 4;
            finalData[outIdx] = v;
            finalData[outIdx + 1] = v;
            finalData[outIdx + 2] = v;
            finalData[outIdx + 3] = 255;
          }
        }
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = () => reject(new Error("Lỗi khi tải ảnh"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Lỗi khi đọc file"));
    reader.readAsDataURL(file);
  });
};

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (bill?: any) => void | Promise<void>;
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
  const [scanStatus, setScanStatus] = useState("");
  const [billImage, setBillImage] = useState<string | null>(null);
  const [showScanMenu, setShowScanMenu] = useState(false);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'ocr' | 'ai') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowScanMenu(false);
    setIsScanning(true);
    setOcrProgress(0);
    setScanStatus("Đang chuẩn bị...");
    setError("");

    try {
      // 1. Nén ảnh giữ nguyên màu để lưu trữ, dung lượng cực nhẹ
      const compressedImg = await compressImageForUpload(file); 
      setBillImage(compressedImg);

      let finalData = null;

      if (type === 'ocr') {
        const thresholdTries = [0, 130, 170];
        let bestResult = null;

        for (let i = 0; i < thresholdTries.length; i++) {
          const currentT = thresholdTries[i];
          setScanStatus(`Đang quét OCR (Lần ${i + 1})...`);
          
          const processedImage = await preprocessImage(file, currentT);
          const result = await Tesseract.recognize(processedImage, 'vie', {
            logger: m => {
              if (m.status === 'recognizing text' && i === 0) {
                setOcrProgress(Math.round(m.progress * 100));
              }
            }
          });

          const parsed = parseRawText(result.data.text);
          if (parsed.totalAmount > 0 && parsed.items.length > 0) {
            bestResult = { ...parsed, scanSource: 'ocr' as const };
            break;
          }
          if (!bestResult || parsed.confidence > (bestResult.confidence || -999)) {
            bestResult = { ...parsed, scanSource: 'ocr' as const };
          }
        }
        finalData = bestResult;
      } else {
        // AI OCR
        setScanStatus("Đang gửi ảnh cho AI...");
        const res = await fetch("/api/ocr", {
          method: "POST",
          body: JSON.stringify({ imageBase64: compressedImg }),
        });

        const aiData = await res.json();
        if (res.ok) {
          finalData = { ...aiData, scanSource: 'ai' as const };
        } else {
          throw new Error(aiData.error || "AI không thể nhận diện hóa đơn");
        }
      }

      if (finalData && finalData.items && Array.isArray(finalData.items)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newOcrItems = finalData.items.map((item: any) => ({
          ...item,
          selectedMembers: selectedParticipants
        }));
        setOcrItems(newOcrItems);
        setScanSource(finalData.scanSource || null);
        
        if (!totalAmount) setTotalAmount(finalData.totalAmount || 0);
        if (!description || description === "" || description === "Hóa đơn mới" || description === "Hóa đơn từ AI") {
          setDescription(finalData.merchant || "Hóa đơn mới");
        }

        setScanStatus("Đã quét xong!");
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
      setTimeout(() => setScanStatus(""), 3000);
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
        scanSource,
        imageUrl: billImage || undefined
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
        
        {/* Info Header with AI Selection Menu */}
        <div className="flex justify-between items-center px-1">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Receipt size={16} />
            Thông tin hóa đơn
          </h2>
          
          <div className="relative">
            <button 
              onClick={() => setShowScanMenu(!showScanMenu)}
              disabled={isScanning}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform shadow-lg shadow-indigo-200"
            >
              <Sparkles size={14} className={isScanning ? "animate-spin" : ""} />
              {isScanning ? (ocrProgress > 0 ? `Đang quét... ${ocrProgress}%` : "Đang xử lý...") : "Quét hóa đơn ✨"}
            </button>

            {showScanMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Chọn phương thức</p>
                <label className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                    <Receipt size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-slate-900">Local OCR</p>
                    <p className="text-[9px] text-slate-400">Nhanh, bảo mật, offline</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'ocr')} />
                </label>
                <label className="flex items-center gap-3 px-3 py-3 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <Sparkles size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-indigo-600">Gemini AI</p>
                    <p className="text-[9px] text-indigo-400">Chính xác nhất, cần mạng</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'ai')} />
                </label>
              </div>
            )}
          </div>
        </div>

        {scanStatus && (
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl flex items-center gap-3 animate-pulse">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
            <p className="text-[11px] font-bold text-indigo-600">{scanStatus}</p>
          </div>
        )}

        {/* Image Preview if available */}
        {billImage && (
          <div className="relative group overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-white p-1">
            <img src={billImage} alt="Receipt Preview" className="w-full h-32 object-cover rounded-xl grayscale-[0.5] group-hover:grayscale-0 transition-all" />
            <button 
              onClick={() => setBillImage(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md active:scale-90"
            >
              ×
            </button>
            <div className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 rounded-lg text-[9px] font-bold text-slate-600 backdrop-blur-sm">
              Đã tải ảnh hóa đơn
            </div>
          </div>
        )}

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
