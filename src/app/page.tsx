import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { Wallet, Users, Sparkles, ArrowRight } from "lucide-react";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-200/30 blur-[120px] rounded-full"></div>
      
      <div className="relative w-full max-w-md flex flex-col items-center text-center space-y-12">
        {/* Logo & Branding */}
        <div className="space-y-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 animate-float mx-auto">
            <Wallet className="text-white" size={40} />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 italic">
              OurMoney
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
              Sòng phẳng mới là tri kỷ
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="grid grid-cols-1 gap-4 w-full">
          <div className="bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white/40 shadow-sm flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Chia tiền thông minh</h3>
              <p className="text-xs text-slate-500">Tự động tính toán nợ nần cho nhóm bạn.</p>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white/40 shadow-sm flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Quét hóa đơn AI</h3>
              <p className="text-xs text-slate-500">Chụp ảnh, OurMoney sẽ tự bóc tách món ăn.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full space-y-6">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
            className="w-full"
          >
            <button
              type="submit"
              className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-8 py-5 text-lg font-bold text-white shadow-2xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" className="h-6 w-6">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              <span>Tiếp tục với Google</span>
              <ArrowRight className="absolute right-6 opacity-0 -translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0" size={20} />
            </button>
          </form>

          <p className="text-sm font-medium text-slate-400">
            Dễ dàng quản lý chi tiêu nhóm chỉ trong vài giây.
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-8 border-t border-slate-100 w-full flex justify-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-xl font-black text-slate-800">100%</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Miễn phí</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-black text-slate-800">⚡ Fast</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Tốc độ</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-black text-slate-800">🔒 Secure</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Bảo mật</span>
          </div>
        </div>
      </div>
    </main>
  );
}
