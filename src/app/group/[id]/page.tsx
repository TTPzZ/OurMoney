import { getGroupById, deleteGroup, leaveGroup } from "@/lib/actions/group";
import { getBillsByGroupId } from "@/lib/actions/bill";
import { getSettlementsByGroupId, markAsPaid, confirmReceived, directConfirm } from "@/lib/actions/settlement";
import { simplifyDebts, type Bill } from "@/lib/utils/debt";
import GroupInviteQR from "@/components/GroupInviteQR";
import Link from "next/link";
import { ChevronLeft, Plus, Receipt, ArrowRight, Landmark, Trash2, CheckCircle2, Clock, LogOut, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import ActionButton from "@/components/ActionButton";

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
  } & Record<string, unknown>;
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

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const group = await getGroupById(id);
  if (!group) notFound();

  const isCreator = group.createdBy === session.user.id;

  const bills = await getBillsByGroupId(id) as IBillWithPayer[];
  const settlements = await getSettlementsByGroupId(id) as ISettlement[];

  const completedSettlements = settlements
    .filter(s => s.status === 'completed')
    .map(s => ({
      from: s.from._id,
      to: s.to._id,
      amount: s.amount
    }));

  const memberIds = group.members.map((m: IMember) => m._id);
  const transactions = simplifyDebts(
    bills.map(b => ({
      ...b,
      paidBy: typeof b.paidBy === 'string' ? b.paidBy : b.paidBy._id
    })), 
    memberIds,
    completedSettlements
  );

  // Filter transactions involving the current user
  const userOwes = transactions.filter(t => t.from === session.user.id);
  const owedToUser = transactions.filter(t => t.to === session.user.id);
  const pendingSettlements = settlements.filter(s => s.status === 'pending');

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 pb-32">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 pt-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-[150px] leading-tight">{group.name}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {group.members.length} thành viên
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCreator ? (
            <ActionButton 
              action={async () => {
                "use server";
                await deleteGroup(id);
                redirect("/dashboard");
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
                "use server";
                await leaveGroup(id);
                redirect("/dashboard");
              }}
              variant="danger"
              className="p-2 w-auto h-auto rounded-xl"
              loadingText=""
            >
              <LogOut size={20} />
            </ActionButton>
          )}
          <div className="flex -space-x-2">
            {group.members.slice(0, 3).map((member: IMember) => (
              <div key={member._id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                {member.image ? (
                  <Image src={member.image} alt={member.name} width={32} height={32} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
            ))}
          </div>
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
                const toMember = group.members.find((m: IMember) => m._id === t.to);
                const isPending = pendingSettlements.some(s => s.from._id === session.user.id && s.to._id === t.to);
                
                return (
                  <div key={`owe-${idx}`} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border">
                        {toMember?.image ? (
                          <Image src={toMember.image} alt={toMember.name} width={40} height={40} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                            {toMember?.name.charAt(0)}
                          </div>
                        )}
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
                          "use server";
                          await markAsPaid(id, t.to, t.amount);
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
                const fromMember = group.members.find((m: IMember) => m._id === t.from);
                const pending = pendingSettlements.find(s => s.from._id === t.from && s.to._id === session.user.id);

                return (
                  <div key={`receive-${idx}`} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border">
                        {fromMember?.image ? (
                          <Image src={fromMember.image} alt={fromMember.name} width={40} height={40} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                            {fromMember?.name.charAt(0)}
                          </div>
                        )}
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
                              "use server";
                              await confirmReceived(id, pending._id);
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
                            "use server";
                            await directConfirm(id, t.from, t.amount);
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
              {bills.map((bill) => (
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
          href={`/group/${id}/add-bill`}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform"
        >
          <Plus size={24} />
          Thêm hóa đơn mới
        </Link>
      </div>
    </main>
  );
}
