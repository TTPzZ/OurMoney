"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { simplifyDebts, type Bill } from "@/lib/utils/debt";
import GroupInviteQR from "@/components/GroupInviteQR";
import Link from "next/link";
import { ChevronLeft, Plus, Receipt, ArrowRight, Landmark, Trash2, CheckCircle2, Clock, LogOut, ArrowUpRight, ArrowDownLeft, Users } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useRouter } from "next/navigation";
import ActionButton from "@/components/ActionButton";
import { deleteGroup, leaveGroup } from "@/lib/actions/group";
import { markAsPaid, confirmReceived, directConfirm } from "@/lib/actions/settlement";
import GroupMembersDialog from "@/components/GroupMembersDialog";

interface IMember {
  _id: string;
  name: string;
  image?: string;
  email?: string;
}

interface IBillWithPayer extends Omit<Bill, 'paidBy'> {
  _id: string;
  description: string;
  createdAt: string;
  paidBy: {
    _id: string;
    name: string;
    image?: string;
  };
}

interface ISettlement {
  _id: string;
  from: IMember;
  to: IMember;
  amount: number;
  status: 'pending' | 'completed';
  paidAt?: string;
  completedAt?: string;
}

export default function GroupClient({ 
  groupId,
  userId,
  initialData 
}: { 
  groupId: string,
  userId: string,
  initialData: { group: any, bills: IBillWithPayer[], settlements: ISettlement[] }
}) {
  const router = useRouter();
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  
  const { data, mutate, isValidating } = useSWR<{ group: any, bills: IBillWithPayer[], settlements: ISettlement[] }>(
    `/api/groups/${groupId}`, 
    fetcher, 
    {
      fallbackData: initialData,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  const { group, bills, settlements } = data || initialData;
  
  if (!group) return null;

  const isCreator = group.createdBy === userId;

  const completedSettlements = settlements
    .filter((s: ISettlement) => s.status === 'completed')
    .map((s: ISettlement) => ({
      from: s.from._id,
      to: s.to._id,
      amount: s.amount
    }));

  const memberIds = group.members.map((m: IMember) => m._id);
  const transactions = simplifyDebts(
    bills.map((b: IBillWithPayer) => ({
      ...b,
      paidBy: typeof b.paidBy === 'string' ? b.paidBy : b.paidBy._id
    })), 
    memberIds,
    completedSettlements
  );

  const userOwes = transactions.filter(t => t.from === userId);
  const owedToUser = transactions.filter(t => t.to === userId);
  const pendingSettlements = settlements.filter((s: ISettlement) => s.status === 'pending');

  const totalOwe = userOwes.reduce((acc, t) => acc + t.amount, 0);
  const totalReceive = owedToUser.reduce((acc, t) => acc + t.amount, 0);
  const balance = totalReceive - totalOwe;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Dynamic Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 border-b border-slate-200">
        <div className="mx-auto flex max-w-lg items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all active:scale-90 dark:bg-slate-900 dark:text-slate-400">
              <ChevronLeft size={24} />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[140px] leading-tight">{group.name}</h1>
                {isValidating && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>}
              </div>
              <button 
                onClick={() => setIsMembersOpen(true)}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
              >
                <Users size={10} />
                {group.members.length} members
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMembersOpen(true)}
              className="flex -space-x-2 mr-1 active:scale-90 transition-transform"
            >
              {group.members.slice(0, 3).map((member: IMember) => (
                <Avatar key={member._id} src={member.image} name={member.name} size={28} className="border-2 border-white dark:border-slate-950 shadow-sm" />
              ))}
            </button>
            {isCreator ? (
              <ActionButton 
                action={async () => {
                  if (confirm("Delete this group and all its data?")) {
                    await deleteGroup(groupId);
                    router.push("/dashboard");
                  }
                }}
                variant="danger"
                size="icon"
                className="h-10 w-10 bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border-none"
              >
                <Trash2 size={18} />
              </ActionButton>
            ) : (
              <ActionButton 
                action={async () => {
                  await leaveGroup(groupId);
                  router.push("/dashboard");
                }}
                variant="ghost"
                size="icon"
                className="h-10 w-10 bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border-none"
              >
                <LogOut size={18} />
              </ActionButton>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg space-y-8 px-6 pt-8 pb-32">
        {/* Financial Overview Card */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-xl shadow-slate-200 dark:shadow-none">
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-10 translate-y-[-10px] rounded-full bg-primary/20 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col items-center space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Your Balance</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-500">₫</span>
                <h2 className={`text-4xl font-black tracking-tighter ${balance > 0 ? 'text-emerald-400' : balance < 0 ? 'text-rose-400' : 'text-white'}`}>
                  {balance.toLocaleString()}
                </h2>
              </div>
            </div>
            
            <div className="grid w-full grid-cols-2 gap-4 border-t border-slate-800 pt-6">
              <div className="flex flex-col items-center space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">You Owe</span>
                <span className="text-base font-black text-rose-400">₫{totalOwe.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center space-y-1 border-l border-slate-800">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">To Receive</span>
                <span className="text-base font-black text-emerald-400">₫{totalReceive.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Smart Settlement Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Landmark size={14} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Settlements</h3>
            </div>
            {(userOwes.length > 0 || owedToUser.length > 0) && (
              <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30">
                Action Required
              </span>
            )}
          </div>

          {(userOwes.length > 0 || owedToUser.length > 0) ? (
            <div className="space-y-3">
              {/* Owe Cards */}
              {userOwes.map((t, idx) => {
                const toMember = group.members.find((m: IMember) => m._id === t.to);
                const isPending = pendingSettlements.some((s: ISettlement) => s.from._id === userId && s.to._id === t.to);
                
                return (
                  <div key={`owe-${idx}`} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20">
                        <ArrowUpRight size={24} className="text-rose-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Pay {toMember?.name.split(' ')[0]}</p>
                        <p className="text-xs font-black text-rose-500">₫{t.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    {isPending ? (
                      <div className="flex items-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[10px] font-bold uppercase tracking-tight text-amber-600 dark:bg-amber-950/30 dark:border-amber-900/50">
                        <Clock size={12} className="animate-spin" />
                        Pending
                      </div>
                    ) : (
                      <ActionButton 
                        action={async () => {
                          await markAsPaid(groupId, t.to, t.amount);
                          mutate();
                        }}
                        className="rounded-xl px-4 py-2 text-[10px] font-black uppercase"
                        loadingText="Sending..."
                      >
                        Paid
                      </ActionButton>
                    )}
                  </div>
                );
              })}

              {/* Receive Cards */}
              {owedToUser.map((t, idx) => {
                const fromMember = group.members.find((m: IMember) => m._id === t.from);
                const pending = pendingSettlements.find((s: ISettlement) => s.from._id === t.from && s.to._id === userId);

                return (
                  <div key={`receive-${idx}`} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/20">
                        <ArrowDownLeft size={24} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{fromMember?.name.split(' ')[0]} owes you</p>
                        <p className="text-xs font-black text-emerald-500">+₫{t.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {pending ? (
                        <>
                          <ActionButton 
                            action={async () => {
                              await confirmReceived(groupId, pending._id);
                              mutate();
                            }}
                            variant="success"
                            className="rounded-xl px-4 py-2 text-[10px] font-black uppercase"
                            loadingText="Confirming..."
                          >
                            Confirm
                          </ActionButton>
                          <p className="text-[8px] font-bold uppercase tracking-tighter text-amber-500">Paid at {new Date(pending.paidAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </>
                      ) : (
                        <ActionButton 
                          action={async () => {
                            await directConfirm(groupId, t.from, t.amount);
                            mutate();
                          }}
                          variant="secondary"
                          className="rounded-xl px-4 py-2 text-[10px] font-black uppercase"
                        >
                          Received
                        </ActionButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[2.5rem] bg-emerald-50/50 p-10 text-center dark:bg-emerald-950/10 border border-emerald-100/50">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest italic">All Settled!</p>
            </div>
          )}
        </section>

        {/* Activity Feed / Bills */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Activity</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-900">
              {bills.length} Total
            </span>
          </div>

          {bills.length > 0 ? (
            <div className="space-y-3">
              {bills.map((bill: IBillWithPayer) => (
                <div key={bill._id} className="group flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 hover:border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-800">
                      <Receipt size={20} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{bill.description}</h4>
                      <div className="flex items-center gap-1.5">
                        <Avatar src={bill.paidBy.image} name={bill.paidBy.name} size={14} />
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                          {bill.paidBy.name.split(' ')[0]} paid • {new Date(bill.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-slate-900 dark:text-white">₫{bill.totalAmount.toLocaleString()}</p>
                    <p className="text-[8px] font-bold uppercase tracking-tighter text-slate-300">Amount</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs font-bold italic tracking-wide text-slate-300 uppercase">No expenses yet</p>
            </div>
          )}
        </section>

        {/* Invite Section */}
        <GroupInviteQR inviteCode={group.inviteCode} groupName={group.name} />
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-6">
        <Link
          href={`/group/${groupId}/add-bill`}
          className="flex items-center justify-center gap-3 rounded-[1.5rem] bg-slate-900 py-5 text-lg font-black text-white shadow-2xl shadow-slate-300 transition-all hover:bg-slate-800 active:scale-95 dark:shadow-none"
        >
          <Plus size={24} strokeWidth={3} />
          ADD EXPENSE
        </Link>
      </div>

      <GroupMembersDialog 
        open={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        members={group.members}
      />
    </div>
  );
}
