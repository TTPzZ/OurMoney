"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { toPublicUser, USER_PUBLIC_SELECT, type PublicUserDocument } from "@/lib/current-user";

type ObjectIdLike = { toString(): string };

interface BillDebtSource {
  paidBy: ObjectIdLike;
  totalAmount: number;
  splits: { userId: ObjectIdLike | string; amount: number }[];
}

interface SettlementDebtSource {
  from: ObjectIdLike;
  to: ObjectIdLike;
  amount: number;
}

interface PopulatedGroup {
  members: PublicUserDocument[];
}

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

export async function joinGroupByCode(code: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  // ONLY allow joining by inviteCode, NEVER by groupId directly
  const group = await Group.findOne({ inviteCode: code }).select("_id members");
  
  if (!group) throw new Error("Mã nhóm không tồn tại");

  const isMember = group.members.some((m: ObjectIdLike) => m.toString() === session.user.id);
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

  const memberIds = group.members.map((m: ObjectIdLike) => m.toString());
  const billsForDebt = bills as unknown as BillDebtSource[];
  const settlementsForDebt = settlements as unknown as SettlementDebtSource[];
  const transactions = simplifyDebts(
    billsForDebt.map((b) => ({
      ...b,
      paidBy: b.paidBy.toString(),
      splits: b.splits.map((split) => ({
        userId: split.userId.toString(),
        amount: split.amount,
      })),
    })),
    memberIds,
    settlementsForDebt.map((s) => ({
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
  
  const group = await Group.findOne({
    _id: id,
    members: session.user.id
  })
    .populate("members", USER_PUBLIC_SELECT)
    .lean<PopulatedGroup>();
    
  if (!group) return null;
  
  return JSON.parse(JSON.stringify({
    ...group,
    members: group.members.map((member) => toPublicUser(member as unknown as PublicUserDocument)),
  }));
}
