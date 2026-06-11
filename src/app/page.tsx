import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-sm space-y-12 text-center relative z-10">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl border border-slate-100 flex items-center justify-center mx-auto rotate-3 hover:rotate-0 transition-transform duration-500">
            <span className="text-4xl">💰</span>
          </div>
          <div className="space-y-1 pt-4">
            <h1 className="text-5xl font-black tracking-tight text-indigo-600 italic">
              OurMoney
            </h1>
            <p className="text-base text-slate-400 font-medium tracking-tight">
              Chia tiền sòng phẳng, giữ bạn bền lâu.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <form
            action={async () => {
              "use server";
              await signIn("google", callbackUrl ? { redirectTo: callbackUrl } : undefined);
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-lg font-bold text-slate-700 shadow-xl border border-white transition-all active:scale-95 hover:shadow-2xl hover:-translate-y-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" className="h-6 w-6">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              Đăng nhập với Google
            </button>
          </form>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">
            Nhanh chóng • An toàn • Miễn phí
          </p>
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
