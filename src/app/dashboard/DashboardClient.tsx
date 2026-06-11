"use client";

import { useSWRConfig } from "swr";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useEffect } from "react";
import Link from "next/link";
import { Users, ChevronRight, PlusCircle, LayoutGrid, Search, Bell } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-center">
        <div className="w-full max-w-md flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <LayoutGrid className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">OurMoney</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
            </button>
            <Link href="/profile" className="relative group">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-100 transition-transform group-active:scale-90">
                <Avatar src={user.image} name={user.name || "U"} size={40} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full max-w-md px-6 pt-8 pb-32 space-y-10">
        {/* Welcome Section */}
        <section className="space-y-1">
          <p className="text-slate-400 font-bold uppercase tracking-[0.15em] text-[10px]">Trang chủ</p>
          <h2 className="text-2xl font-black text-slate-900">
            Chào nhé, <span className="text-indigo-600">{user.name?.split(' ')[0]}</span>! 👋
          </h2>
        </section>

        {/* Quick Actions / Join */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Search size={14} className="text-slate-400" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tham gia nhóm</h3>
          </div>
          <JoinGroupForm />
        </section>

        {/* Group List Section */}
        <section className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nhóm của bạn</h3>
            </div>
            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
              {groups.length} Nhóm
            </span>
          </div>
          
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {groups.map((group) => (
                <Link
                  key={group._id}
                  href={`/group/${group._id}`}
                  onMouseEnter={() => handlePrefetch(group._id)}
                  className="group relative flex items-center justify-between bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                      <Users size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{group.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="w-4 h-4 rounded-full border border-white bg-slate-200"></div>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
                          {group.members.length} thành viên
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                    <ChevronRight size={24} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm space-y-4">
              <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-2">
                <PlusCircle className="text-slate-200" size={40} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold">Chưa có nhóm nào</p>
                <p className="text-xs text-slate-400">Hãy tạo nhóm đầu tiên để bắt đầu chia tiền nhé!</p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button Wrapper */}
      <div className="fixed bottom-8 w-full max-w-md px-6 flex justify-center z-40">
        <div className="w-full shadow-2xl shadow-indigo-200 rounded-2xl">
          <CreateGroupModal />
        </div>
      </div>
    </div>
  );
}
