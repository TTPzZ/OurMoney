import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, LogOut } from "lucide-react";
import ProfileClient from "./ProfileClient";
import { SessionProvider } from "next-auth/react";

export const preferredRegion = "sin1";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  // We don't wait for DB here anymore to make it instant.
  // ProfileClient will handle the cache-first loading of full data.
  const userFallback = {
    _id: session.user.id,
    name: session.user.name || "",
    image: session.user.image || undefined,
    email: session.user.email || undefined,
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
        <Link href="/dashboard" className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500 active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Hồ sơ cá nhân</h1>
        <div className="w-10"></div>
      </div>

      <SessionProvider session={session}>
        <ProfileClient initialUser={userFallback} />
      </SessionProvider>

      <div className="w-full max-w-md mt-6">
        <form action={async () => {
          "use server";
          await signOut();
          redirect("/");
        }}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-white text-red-500 py-4 rounded-2xl font-bold text-lg shadow-sm border border-red-50 active:scale-95 transition-transform"
          >
            <LogOut size={24} />
            Đăng xuất
          </button>
        </form>
      </div>
    </main>
  );
}
