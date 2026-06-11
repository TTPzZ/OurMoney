import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white text-gray-900">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-indigo-600">
            OurMoney
          </h1>
          <p className="text-lg text-gray-500">
            Split bills easily with friends.
          </p>
        </div>

        <div className="pt-8">
          <form
            action={async () => {
              "use server";
              await signIn("facebook");
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-6 py-4 text-lg font-semibold text-white shadow-lg transition-transform active:scale-95 min-h-[56px]"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-6 w-6"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
              Continue with Facebook
            </button>
          </form>
        </div>

        <p className="text-sm text-gray-400">
          Secure and fast way to manage group expenses.
        </p>
      </div>
    </main>
  );
}
