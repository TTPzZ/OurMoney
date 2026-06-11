"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import { simplifyDebts } from "@/lib/utils/debt";
import GroupInviteQR from "@/components/GroupInviteQR";
import GroupMembersDialog from "@/components/GroupMembersDialog";
import Link from "next/link";
import { ChevronLeft, Plus, Receipt, Landmark, Trash2, CheckCircle2, Clock, LogOut } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useRouter } from "next/navigation";
import ActionButton from "@/components/ActionButton";
import { deleteGroup, leaveGroup } from "@/lib/actions/group";
import { markAsPaid, confirmReceived, directConfirm } from "@/lib/actions/settlement";
import type { BillWithPayer, GroupDetailData, GroupMember, Settlement } from "@/lib/money-types";

export default function GroupClient({ 
  groupId,
  userId,
  initialData,
  onBackToDashboard,
}: { 
  groupId: string,
  userId: string,
  initialData?: GroupDetailData,
  onBackToDashboard?: () => void,
}) {
  const router = useRouter();
  const [showMembers, setShowMembers] = useState(false);
  const { mutate: mutateGlobal } = useSWRConfig();
  const { data, error, mutate, isLoading, isValidating } = useSWR<GroupDetailData>(
    `/api/groups/${groupId}`, 
    fetcher, 
    {
      fallbackData: initialData,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  const detail = data || initialData;

  const goDashboard = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      router.push("/dashboard");
    }
  };

  if (!detail && isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 pb-32 w-full">
        <div className="w-full max-w-md flex items-center gap-3 mb-6 pt-4">
          <BackToDashboard onBackToDashboard={onBackToDashboard} />
          <div className="space-y-2">
            <div className="h-5 w-32 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-3 w-20 rounded-lg bg-gray-100 animate-pulse" />
          </div>
        </div>
        <div className="w-full max-w-md space-y-4">
          <div className="h-24 rounded-3xl bg-white border border-gray-100 shadow-sm animate-pulse" />
          <div className="h-40 rounded-3xl bg-white border border-gray-100 shadow-sm animate-pulse" />
          <div className="h-32 rounded-3xl bg-white border border-gray-100 shadow-sm animate-pulse" />
        </div>
      </main>
    );
  }

  if (!detail) {
    const message = error instanceof Error ? error.message : "Khong the tai du lieu nhom";
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 pb-32 w-full">
        <div className="w-full max-w-md flex items-center gap-3 mb-6 pt-4">
          <BackToDashboard onBackToDashboard={onBackToDashboard} />
          <p className="text-sm font-bold text-red-500">{message}</p>
        </div>
      </main>
    );
  }

  const { group, bills, settlements } = detail;
  
  if (!group) return null;

  const isCreator = group.createdBy.toString() === userId;

  const completedSettlements = settlements
    .filter((s: Settlement) => s.status === 'completed')
    .map((s: Settlement) => ({
      from: s.from._id,
      to: s.to._id,
      amount: s.amount
    }));

  const memberIds = group.members.map((m: GroupMember) => m._id);
  const transactions = simplifyDebts(
    bills.map((b: BillWithPayer) => ({
      ...b,
      paidBy: b.paidBy._id
    })), 
    memberIds,
    completedSettlements
  );

  // Filter transactions involving the current user
  const userOwes = transactions.filter(t => t.from === userId);
  const owedToUser = transactions.filter(t => t.to === userId);
  const pendingSettlements = settlements.filter((s: Settlement) => s.status === 'pending');

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 pb-32 w-full">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 pt-4">
        <div className="flex items-center gap-3">
          <BackToDashboard onBackToDashboard={onBackToDashboard} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 truncate max-w-[150px] leading-tight">{group.name}</h1>
              {isValidating && <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>}
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {group.members.length} thành viên
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCreator ? (
            <ActionButton 
              action={async () => {
                await deleteGroup(groupId);
                mutateGlobal(`/api/groups/${groupId}`, undefined, { revalidate: false });
                await mutateGlobal("/api/groups");
                goDashboard();
              }}
              variant="danger"
              className="p-2 w-auto h-auto rounded-xl"
              loadingText=""
            >
              <Trash2 size={20} />
            </ActionButton>
          ) : (
            <ActionButton 
              action={async () => {
                await leaveGroup(groupId);
                mutateGlobal(`/api/groups/${groupId}`, undefined, { revalidate: false });
                await mutateGlobal("/api/groups");
                goDashboard();
              }}
              variant="danger"
              className="p-2 w-auto h-auto rounded-xl"
              loadingText=""
            >
              <LogOut size={20} />
            </ActionButton>
          )}
          <button
            type="button"
            onClick={() => setShowMembers(true)}
            className="flex -space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Xem danh sách thành viên"
          >
            {group.members.slice(0, 3).map((member: GroupMember) => (
              <div key={member._id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                <Avatar src={member.image} name={member.name} size={32} />
              </div>
            ))}
            {group.members.length > 3 && (
              <span className="flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 px-1.5 text-[10px] font-black text-gray-500">
                +{group.members.length - 3}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Advanced Settlement Summary */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <Landmark size={16} />
            Quyết toán thông minh
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cần trả</p>
              <p className="text-xl font-black text-red-500">
                ₫{userOwes.reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cần nhận</p>
              <p className="text-xl font-black text-green-500">
                ₫{owedToUser.reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {owedToUser.length > 0 && (
            <p className="text-[10px] font-bold text-indigo-500 px-1 italic">
              ✨ Có {owedToUser.length} người đang còn thiếu tiền bạn.
            </p>
          )}

          {(userOwes.length > 0 || owedToUser.length > 0 || pendingSettlements.length > 0) ? (
            <div className="space-y-3">
              {/* Debt Details */}
              {userOwes.map((t, idx) => {
                const toMember = group.members.find((m: GroupMember) => m._id === t.to);
                const isPending = pendingSettlements.some((s: Settlement) => s.from._id === userId && s.to._id === t.to);
                
                return (
                  <div key={`owe-${idx}`} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border">
                        <Avatar src={toMember?.image} name={toMember?.name || "User"} size={40} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Bạn nợ <span className="text-indigo-600">{toMember?.name.split(' ')[0]}</span></p>
                        <p className="text-xs font-bold text-red-500">-₫{t.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    {isPending ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                        <Clock size={12} />
                        Đang chờ...
                      </div>
                    ) : (
                      <ActionButton 
                        action={async () => {
                          await markAsPaid(groupId, t.to, t.amount);
                          await mutate();
                        }}
                        className="px-4 py-2 text-xs"
                      >
                        Đã trả
                      </ActionButton>
                    )}
                  </div>
                );
              })}

              {owedToUser.map((t, idx) => {
                const fromMember = group.members.find((m: GroupMember) => m._id === t.from);
                const pending = pendingSettlements.find((s: Settlement) => s.from._id === t.from && s.to._id === userId);

                return (
                  <div key={`receive-${idx}`} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border">
                        <Avatar src={fromMember?.image} name={fromMember?.name || "User"} size={40} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900"><span className="text-indigo-600">{fromMember?.name.split(' ')[0]}</span> nợ bạn</p>
                        <p className="text-xs font-bold text-green-500">+₫{t.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {pending ? (
                        <>
                          <ActionButton 
                            action={async () => {
                              await confirmReceived(groupId, pending._id);
                              await mutate();
                            }}
                            variant="success"
                            className="px-4 py-2 text-xs"
                          >
                            <CheckCircle2 size={12} />
                            Xác nhận
                          </ActionButton>
                          <p className="text-[8px] text-amber-500 font-bold">Đã trả: {new Date(pending.paidAt!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </>
                      ) : (
                        <ActionButton 
                          action={async () => {
                            await directConfirm(groupId, t.from, t.amount);
                            await mutate();
                          }}
                          variant="secondary"
                          className="px-4 py-2 text-xs"
                        >
                          Đã nhận tiền
                        </ActionButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-green-50 p-6 rounded-3xl text-center border border-green-100">
              <p className="text-green-700 font-bold text-sm">Nhóm hiện đang hòa vốn, không có nợ!</p>
            </div>
          )}
        </section>

        {/* Recent Bills */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <Receipt size={16} />
            Hóa đơn gần đây
          </h2>

          {bills.length > 0 ? (
            <div className="space-y-3">
              {bills.map((bill: BillWithPayer) => (
                <div key={bill._id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                      <Receipt size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight">{bill.description}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        <span>{bill.paidBy.name.split(' ')[0]} trả</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(bill.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(bill.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="font-black text-gray-900">₫{bill.totalAmount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl text-center border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-medium text-sm">Chưa có hóa đơn nào được tạo.</p>
            </div>
          )}
        </section>

        {/* Invite Section */}
        <GroupInviteQR inviteCode={group.inviteCode} groupName={group.name} />
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-8 w-full max-w-md px-6">
        <Link
          href={`/group/${groupId}/add-bill`}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform"
        >
          <Plus size={24} />
          Thêm hóa đơn mới
        </Link>
      </div>

      <GroupMembersDialog
        open={showMembers}
        onClose={() => setShowMembers(false)}
        members={group.members}
      />
    </main>
  );
}

function BackToDashboard({
  onBackToDashboard,
}: {
  onBackToDashboard?: () => void;
}) {
  const className = "p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500 active:scale-95 transition-transform";

  if (onBackToDashboard) {
    return (
      <button type="button" onClick={onBackToDashboard} className={className} aria-label="Back to dashboard">
        <ChevronLeft size={24} />
      </button>
    );
  }

  return (
    <Link href="/dashboard" className={className} aria-label="Back to dashboard">
      <ChevronLeft size={24} />
    </Link>
  );
}
