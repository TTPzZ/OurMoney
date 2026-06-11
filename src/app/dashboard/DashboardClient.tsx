"use client";

import { useEffect } from "react";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import { ChevronRight, PlusCircle, Users } from "lucide-react";
import Avatar from "@/components/Avatar";
import CreateGroupModal from "@/components/CreateGroupModal";
import { fetcher } from "@/lib/fetcher";
import type { PublicUser } from "@/lib/current-user";
import type { GroupListItem } from "@/lib/money-types";
import { useCurrentUser } from "@/lib/use-current-user";

export default function DashboardClient({
  initialGroups,
  user,
  onOpenGroup,
}: {
  initialGroups: GroupListItem[];
  user: PublicUser;
  onOpenGroup: (groupId: string) => void;
}) {
  const { cache, mutate } = useSWRConfig();
  const { user: currentUser } = useCurrentUser(user);
  const { data } = useSWR<{ groups: GroupListItem[] }>("/api/groups", fetcher, {
    fallbackData: { groups: initialGroups },
    revalidateOnMount: true,
  });

  const groups = data?.groups || initialGroups;

  useEffect(() => {
    if (!groups?.length) return;

    groups.slice(0, 5).forEach((group) => {
      const key = `/api/groups/${group._id}`;
      if (!cache.get(key)) {
        mutate(key, fetcher(key), {
          revalidate: false,
          populateCache: true,
        });
      }
    });
  }, [groups, mutate, cache]);

  const handlePrefetch = (groupId: string) => {
    const key = `/api/groups/${groupId}`;
    if (!cache.get(key)) {
      mutate(key, fetcher(key), {
        revalidate: false,
        populateCache: true,
      });
    }
  };

  const handleOpenGroup = (groupId: string) => {
    handlePrefetch(groupId);
    onOpenGroup(groupId);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-6 pb-24 w-full">
      <div className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-600">OurMoney</h1>
          <p className="text-gray-500 font-medium tracking-tight">
            Xin chào, {currentUser?.name?.split(" ")[0]}! 👋
          </p>
        </div>
        <Link href="/profile" className="relative active:scale-90 transition-transform">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg bg-gray-200">
            <Avatar src={currentUser?.image} name={currentUser?.name || "U"} size={48} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
        </Link>
      </div>

      <div className="w-full max-w-md space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Nhóm của bạn</h2>

        {groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => (
              <button
                type="button"
                key={group._id}
                onMouseEnter={() => handlePrefetch(group._id)}
                onFocus={() => handlePrefetch(group._id)}
                onClick={() => handleOpenGroup(group._id)}
                className="w-full text-left flex items-center justify-between bg-white p-5 rounded-3xl border border-gray-100 shadow-sm active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{group.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                      {group.members.length} thành viên
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300" size={20} />
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-gray-200">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-400 font-medium">Bạn chưa tham gia nhóm nào.</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-8 w-full max-w-md px-6 flex justify-center">
        <CreateGroupModal onOpenGroup={onOpenGroup} />
      </div>
    </main>
  );
}
