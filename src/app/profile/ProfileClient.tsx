"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { RotateCcw, Save, Upload, User, Mail, ShieldCheck } from "lucide-react";
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
    <div className="w-full space-y-10">
      {/* Profile Info Header */}
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="h-32 w-32 overflow-hidden rounded-[2.5rem] border-4 border-white bg-slate-100 shadow-2xl dark:border-slate-900 dark:bg-slate-800">
            <Avatar src={image} name={name || "U"} size={128} />
          </div>
          <label className="absolute bottom-0 right-[-10px] flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border-4 border-white bg-primary text-white shadow-xl transition-all hover:bg-indigo-700 active:scale-90 dark:border-slate-900">
            <Upload size={20} strokeWidth={2.5} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isPending}
            />
          </label>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">{name}</h2>
          <div className="flex items-center justify-center gap-1.5 text-slate-400">
            <Mail size={12} />
            <p className="text-[10px] font-bold uppercase tracking-wider">{user?.email || initialUser.email}</p>
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="space-y-6">
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none space-y-8">
          <div className="space-y-4 text-left">
             <div className="flex items-center gap-2 px-1">
                <User size={14} className="text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Profile Details</h3>
             </div>
             
             <div className="space-y-2">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-2xl bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/10 disabled:opacity-50 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-850"
                  placeholder="Enter your name"
                />
             </div>
          </div>

          <div className="pt-6 border-t border-slate-50 dark:border-slate-800 space-y-3">
             <button
                type="button"
                onClick={handleUpdate}
                disabled={isPending || !name.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
              >
                {isPending ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div> : <Save size={18} strokeWidth={2.5} />}
                <span>Save Changes</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                {user?.customName && (
                  <button
                    type="button"
                    onClick={handleResetName}
                    disabled={isPending}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-[10px] font-black uppercase tracking-tighter text-slate-500 transition-all hover:bg-slate-100 active:scale-95 dark:bg-slate-800 dark:text-slate-400"
                  >
                    <RotateCcw size={14} />
                    Reset Name
                  </button>
                )}
                {user?.customImage && (
                  <button
                    type="button"
                    onClick={handleResetImage}
                    disabled={isPending}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-[10px] font-black uppercase tracking-tighter text-slate-500 transition-all hover:bg-slate-100 active:scale-95 dark:bg-slate-800 dark:text-slate-400"
                  >
                    <RotateCcw size={14} />
                    Reset Photo
                  </button>
                )}
              </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/30 flex items-center gap-4">
           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 shrink-0">
              <ShieldCheck size={20} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Account Security</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Your account is verified with Google</p>
           </div>
        </div>
      </div>
    </div>
  );
}
