import { getGroupById } from "@/lib/actions/group";
import { getBillsByGroupId } from "@/lib/actions/bill";
import { simplifyDebts, type Bill } from "@/lib/utils/debt";
import GroupInviteQR from "@/components/GroupInviteQR";
import Link from "next/link";
import { ChevronLeft, Plus, Receipt, ArrowRight, Landmark } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

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

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await getGroupById(id);
  
  if (!group) notFound();

  const bills = await getBillsByGroupId(id) as IBillWithPayer[];
  const memberIds = group.members.map((m: IMember) => m._id);
  const transactions = simplifyDebts(
    bills.map(b => ({
      ...b,
      paidBy: typeof b.paidBy === 'string' ? b.paidBy : b.paidBy._id
    })), 
    memberIds
  );

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4 pb-32">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 pt-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 truncate max-w-[200px]">{group.name}</h1>
        </div>
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
          {group.members.length > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
              +{group.members.length - 3}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Settlement Summary */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <Landmark size={16} />
            Quyết toán nợ
          </h2>
          
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((t, idx) => {
                const fromMember = group.members.find((m: IMember) => m._id === t.from);
                const toMember = group.members.find((m: IMember) => m._id === t.to);
                return (
                  <div key={idx} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{fromMember?.name.split(' ')[0]}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-red-500">₫{t.amount.toLocaleString()}</span>
                      <ArrowRight size={14} className="text-gray-300" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{toMember?.name.split(' ')[0]}</span>
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
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {bill.paidBy.name.split(' ')[0]} trả • {new Date(bill.createdAt).toLocaleDateString('vi-VN')}
                      </p>
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
          href={`/group/${group._id}/add-bill`}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform"
        >
          <Plus size={24} />
          Thêm hóa đơn mới
        </Link>
      </div>
    </main>
  );
}
