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
    .select("name members inviteCode createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(groups));
}

export async function joinGroupByCode(inviteCode: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  const group = await Group.findOne({ inviteCode }).select("_id members");
  if (!group) throw new Error("Mã nhóm không tồn tại");

  const isMember = group.members.some((m: any) => m.toString() === session.user.id);
  if (isMember) {
    return { success: true, groupId: group._id.toString() };
  }

  await Group.findByIdAndUpdate(group._id, {
    $push: { members: session.user.id }
  });

  revalidatePath("/dashboard");
  return { success: true, groupId: group._id.toString() };
}

export async function deleteGroup(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  const group = await Group.findById(groupId).select("createdBy");
  if (!group) throw new Error("Group not found");

  if (group.createdBy.toString() !== session.user.id) {
    throw new Error("Chỉ trưởng nhóm mới có quyền xóa nhóm");
  }

  const Bill = (await import("@/models/Bill")).default;
  const Settlement = (await import("@/models/Settlement")).default;

  await Promise.all([
    Bill.deleteMany({ groupId }),
    Settlement.deleteMany({ groupId }),
    Group.findByIdAndDelete(groupId)
  ]);

  revalidatePath("/dashboard");
}

export async function leaveGroup(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  const group = await Group.findById(groupId).select("members createdBy");
  if (!group) throw new Error("Group not found");

  if (group.createdBy.toString() === session.user.id) {
    throw new Error("Trưởng nhóm không thể rời nhóm. Hãy xóa nhóm hoặc chuyển quyền.");
  }

  // Check balance before leaving
  const Bill = (await import("@/models/Bill")).default;
  const Settlement = (await import("@/models/Settlement")).default;
  const { simplifyDebts } = await import("@/lib/utils/debt");

  const [bills, settlements] = await Promise.all([
    Bill.find({ groupId }).lean(),
    Settlement.find({ groupId, status: "completed" }).lean()
  ]);

  const memberIds = group.members.map((m: any) => m.toString());
  const transactions = simplifyDebts(
    bills.map((b: any) => ({
      ...b,
      paidBy: b.paidBy.toString()
    })),
    memberIds,
    settlements.map((s: any) => ({
      from: s.from.toString(),
      to: s.to.toString(),
      amount: s.amount
    }))
  );

  const userDebt = transactions.some(t => t.from === session.user.id || t.to === session.user.id);

  if (userDebt) {
    throw new Error("Bạn phải hoàn thành tất cả khoản nợ hoặc tiền nhận trước khi rời nhóm!");
  }

  await Group.findByIdAndUpdate(groupId, {
    $pull: { members: session.user.id }
  });

  revalidatePath("/dashboard");
}

export async function getGroupById(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  
  const group = await Group.findById(id)
    .populate("members", "name image")
    .lean();
    
  if (!group) return null;
  
  return JSON.parse(JSON.stringify(group));
}
