"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { RotateCcw, Save, Upload } from "lucide-react";
import { useSWRConfig } from "swr";
import Avatar from "@/components/Avatar";
import { getGroupDetailCachePredicate, type PublicUser } from "@/lib/current-user";
import { useCurrentUser } from "@/lib/use-current-user";

export default function ProfileClient({
  initialUser,
}: {
  initialUser: PublicUser;
}) {
  const { update } = useSession();
  const { mutate } = useSWRConfig();
  const { user } = useCurrentUser(initialUser);
  const [name, setName] = useState(initialUser.name);
  const [image, setImage] = useState(initialUser.image || "");
  const [imageChanged, setImageChanged] = useState(false);
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
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-200">
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
          <h2 className="text-2xl font-black text-gray-900">{name}</h2>
          <p className="text-sm font-medium text-gray-400">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tên hiển thị</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                className="w-full bg-white text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-colors font-bold disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                placeholder="Nhập tên của bạn"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isPending || !name.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
          >
            <Save size={24} />
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          {user?.customName && (
            <button
              type="button"
              onClick={handleResetName}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-600 py-3 rounded-2xl font-bold text-sm shadow-sm border border-gray-100 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              <RotateCcw size={18} />
              Khôi phục tên mặc định
            </button>
          )}
          {user?.customImage && (
            <button
              type="button"
              onClick={handleResetImage}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-600 py-3 rounded-2xl font-bold text-sm shadow-sm border border-gray-100 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              <RotateCcw size={18} />
              Khôi phục ảnh mặc định
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
