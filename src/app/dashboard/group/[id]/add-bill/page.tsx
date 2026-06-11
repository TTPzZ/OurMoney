import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group";
import { notFound, redirect } from "next/navigation";
import AddBillForm from "@/components/AddBillForm";

interface Member {
  _id: any;
  name: string;
  image?: string;
}

export default async function AddBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  await connectDB();
  const group = (await Group.findById(id)
    .populate("members", "name image")
    .lean()) as any;

  if (!group) notFound();

  const groupMembers = (group.members as unknown) as Member[];

  // Check if user is a member
  const isMember = groupMembers.some(
    (m) => m._id.toString() === session.user.id
  );

  if (!isMember) redirect("/dashboard");

  const members = groupMembers.map(m => ({
    _id: m._id.toString(),
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
