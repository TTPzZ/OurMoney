import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group";
import Bill from "@/models/Bill";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, MoreVertical, Plus, ReceiptText, Users, Landmark } from "lucide-react";
import Link from "next/link";
import GroupInviteQR from "@/components/GroupInviteQR";
import BillList from "@/components/BillList";
import SettlementView from "@/components/SettlementView";
import { simplifyDebts as calculateDebts } from "@/lib/utils/debt";

interface Member {
  _id: any;
  name: string;
  image?: string;
}

interface BillData {
  paidBy: any;
  totalAmount: number;
  splits: { userId: any; amount: number }[];
}

interface BillListItem {
  _id: string;
  description: string;
  totalAmount: number;
  paidBy: {
    _id: string;
    name: string;
    image?: string;
  };
  createdAt: string;
}

export default async function GroupPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const activeTab = tab || "bills";

  await connectDB();
  const group = (await Group.findById(id)
    .populate("members", "name image")
    .lean()) as any;

  if (!group) notFound();

  const groupMembers = (group.members as unknown) as Member[];

  // Check if user is a member
  const isMember = groupMembers.some(
    (m) => m._id.toString() === session.user.id
  );

  if (!isMember) redirect("/dashboard");

  // Fetch bills
  const bills = (await Bill.find({ groupId: id })
    .populate("paidBy", "name image")
    .sort({ createdAt: -1 })
    .lean()) as any[];

  const members = groupMembers.map(m => ({
    _id: m._id.toString(),
    name: m.name,
    image: m.image
  }));

  // Calculate debts
  const transactions = calculateDebts(bills as unknown as BillData[], members.map(m => m._id));
  
  const billsForList = bills.map(b => ({
    ...b,
    _id: b._id.toString(),
    paidBy: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(b.paidBy as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _id: (b.paidBy as any)._id.toString()
    },
    createdAt: (b.createdAt as Date).toISOString()
  })) as unknown as BillListItem[];

  // Calculate current user's balance
  const userTransactionsFrom = transactions.filter(t => t.from === session.user.id);
  const userTransactionsTo = transactions.filter(t => t.to === session.user.id);
  
  const amountOwed = userTransactionsFrom.reduce((sum, t) => sum + t.amount, 0);
  const amountToReceive = userTransactionsTo.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = amountToReceive - amountOwed;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1 text-gray-500">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 truncate max-w-[180px]">
            {group.name as string}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-gray-400">
            <Users size={20} />
          </button>
          <button className="p-2 text-gray-400">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* Balance Summary Card */}
        <section className={`rounded-3xl p-6 shadow-sm border ${
          netBalance > 0 ? "bg-green-600 border-green-700 text-white" : 
          netBalance < 0 ? "bg-red-600 border-red-700 text-white" : 
          "bg-indigo-600 border-indigo-700 text-white"
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Your Balance</p>
              <h2 className="text-3xl font-black">
                {netBalance === 0 ? "Settled" : `₫${Math.abs(netBalance).toLocaleString()}`}
              </h2>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Landmark size={20} />
            </div>
          </div>
          <p className="text-sm font-medium opacity-90">
            {netBalance > 0 ? "Overall, you are owed by others." : 
             netBalance < 0 ? "Overall, you owe others money." : 
             "You are all caught up in this group!"}
          </p>
        </section>

        {/* Tab Switcher */}
        <div className="flex bg-white p-1 rounded-2xl border shadow-sm">
          <Link 
            href={`?tab=bills`}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "bills" ? "bg-indigo-600 text-white shadow-md" : "text-gray-500"
            }`}
          >
            <ReceiptText size={18} />
            Bills
          </Link>
          <Link 
            href={`?tab=settle`}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "settle" ? "bg-indigo-600 text-white shadow-md" : "text-gray-500"
            }`}
          >
            <Landmark size={18} />
            Settle Up
          </Link>
        </div>

        {activeTab === "bills" ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Recent Activity</h3>
              <Link href={`/dashboard/group/${id}/add-bill`} className="text-xs font-bold text-indigo-600">
                + Add Bill
              </Link>
            </div>
            
            {billsForList.length > 0 ? (
              <BillList bills={billsForList} />
            ) : (
              <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center space-y-4">
                <p className="text-gray-500 text-sm">No bills added yet.</p>
                <Link 
                  href={`/dashboard/group/${id}/add-bill`}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
                >
                  <Plus size={20} />
                  Add First Bill
                </Link>
              </div>
            )}

            {/* Invite Section at the bottom if few bills */}
            {bills.length < 3 && (
              <div className="pt-4">
                <GroupInviteQR 
                  inviteCode={group.inviteCode as string} 
                  groupName={group.name as string} 
                />
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            <div className="px-1">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Suggested Transfers</h3>
            </div>
            <SettlementView transactions={transactions} members={members} />
          </section>
        )}
      </main>

      {/* Floating Action Button for Adding Bill */}
      <Link 
        href={`/dashboard/group/${id}/add-bill`}
        className="fixed bottom-8 right-6 w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-90 transition-transform z-30 border-4 border-white"
      >
        <Plus size={32} />
      </Link>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t px-8 py-4 flex justify-around items-center z-10">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-gray-400">
          <Users size={24} />
          <span className="text-[10px] font-bold">Groups</span>
        </Link>
        <div className="w-12 h-12 flex items-center justify-center">
          {/* Spacer for FAB */}
        </div>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <MoreVertical size={24} />
          <span className="text-[10px] font-bold">More</span>
        </button>
      </nav>
    </div>
  );
}
