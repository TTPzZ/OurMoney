import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, LogOut, Settings } from "lucide-react";
import type { PublicUser } from "@/lib/current-user";
import ProfileClient from "./ProfileClient";
import { SessionProvider } from "next-auth/react";

export const preferredRegion = "sin1";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-lg items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all active:scale-90 dark:bg-slate-900 dark:text-slate-400">
            <ChevronLeft size={24} />
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="text-primary" size={18} />
            <h1 className="text-base font-black uppercase tracking-widest text-slate-900 dark:text-white">Settings</h1>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg space-y-10 px-6 pt-10 pb-32">
        <SessionProvider session={session}>
          <ProfileClient 
            initialUser={{
              _id: session.user.id,
              name: session.user.name || "",
              image: session.user.image || undefined,
              email: session.user.email || undefined,
            } satisfies PublicUser}
          />
        </SessionProvider>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded-[1.5rem] bg-white text-rose-500 py-5 font-black text-sm uppercase tracking-widest shadow-sm border border-slate-100 active:scale-95 transition-all hover:bg-rose-50 hover:border-rose-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-rose-950/20"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </form>
          <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-8">OurMoney v1.2.0 • 2026</p>
        </div>
      </main>
    </div>
  );
}
