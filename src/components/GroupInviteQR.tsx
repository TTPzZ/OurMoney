"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Share2 } from "lucide-react";

export default function GroupInviteQR({ inviteCode, groupName }: { inviteCode: string; groupName: string }) {
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const inviteUrl = isMounted ? `${window.location.origin}/join/${inviteCode}` : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tham gia nhóm ${groupName} trên OurMoney`,
          text: `Hãy tham gia nhóm "${groupName}" để chúng ta cùng chia sẻ hóa đơn nhé!`,
          url: inviteUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      copyToClipboard();
    }
  };

  if (!isMounted) return null;

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center space-y-6">
      <div className="text-center">
        <h3 className="font-bold text-gray-900">Mời bằng QR</h3>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Quét QR hoặc sao chép link để vào nhóm</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border-4 border-indigo-50 shadow-inner flex flex-col items-center">
        <QRCodeSVG
          value={inviteUrl}
          size={160}
          level="H"
          includeMargin={false}
        />
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={copyToClipboard}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-600 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all"
        >
          {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
          {copied ? "Đã chép" : "Sao chép link"}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all"
        >
          <Share2 size={18} />
          Chia sẻ
        </button>
      </div>
    </div>
  );
}
