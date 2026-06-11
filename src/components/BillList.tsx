import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface Bill {
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

export default function BillList({ bills }: { bills: Bill[] }) {
  if (bills.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {bills.map((bill) => (
        <div
          key={bill._id}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shrink-0">
              {bill.paidBy.image ? (
                <Image
                  src={bill.paidBy.image}
                  alt={bill.paidBy.name}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                  {bill.paidBy.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">
                {bill.description}
              </h3>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                Paid by {bill.paidBy.name.split(" ")[0]} • {formatDistanceToNow(new Date(bill.createdAt))} ago
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-gray-900">
              ₫{bill.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
