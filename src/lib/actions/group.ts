"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

export async function createGroup(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  const inviteCode = nanoid(10); // 10 chars short code
  
  const newGroup = await Group.create({
    name,
    createdBy: session.user.id,
    members: [session.user.id],
    inviteCode,
  });

  revalidatePath("/dashboard");
  return { success: true, groupId: newGroup._id.toString() };
}

export async function getGroups() {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();

  const groups = await Group.find({ members: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(groups));
}

export async function joinGroupByCode(inviteCode: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  const group = await Group.findOne({ inviteCode });
  if (!group) throw new Error("Group not found");

  const isMember = group.members.some((m: unknown) => String(m) === session.user.id);
  if (isMember) {
    return { success: true, groupId: group._id.toString() };
  }

  group.members.push(session.user.id as unknown as never);
  await group.save();

  revalidatePath("/dashboard");
  return { success: true, groupId: group._id.toString() };
}

export async function deleteGroup(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  // In a real app, you might want to check if the user is the creator
  const group = await Group.findById(groupId);
  if (!group) throw new Error("Group not found");

  // Optional: Check if user is the creator
  // if (group.createdBy.toString() !== session.user.id) throw new Error("Only creators can delete groups");

  const Bill = (await import("@/models/Bill")).default;
  const Settlement = (await import("@/models/Settlement")).default;

  await Bill.deleteMany({ groupId });
  await Settlement.deleteMany({ groupId });
  await Group.findByIdAndDelete(groupId);

  revalidatePath("/dashboard");
}

export async function getGroupById(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  
  const group = await Group.findById(id)
    .populate("members", "name image email")
    .lean();
    
  if (!group) return null;
  
  return JSON.parse(JSON.stringify(group));
}
