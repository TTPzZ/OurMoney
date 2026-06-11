import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGroupByIdForUser, getBillsByGroupId, getSettlementsByGroupId } from "@/lib/queries";

export const preferredRegion = "sin1";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await getGroupByIdForUser(id, session.user.id);
    if (!group) {
      return NextResponse.json({ error: "Group not found or no access" }, { status: 403 });
    }

    const [bills, settlements] = await Promise.all([
      getBillsByGroupId(id),
      getSettlementsByGroupId(id)
    ]);

    return NextResponse.json({ group, bills, settlements });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
