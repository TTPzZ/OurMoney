import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGroupsForUser } from "@/lib/queries";

export const preferredRegion = "sin1";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await getGroupsForUser(session.user.id);
    
    return NextResponse.json({ groups });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
