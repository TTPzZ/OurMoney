import { auth } from "@/auth";
import { getGroups } from "@/lib/actions/group";
import CreateGroupModal from "@/components/CreateGroupModal";
import Link from "next/link";
import { Users, ChevronRight, PlusCircle } from "lucide-react";
import Image from "next/image";

interface IGroupListItem {
  _id: string;
  name: string;
  members: string[];
}

export default async function DashboardPage() {
  const session = await auth();
  const groups = await getGroups() as IGroupListItem[];

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-6 pb-24">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-black text-indigo-600">OurMoney</h1>
          <p className="text-gray-500 font-medium tracking-tight">Xin chào, {session?.user?.name?.split(' ')[0]}! 👋</p>
        </div>
        <Link href="/profile" className="relative active:scale-90 transition-transform">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt="Profile"
              width={48}
              height={48}
              className="rounded-full border-2 border-white shadow-lg"
            />
          ) : (
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-lg text-indigo-600 font-bold">
              {session?.user?.name?.charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
        </Link>
      </div>

      {/* Group List */}
      <div className="w-full max-w-md space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Nhóm của bạn</h2>
        
        {groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link
                key={group._id}
                href={`/group/${group._id}`}
                className="flex items-center justify-between bg-white p-5 rounded-3xl border border-gray-100 shadow-sm active:scale-95 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{group.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                      {group.members.length} thành viên
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300" size={20} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-gray-200">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-400 font-medium">Bạn chưa tham gia nhóm nào.</p>
          </div>
        )}
      </div>

      {/* Floating Action Button / Fixed Bottom */}
      <div className="fixed bottom-8 w-full max-w-md px-6 flex justify-center">
        <CreateGroupModal />
      </div>
    </main>
  );
}
