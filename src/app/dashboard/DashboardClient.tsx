"use client";

import { useSWRConfig } from "swr";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useEffect } from "react";
import Link from "next/link";
import { Users, ChevronRight, PlusCircle, LayoutGrid, Bell, CreditCard } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-lg items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
              <CreditCard size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              OurMoney
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800">
              <Bell size={20} />
            </button>
            <Link 
              href="/profile" 
              className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 pl-1 pr-3 transition-all hover:bg-slate-100 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <Avatar src={user.image} name={user.name || "U"} size={32} />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {user.name?.split(' ')[0]}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg space-y-8 px-6 pb-32 pt-8">
        {/* Welcome Section */}
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Your Groups
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Manage your expenses and split bills.
          </p>
        </div>

        {/* Join Form Section */}
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <LayoutGrid size={16} className="text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Join with Code
            </h3>
          </div>
          <JoinGroupForm />
        </section>

        {/* Group List Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Activity
            </h3>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {groups.length} Total
            </span>
          </div>
          
          {groups.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {groups.map((group) => (
                <Link
                  key={group._id}
                  href={`/group/${group._id}`}
                  onMouseEnter={() => handlePrefetch(group._id)}
                  className="group flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-primary group-hover:text-white dark:bg-indigo-900/20 dark:text-indigo-400">
                      <Users size={28} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <span className="flex -space-x-1">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-4 w-4 rounded-full border-2 border-white bg-slate-200 dark:border-slate-900 dark:bg-slate-800"></div>
                          ))}
                        </span>
                        <span>{group.members.length} members</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-50 p-2 text-slate-300 transition-colors group-hover:bg-indigo-50 group-hover:text-primary dark:bg-slate-800 dark:group-hover:bg-indigo-900/30">
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                <PlusCircle className="h-10 w-10 text-slate-200 dark:text-slate-700" />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">No groups yet</p>
              <p className="mt-1 text-sm font-medium text-slate-400">Create your first group to start splitting bills!</p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-6">
        <CreateGroupModal />
      </div>
    </div>
  );
}
