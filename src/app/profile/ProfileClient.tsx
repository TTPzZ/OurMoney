/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession, signOut } from "next-auth/react";
import { RotateCcw, Save, Upload, LogOut } from "lucide-react";
import { useSWRConfig } from "swr";
import Avatar from "@/components/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { getGroupDetailCachePredicate, type PublicUser } from "@/lib/current-user";
import { useCurrentUser } from "@/lib/use-current-user";
import { updateGeminiKey } from "@/lib/actions/user";

export default function ProfileClient({
  initialUser,
}: {
  initialUser: PublicUser;
}) {
  const { update } = useSession();
  const { mutate } = useSWRConfig();
  const { user } = useCurrentUser(initialUser);
  const [name, setName] = useState(user?.name || initialUser.name);
  const [image, setImage] = useState(user?.image || initialUser.image || "");
  const [imageChanged, setImageChanged] = useState(false);
  const [paymentQR, setPaymentQR] = useState("");
  const [hasPaymentQR, setHasPaymentQR] = useState(user?.hasPaymentQR || initialUser.hasPaymentQR || false);
  const [paymentQRChanged, setPaymentQRChanged] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [hasGeminiKey, setHasGeminiKey] = useState(user?.hasGeminiKey || initialUser.hasGeminiKey || false);
  const [isPending, startTransition] = useTransition();

  const syncProfileCaches = async (nextUser: PublicUser) => {
    setName(nextUser.name);
    setImage(nextUser.image || "");
    setHasGeminiKey(nextUser.hasGeminiKey || false);
    setHasPaymentQR(nextUser.hasPaymentQR || false);
    setImageChanged(false);
    setPaymentQRChanged(false);

    await update({ name: nextUser.name, image: nextUser.image });
    await mutate("/api/me", { user: nextUser }, { revalidate: false });
    await mutate("/api/me");
    await mutate("/api/groups");
    await mutate(getGroupDetailCachePredicate());
  };

  const patchProfile = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      user?: PublicUser;
      error?: string;
    };

    if (!response.ok || !payload.user) {
      throw new Error(payload.error || "Không thể cập nhật hồ sơ");
    }

    return payload.user;
  };

  useEffect(() => {
    if (!user || isPending) return;
    setName(user.name);
    setImage(user.image || "");
    setHasGeminiKey(user.hasGeminiKey || false);
    setHasPaymentQR(user.hasPaymentQR || false);
    setImageChanged(false);
    setPaymentQRChanged(false);
  }, [user, isPending]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Kích thước ảnh tối đa là 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setImageChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Kích thước ảnh tối đa là 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentQR(reader.result as string);
      setPaymentQRChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = () => {
    startTransition(async () => {
      try {
        const trimmedName = name.trim();
        if (!trimmedName) {
          alert("Tên hiển thị là bắt buộc.");
          return;
        }

        const updateBody: Record<string, unknown> = {};
        if (trimmedName !== (user?.name || initialUser.name)) {
          updateBody.name = trimmedName;
        }
        if (imageChanged) {
          updateBody.image = image;
        }
        if (paymentQRChanged) {
          updateBody.paymentQR = paymentQR;
        }
        if (Object.keys(updateBody).length === 0) {
          alert("Không có thay đổi để lưu.");
          return;
        }

        const nextUser = await patchProfile(updateBody);
        await syncProfileCaches(nextUser);
        alert("Cập nhật thành công!");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
        alert(message);
      }
    });
  };

  const handleResetName = () => {
    startTransition(async () => {
      try {
        const nextUser = await patchProfile({ resetName: true });
        await syncProfileCaches(nextUser);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
        alert(message);
      }
    });
  };

  const handleResetImage = () => {
    startTransition(async () => {
      try {
        const nextUser = await patchProfile({ resetImage: true });
        await syncProfileCaches(nextUser);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
        alert(message);
      }
    });
  };

  const handleResetQR = () => {
    startTransition(async () => {
      try {
        const nextUser = await patchProfile({ resetPaymentQR: true });
        await syncProfileCaches(nextUser);
        setPaymentQR("");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
        alert(message);
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-slate-200">
            <Avatar src={image} name={name || "User"} size={128} />
          </div>
          <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white border-2 border-white shadow-lg cursor-pointer active:scale-95 transition-transform">
            <Upload size={20} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isPending}
            />
          </label>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{name}</h2>
          <p className="text-sm font-medium text-slate-400">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <Input
            label="Tên hiển thị"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            placeholder="Nhập tên của bạn"
          />
        </Card>

        {/* QR Code Section */}
        <div className="pt-4 border-t border-slate-200">
          <SectionTitle title="Mã QR Thanh Toán" />
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Mã QR Ngân Hàng / Ví</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 max-w-[200px]">Dùng để nhận tiền tự động khi tạo hóa đơn hoặc lúc có người trả nợ.</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden">
                  {(paymentQR || hasPaymentQR) ? (
                    <img src={paymentQR || `/api/user/qr?userId=${user?._id}`} alt="QR" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={20} className="text-slate-300" />
                  )}
                </div>
                <label className="absolute inset-0 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQRUpload}
                    disabled={isPending}
                  />
                </label>
              </div>
            </div>
            
            {hasPaymentQR && !paymentQRChanged && (
               <Button
                 variant="outline"
                 onClick={handleResetQR}
                 disabled={isPending}
                 className="w-full text-red-500 border-red-100 bg-red-50"
                 leftIcon={<RotateCcw size={18} />}
               >
                 Xóa mã QR
               </Button>
            )}
          </Card>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-200">
          <SectionTitle title="Hành động" />
          <Button
            onClick={handleUpdate}
            loading={isPending}
            disabled={!name.trim() || (!imageChanged && !paymentQRChanged && name.trim() === (user?.name || initialUser.name))}
            size="xl"
            className="w-full"
            leftIcon={<Save size={24} />}
          >
            Lưu thay đổi
          </Button>
          
          {user?.customName && (
            <Button
              variant="outline"
              onClick={handleResetName}
              disabled={isPending}
              className="w-full"
              leftIcon={<RotateCcw size={18} />}
            >
              Khôi phục tên mặc định
            </Button>
          )}
          
          {user?.customImage && (
            <Button
              variant="outline"
              onClick={handleResetImage}
              disabled={isPending}
              className="w-full"
              leftIcon={<RotateCcw size={18} />}
            >
              Khôi phục ảnh mặc định
            </Button>
          )}
        </div>

        {/* Gemini API Key Section */}
        <div className="pt-4 border-t border-slate-200">
          <SectionTitle title="Gemini API Key" />
          <Card className="p-6 space-y-4">
            <div className="space-y-1">
              <Input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                disabled={isPending}
                placeholder={hasGeminiKey ? "••••••••••••••••" : "Nhập Gemini API Key của bạn"}
              />
              <p className="text-[10px] font-bold text-slate-400">
                Dùng để hỗ trợ đọc hóa đơn khó nhận diện.
              </p>
            </div>
            <Button
              onClick={() => {
                startTransition(async () => {
                  try {
                    if (!geminiKey.trim()) {
                      alert("Vui lòng nhập API Key.");
                      return;
                    }
                    await updateGeminiKey(geminiKey.trim());
                    setGeminiKey("");
                    setHasGeminiKey(true);
                    alert("Đã lưu Gemini API Key!");
                  } catch (err: any) {
                    alert(err.message || "Lỗi khi lưu API Key");
                  }
                });
              }}
              loading={isPending}
              disabled={!geminiKey.trim()}
              variant="outline"
              className="w-full"
            >
              Lưu Key
            </Button>
          </Card>
        </div>
        {/* Logout Section */}
        <div className="pt-4 border-t border-slate-200">
          <SectionTitle title="Tài khoản" />
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/" })}
            disabled={isPending}
            className="w-full text-red-600 border-red-200 hover:bg-red-50 active:bg-red-100"
            leftIcon={<LogOut size={18} />}
          >
            Đăng xuất
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
      {title}
    </h3>
  );
}
