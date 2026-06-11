import { auth } from "@/auth";
import { getGroupsForUser } from "@/lib/queries";
import DashboardClient from "./DashboardClient";

interface IGroupListItem {
  _id: string;
  name: string;
  members: string[];
}

export const preferredRegion = "sin1";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const groups = await getGroupsForUser(session.user.id) as IGroupListItem[];

  return (
    <DashboardClient 
      initialGroups={groups} 
      user={{
        name: session.user.name,
        image: session.user.image
      }} 
    />
  );
}
