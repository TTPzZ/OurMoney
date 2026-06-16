"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { RotateCcw, Save, Upload } from "lucide-react";
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
  hasGeminiKey: initialHasGeminiKey,
}: {
  initialUser: PublicUser;
  hasGeminiKey: boolean;
}) {
  const { update } = useSession();
  const { mutate } = useSWRConfig();
  const { user } = useCurrentUser(initialUser);
  const [name, setName] = useState(initialUser.name);
  const [image, setImage] = useState(initialUser.image || "");
  const [imageChanged, setImageChanged] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [hasGeminiKey, setHasGeminiKey] = useState(initialHasGeminiKey);
  const [isPending, startTransition] = useTransition();

  const syncProfileCaches = async (nextUser: PublicUser) => {
    setName(nextUser.name);
    setImage(nextUser.image || "");
    setImageChanged(false);

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
    // Sync the editable form after /api/me replaces the session fallback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(user.name);
    setImage(user.image || "");
    setImageChanged(false);
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

        <div className="space-y-3">
          <Button
            onClick={handleUpdate}
            loading={isPending}
            disabled={!name.trim()}
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
