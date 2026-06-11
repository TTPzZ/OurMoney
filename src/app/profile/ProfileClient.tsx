"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Save, Upload } from "lucide-react";
import { useSWRConfig } from "swr";
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
        const response = await fetch("/api/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            ...(imageChanged ? { image } : {}),
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          user?: PublicUser;
          error?: string;
        };

        if (!response.ok || !payload.user) {
          throw new Error(payload.error || "Không thể cập nhật hồ sơ");
        }

        setName(payload.user.name);
        setImage(payload.user.image || "");
        setImageChanged(false);

        await update({ name: payload.user.name, image: payload.user.image });
        await mutate("/api/me", { user: payload.user }, { revalidate: false });
        await mutate("/api/me");
        await mutate("/api/groups");
        await mutate(getGroupDetailCachePredicate());

        alert("Cập nhật thành công!");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
        alert(message);
      }
    });
  };

  const displayImage = image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random`;

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-200">
            <Image
              src={displayImage}
              alt="Avatar"
              width={128}
              height={128}
              className="object-cover w-full h-full"
            />
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
            onClick={handleUpdate}
            disabled={isPending || !name.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
          >
            <Save size={24} />
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
