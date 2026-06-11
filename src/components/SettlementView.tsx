import { ArrowRight, Landmark } from "lucide-react";
import Avatar from "@/components/Avatar";

interface Member {
  _id: string;
  name: string;
  image?: string;
}

interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export default function SettlementView({ 
  transactions, 
  members 
}: { 
  transactions: Transaction[]; 
  members: Member[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="bg-green-50 rounded-3xl p-8 text-center space-y-2 border border-green-100">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
          <Landmark size={24} />
        </div>
        <p className="font-bold text-green-800">All settled up!</p>
        <p className="text-sm text-green-600">No one owes anything to anyone.</p>
      </div>
    );
  }

  const getMember = (id: string) => members.find(m => m._id === id);

  return (
    <div className="space-y-4">
      {transactions.map((t, idx) => {
        const fromMember = getMember(t.from);
        const toMember = getMember(t.to);
        
        return (
          <div key={idx} className="bg-white p-5 rounded-3xl border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border">
                  <Avatar src={fromMember?.image} name={fromMember?.name || "User"} size={40} />
                </div>
                <span className="font-bold text-gray-900">{fromMember?.name.split(" ")[0]}</span>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <p className="text-lg font-black text-red-500">₫{t.amount.toLocaleString()}</p>
                <ArrowRight size={16} className="text-gray-300" />
              </div>

              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900">{toMember?.name.split(" ")[0]}</span>
                <div className="w-10 h-10 rounded-full overflow-hidden border">
                  <Avatar src={toMember?.image} name={toMember?.name || "User"} size={40} />
                </div>
              </div>
            </div>
            
            <button className="w-full bg-indigo-50 text-indigo-700 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform">
              Mark as Paid
            </button>
          </div>
        );
      })}
    </div>
  );
}
