import { auth } from "@/auth";
import { getGroupsForUser } from "@/lib/queries";
import type { PublicUser } from "@/lib/current-user";
import type { GroupListItem } from "@/lib/money-types";
import MoneyClientShell from "./MoneyClientShell";

export const preferredRegion = "sin1";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const groups = await getGroupsForUser(session.user.id) as GroupListItem[];

  return (
    <MoneyClientShell
      initialGroups={groups} 
      userId={session.user.id}
      user={{
        _id: session.user.id,
        name: session.user.name || "User",
        image: session.user.image || undefined,
        email: session.user.email || undefined,
      } satisfies PublicUser} 
    />
  );
}
