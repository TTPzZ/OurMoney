"use client";

import { QRCodeSVG } from "qrcode.react";
import { Share2, Copy, Check, QrCode } from "lucide-react";
import { useState, useEffect } from "react";

export default function GroupInviteQR({ inviteCode, groupName }: { inviteCode: string, groupName: string }) {
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const inviteUrl = isMounted ? `${window.location.origin}/join/${inviteCode}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tham gia nhóm ${groupName} trên OurMoney`,
          text: `Cùng chia sẻ chi tiêu trong nhóm "${groupName}" nhé!`,
          url: inviteUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
           <QrCode size={12} />
           Mời bạn bè
        </div>
        <h3 className="text-lg font-black text-slate-900 leading-tight">Chia sẻ quyền tham gia</h3>
        <p className="text-xs text-slate-400 font-medium max-w-[200px]">Bạn bè chỉ cần quét mã hoặc nhập mã để vào nhóm.</p>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-50 shadow-inner flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <div className="bg-white p-2 rounded-xl shadow-sm">
          <QRCodeSVG 
            value={inviteUrl} 
            size={180} 
            level="H"
            includeMargin={false}
          />
        </div>
        <div className="mt-6 pt-5 border-t border-slate-50 w-full text-center space-y-1">
          <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">Mã tham gia</p>
          <p className="text-2xl font-black text-indigo-600 tracking-[0.2em] ml-2">{inviteCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 bg-slate-50 text-slate-600 py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider active:scale-95 transition-all hover:bg-slate-100 border border-slate-100"
        >
          {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          {copied ? "Đã chép" : "Copy Link"}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg shadow-indigo-100 active:scale-95 transition-all hover:bg-indigo-700"
        >
          <Share2 size={16} />
          Chia sẻ
        </button>
      </div>
    </div>
  );
}
