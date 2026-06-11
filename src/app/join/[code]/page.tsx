import { auth } from "@/auth";
import { joinGroupByCode } from "@/lib/actions/group";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    // If not logged in, redirect to login then back here
    redirect(`/?callbackUrl=/join/${code}`);
  }

  try {
    const result = await joinGroupByCode(code);
    if (result.success) {
      redirect(`/group/${result.groupId}`);
    }
  } catch (error) {
    console.error("Join group failed:", error);
    // Redirect to dashboard if join fails (e.g. invalid code)
    redirect("/dashboard?error=invalid_code");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 text-center space-y-6 w-full max-w-sm animate-pulse">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto">
          <Loader2 className="text-primary animate-spin" size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Joining Group</h2>
          <p className="text-sm font-medium text-slate-400">Hang tight, we are adding you to the circle...</p>
        </div>
      </div>
    </div>
  );
}
