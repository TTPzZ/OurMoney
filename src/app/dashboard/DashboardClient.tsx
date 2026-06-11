"use client";

import { useSWRConfig } from "swr";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useEffect } from "react";
import Link from "next/link";
import { Users, ChevronRight, PlusCircle } from "lucide-react";
import CreateGroupModal from "@/components/CreateGroupModal";
import JoinGroupForm from "@/components/JoinGroupForm";
import Avatar from "@/components/Avatar";

interface IGroupListItem {
  _id: string;
  name: string;
  members: string[];
}

export default function DashboardClient({ 
  initialGroups,
  user
}: { 
  initialGroups: IGroupListItem[],
  user: { name?: string | null, image?: string | null }
}) {
  const { cache, mutate } = useSWRConfig();
  const { data } = useSWR<{ groups: IGroupListItem[] }>("/api/groups", fetcher, {
    fallbackData: { groups: initialGroups },
    revalidateOnMount: true,
  });

  const groups = data?.groups || initialGroups;

  // Prefetch top 5 groups
  useEffect(() => {
    if (!groups?.length) return;
    
    groups.slice(0, 5).forEach((group) => {
      const key = `/api/groups/${group._id}`;
      // Check if already in cache or being fetched
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

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-6 pb-24 w-full">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-600">OurMoney</h1>
          <p className="text-gray-500 font-medium tracking-tight">Xin chào, {user.name?.split(' ')[0]}! 👋</p>
        </div>
        <Link href="/profile" className="relative active:scale-90 transition-transform">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg bg-gray-200">
            <Avatar src={user.image} name={user.name || "U"} size={48} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
        </Link>
      </div>

      {/* Join Group Section */}
      <div className="w-full max-w-md mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1 mb-3">Tham gia bằng mã</h2>
        <JoinGroupForm />
      </div>

      {/* Group List */}
      <div className="w-full max-w-md space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Nhóm của bạn</h2>
        
        {groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link
                key={group._id}
                href={`/group/${group._id}`}
                onMouseEnter={() => handlePrefetch(group._id)}
                className="flex items-center justify-between bg-white p-5 rounded-3xl border border-gray-100 shadow-sm active:scale-95 transition-all"
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
              </Link>
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

      {/* Floating Action Button / Fixed Bottom */}
      <div className="fixed bottom-8 w-full max-w-md px-6 flex justify-center">
        <CreateGroupModal />
      </div>
    </main>
  );
}
