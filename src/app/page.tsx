import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { Wallet, Sparkles, ShieldCheck, Zap } from "lucide-react";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = searchParams ? await searchParams : {};
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl);

  if (session) {
    redirect(callbackUrl || "/dashboard");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-6 py-12 dark:bg-slate-950">
      {/* Background patterns */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]"></div>
      <div className="absolute top-0 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 translate-y-[-10%] rounded-full bg-indigo-50/50 blur-3xl dark:bg-indigo-900/10"></div>

      <div className="w-full max-w-sm space-y-12 text-center">
        <div className="space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-xl shadow-primary/20 ring-4 ring-white transition-transform hover:scale-105 active:scale-95 dark:ring-slate-900">
            <Wallet className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Our<span className="text-primary">Money</span>
            </h1>
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
              Split bills easily with friends.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <form
            action={async () => {
              "use server";
              await signIn("google", callbackUrl ? { redirectTo: callbackUrl } : undefined);
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-lg font-bold text-slate-900 shadow-md transition-all hover:bg-slate-50 hover:shadow-lg active:scale-[0.98] dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
            Secure and fast way to manage group expenses.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="flex flex-col items-center space-y-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fast</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Secure</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Smart</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function getSafeCallbackUrl(callbackUrl?: string) {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return undefined;
  }

  return callbackUrl;
}
