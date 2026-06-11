import { auth } from "@/auth";
import { joinGroupByCode } from "@/lib/actions/group";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-3xl shadow-sm text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Đang tham gia nhóm...</p>
      </div>
    </div>
  );
}
