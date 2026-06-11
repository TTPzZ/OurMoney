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
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-6 pb-24 w-full">
      <div className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-600 tracking-tight">OurMoney</h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Xin chào, {currentUser?.name?.split(" ")[0]}! 👋
          </p>
        </div>
        <Link href="/profile" className="relative active:scale-90 transition-transform">
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
