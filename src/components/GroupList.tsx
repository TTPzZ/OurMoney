import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";

interface Group {
  _id: string;
  name: string;
  members: string[];
  createdAt: string;
}

export default function GroupList({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <Link
          key={group._id}
          href={`/dashboard/group/${group._id}`}
          className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{group.name}</h3>
              <p className="text-xs text-gray-500">
                {group.members.length} members • {new Date(group.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <ChevronRight className="text-gray-300" size={20} />
        </Link>
      ))}
    </div>
  );
}
