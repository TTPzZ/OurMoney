import { auth } from "@/auth";
import { getGroupById } from "@/lib/actions/group";
import AddBillForm from "@/components/AddBillForm";
import { notFound, redirect } from "next/navigation";

interface IMember {
  _id: string;
  name: string;
  image?: string;
}

export default async function AddBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const group = await getGroupById(id);
  if (!group) notFound();

  // Ensure user is a member of the group
  const isMember = group.members.some((m: IMember) => m._id === session.user.id);
  if (!isMember) redirect("/dashboard");

  const members = group.members.map((m: IMember) => ({
    _id: m._id,
    name: m.name,
    image: m.image
  }));

  return (
    <AddBillForm 
      groupId={id} 
      members={members} 
      currentUserId={session.user.id} 
    />
  );
}
