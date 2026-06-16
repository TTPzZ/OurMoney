"use client";

import { useEffect } from "react";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import { ChevronRight, PlusCircle, Users } from "lucide-react";
import Avatar from "@/components/Avatar";
import CreateGroupModal from "@/components/CreateGroupModal";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import { fetcher } from "@/lib/fetcher";
import type { PublicUser } from "@/lib/current-user";
import type { GroupListItem } from "@/lib/money-types";
import { useCurrentUser } from "@/lib/use-current-user";

const GROUPS_CACHE_KEY = "ourmoney_groups_cache";

export default function DashboardClient({
  initialGroups,
  user,
  onOpenGroup,
  onOpenProfile,
}: {
  initialGroups: GroupListItem[];
  user: PublicUser;
  onOpenGroup: (groupId: string) => void;
  onOpenProfile: () => void;
}) {
  const { cache, mutate } = useSWRConfig();
  const { user: currentUser } = useCurrentUser(user);

  // Load from localStorage on mount for instant UI
  const getCachedGroups = () => {
    if (typeof window === "undefined") return initialGroups;
    try {
      const cached = localStorage.getItem(GROUPS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.data || initialGroups;
      }
    } catch (e) {
      console.error("Failed to load groups from cache", e);
    }
    return initialGroups;
  };

  const { data } = useSWR<{ groups: GroupListItem[] }>("/api/groups", fetcher, {
    fallbackData: { groups: getCachedGroups() },
    revalidateOnMount: true,
    onSuccess: (newData) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(GROUPS_CACHE_KEY, JSON.stringify({
          data: newData.groups,
          cachedAt: Date.now()
        }));
      }
    }
  });

  const groups = data?.groups || initialGroups;

  useEffect(() => {
    // Phase 2: Removed aggressive group detail preload to prevent request storm.
    // Dashboard should only focus on showing the group list.
  }, [groups]);

  const handleOpenGroup = (groupId: string) => {
    onOpenGroup(groupId);
  };

  const handleOpenProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenProfile();
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-6 pb-24 w-full">
      <div className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-600 tracking-tight">OurMoney</h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Xin chào, {currentUser?.name?.split(" ")[0]}! 👋
          </p>
        </div>
        <Link 
          href="/profile" 
          onClick={handleOpenProfile}
          className="relative active:scale-90 transition-transform"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xl bg-slate-200">
            <Avatar src={currentUser?.image} name={currentUser?.name || "U"} size={48} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
        </Link>
      </div>

      <div className="w-full max-w-md space-y-6">
        <Section title="Nhóm của bạn" icon={<Users size={16} />}>
          {groups.length > 0 ? (
            <div className="space-y-3">
              {groups.map((group) => (
                <Card
                  key={group._id}
                  onClick={() => handleOpenGroup(group._id)}
                  className="p-5"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Users size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 leading-tight">{group.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {group.members.length} thành viên
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300" size={20} />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-200">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusCircle className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-400 font-medium text-sm">Bạn chưa tham gia nhóm nào.</p>
            </div>
          )}
        </Section>
      </div>

      <div className="fixed bottom-8 w-full max-w-md px-6 flex justify-center">
        <CreateGroupModal onOpenGroup={onOpenGroup} />
      </div>
    </main>
  );
}
