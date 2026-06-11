import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, LogOut, Settings } from "lucide-react";
import ProfileClient from "./ProfileClient";
import { SessionProvider } from "next-auth/react";

export const preferredRegion = "sin1";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-center">
        <div className="w-full max-w-md flex justify-between items-center">
          <Link href="/dashboard" className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors active:scale-90">
            <ChevronLeft size={24} />
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="text-indigo-600" size={18} />
            <h1 className="text-base font-black text-slate-900 uppercase tracking-widest leading-none mt-0.5">Tài khoản</h1>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="w-full max-w-md px-6 pt-10 pb-32 space-y-12">
        <SessionProvider session={session}>
          <ProfileClient 
            initialName={session.user.name || ""} 
            initialImage={session.user.image || ""} 
            email={session.user.email || ""} 
          />
        </SessionProvider>

        <div className="pt-6 border-t border-slate-200/60">
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white text-rose-500 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-sm border border-slate-100 active:scale-95 transition-all hover:bg-rose-50 hover:border-rose-100"
            >
              <LogOut size={20} />
              Đăng xuất ngay
            </button>
          </form>
          <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-8">OurMoney v1.2.0 • 2026</p>
        </div>
      </main>
    </div>
  );
}
