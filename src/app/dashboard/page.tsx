import { auth } from "@/auth";
import { getGroupsForUser } from "@/lib/queries";
import DashboardClient from "./DashboardClient";

export const preferredRegion = "sin1";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const groups = await getGroupsForUser(session.user.id);

  return (
    <DashboardClient 
      initialGroups={groups as any} 
      user={{
        name: session.user.name,
        image: session.user.image
      }} 
    />
  );
}
