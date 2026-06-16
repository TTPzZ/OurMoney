import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGroupByIdForUser, getBillsByGroupId, getSettlementsByGroupId } from "@/lib/queries";

export const preferredRegion = "sin1";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.time(`[GROUP API] Total ${id}`);
  try {
    console.time(`[GROUP API] auth ${id}`);
    const session = await auth();
    console.timeEnd(`[GROUP API] auth ${id}`);

    if (!session?.user?.id) {
      console.timeEnd(`[GROUP API] Total ${id}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.time(`[GROUP API] group ${id}`);
    const group = await getGroupByIdForUser(id, session.user.id);
    console.timeEnd(`[GROUP API] group ${id}`);

    if (!group) {
      console.timeEnd(`[GROUP API] Total ${id}`);
      return NextResponse.json({ error: "Group not found or no access" }, { status: 403 });
    }

    console.time(`[GROUP API] bills_and_settlements ${id}`);
    const [bills, settlements] = await Promise.all([
      getBillsByGroupId(id),
      getSettlementsByGroupId(id)
    ]);
    console.timeEnd(`[GROUP API] bills_and_settlements ${id}`);

    console.log(`[GROUP API] Metadata ${id}:`, {
      userId: session.user.id,
      billsCount: bills.length,
      settlementsCount: settlements.length
    });

    console.timeEnd(`[GROUP API] Total ${id}`);
    return NextResponse.json({ group, bills, settlements });
  } catch (error: unknown) {
    console.timeEnd(`[GROUP API] Total ${id}`);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
