"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { simplifyDebts, type Bill } from "@/lib/utils/debt";
import GroupInviteQR from "@/components/GroupInviteQR";
import Link from "next/link";
import { ChevronLeft, Plus, Receipt, ArrowRight, Landmark, Trash2, CheckCircle2, Clock, LogOut, Settings, Wallet, UserCircle } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useRouter } from "next/navigation";
import ActionButton from "@/components/ActionButton";
import { deleteGroup, leaveGroup } from "@/lib/actions/group";
import { markAsPaid, confirmReceived, directConfirm } from "@/lib/actions/settlement";

interface IMember {
  _id: string;
  name: string;
  image?: string;
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Dynamic Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-center">
        <div className="w-full max-w-md flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors active:scale-90">
              <ChevronLeft size={24} />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-slate-900 truncate max-w-[140px] leading-none">{group.name}</h1>
                {isValidating && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{group.members.length} thành viên</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 mr-2">
              {group.members.slice(0, 3).map((member: IMember) => (
                <div key={member._id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm bg-slate-200">
                  <Avatar src={member.image} name={member.name} size={32} />
                </div>
              ))}
            </div>
            {isCreator ? (
              <ActionButton 
                action={async () => {
                  if (confirm("Bạn có chắc chắn muốn xóa nhóm này?")) {
                    await deleteGroup(groupId);
                    router.push("/dashboard");
                  }
                }}
                variant="danger"
                className="w-10 h-10 p-0 rounded-xl border-none bg-rose-50 text-rose-500 hover:bg-rose-100"
                loadingText=""
              >
                <Trash2 size={20} />
              </ActionButton>
            ) : (
              <ActionButton 
                action={async () => {
                  await leaveGroup(groupId);
                  router.push("/dashboard");
                }}
                variant="danger"
                className="w-10 h-10 p-0 rounded-xl border-none bg-slate-100 text-slate-500"
                loadingText=""
              >
                <LogOut size={20} />
              </ActionButton>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-md px-6 pt-8 pb-36 space-y-10">
        {/* Advanced Balance Header */}
        <section className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10 flex flex-col items-center space-y-6">
            <div className="flex flex-col items-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Tổng số dư của bạn</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white/80">₫</span>
                <h2 className="text-4xl font-black tracking-tighter">
                  {(owedToUser.reduce((acc, t) => acc + t.amount, 0) - userOwes.reduce((acc, t) => acc + t.amount, 0)).toLocaleString()}
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-white/10">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1">Cần trả</span>
                <span className="text-lg font-black text-rose-200">₫{userOwes.reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</span>
              </div>
              <div className="w-px h-full bg-white/10 mx-auto"></div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1">Cần nhận</span>
                <span className="text-lg font-black text-emerald-200">₫{owedToUser.reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Smart Settlement Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Landmark size={14} className="text-slate-400" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quyết toán thông minh</h3>
          </div>

          {(userOwes.length > 0 || owedToUser.length > 0) ? (
            <div className="grid grid-cols-1 gap-3">
              {/* People You Owe */}
              {userOwes.map((t, idx) => {
                const toMember = group.members.find((m: IMember) => m._id === t.to);
                const isPending = pendingSettlements.some((s: ISettlement) => s.from._id === userId && s.to._id === t.to);
                
                return (
                  <div key={`owe-${idx}`} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 p-0.5 border border-slate-50">
                        <Avatar src={toMember?.image} name={toMember?.name || "User"} size={48} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Trả <span className="text-indigo-600">{toMember?.name.split(' ')[0]}</span></p>
                        <p className="text-xs font-black text-rose-500">₫{t.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    {isPending ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 uppercase tracking-tighter">
                        <Clock size={12} className="animate-spin" />
                        Đang chờ...
                      </div>
                    ) : (
                      <ActionButton 
                        action={async () => {
                          await markAsPaid(groupId, t.to, t.amount);
                          mutate();
                        }}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black shadow-lg shadow-indigo-100"
                        loadingText="Đang gửi"
                      >
                        GỬI TIỀN
                      </ActionButton>
                    )}
                  </div>
                );
              })}

              {/* People Who Owe You */}
              {owedToUser.map((t, idx) => {
                const fromMember = group.members.find((m: IMember) => m._id === t.from);
                const pending = pendingSettlements.find((s: ISettlement) => s.from._id === t.from && s.to._id === userId);

                return (
                  <div key={`receive-${idx}`} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 p-0.5 border border-slate-50">
                        <Avatar src={fromMember?.image} name={fromMember?.name || "User"} size={48} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900"><span className="text-indigo-600">{fromMember?.name.split(' ')[0]}</span> nợ bạn</p>
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
                            className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[11px] font-black shadow-lg shadow-emerald-100"
                            loadingText="Đang lưu"
                          >
                            XÁC NHẬN
                          </ActionButton>
                          <p className="text-[8px] text-amber-500 font-bold uppercase tracking-tighter">Đã trả lúc {new Date(pending.paidAt!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </>
                      ) : (
                        <ActionButton 
                          action={async () => {
                            await directConfirm(groupId, t.from, t.amount);
                            mutate();
                          }}
                          variant="secondary"
                          className="bg-slate-50 text-slate-500 border border-slate-100 px-4 py-2 rounded-xl text-[10px] font-black"
                        >
                          ĐÃ NHẬN
                        </ActionButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-emerald-50/50 p-10 rounded-[2.5rem] text-center border border-emerald-100/50 space-y-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-emerald-700 font-black text-sm uppercase tracking-wider italic">Nhóm sạch nợ!</p>
            </div>
          )}
        </section>

        {/* Activity Feed / Bills */}
        <section className="space-y-4 pb-12">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hoạt động gần đây</h3>
            </div>
            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">
              {bills.length}
            </span>
          </div>

          {bills.length > 0 ? (
            <div className="space-y-4">
              {bills.map((bill: IBillWithPayer) => (
                <div key={bill._id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between transition-transform active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                      <Receipt size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight mb-1">{bill.description}</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full overflow-hidden">
                          <Avatar src={bill.paidBy.image} name={bill.paidBy.name} size={16} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {bill.paidBy.name.split(' ')[0]} trả • {new Date(bill.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-slate-900 text-lg">₫{bill.totalAmount.toLocaleString()}</span>
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Hóa đơn</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100 shadow-sm">
              <p className="text-slate-300 font-bold text-xs italic tracking-wide">Mọi người chưa chi tiêu gì...</p>
            </div>
          )}
        </section>

        {/* Share & Invite Section */}
        <GroupInviteQR inviteCode={group.inviteCode} groupName={group.name} />
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 w-full max-w-md px-6 z-40">
        <Link
          href={`/group/${groupId}/add-bill`}
          className="flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-slate-300 active:scale-95 transition-all hover:bg-slate-800"
        >
          <Plus size={24} />
          THÊM HÓA ĐƠN
        </Link>
      </div>
    </div>
  );
}
