import { getGroupByIdForUser, getBillsByGroupId, getSettlementsByGroupId } from "@/lib/queries";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import GroupClient from "./GroupClient";

export const preferredRegion = "sin1";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  // Query initial data
  const group = await getGroupByIdForUser(id, session.user.id);
  if (!group) notFound();

  const [bills, settlements] = await Promise.all([
    getBillsByGroupId(id),
    getSettlementsByGroupId(id)
  ]);

  return (
    <GroupClient 
      groupId={id}
      userId={session.user.id}
      initialData={{
        group,
        bills: bills as any,
        settlements: settlements as any
      }}
    />
  );
}
