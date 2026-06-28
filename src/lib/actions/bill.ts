"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Bill from "@/models/Bill";
import { toPublicUser, USER_PUBLIC_SELECT, type PublicUserDocument } from "@/lib/current-user";

export async function createBill(
  groupId: string,
  data: {
    description: string;
    totalAmount: number;
    paidBy: string;
    splits: { userId: string; amount: number }[];
    scanSource?: 'ocr' | 'ai' | null;
    imageUrl?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  // Verify membership
  const Group = (await import("@/models/Group")).default;
  const isMember = await Group.exists({ _id: groupId, members: session.user.id });
  if (!isMember) throw new Error("Forbidden");

  const bill = await Bill.create({
    groupId,
    description: data.description,
    totalAmount: data.totalAmount,
    paidBy: data.paidBy,
    splits: data.splits,
    scanSource: data.scanSource,
    imageUrl: data.imageUrl,
  });

  return JSON.parse(JSON.stringify(
    await Bill.findById(bill._id).populate("paidBy", USER_PUBLIC_SELECT).lean()
  ));
}

export async function getBillsByGroupId(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();

  // Verify membership
  const Group = (await import("@/models/Group")).default;
  const isMember = await Group.exists({ _id: groupId, members: session.user.id });
  if (!isMember) return [];

  const bills = await Bill.find({ groupId })
    .populate("paidBy", USER_PUBLIC_SELECT)
    .populate("splits.userId", USER_PUBLIC_SELECT)
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(
    bills.map((bill) => ({
      ...bill,
      paidBy: toPublicUser(bill.paidBy as unknown as PublicUserDocument),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      splits: bill.splits.map((split: any) => ({
        ...split,
        userId: toPublicUser(split.userId as unknown as PublicUserDocument),
      })),
    })),
  ));
}
export async function deleteBill(billId: string, groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  // Verify membership and fetch group to check creator
  const Group = (await import("@/models/Group")).default;
  const group = await Group.findById(groupId);
  if (!group || !group.members.includes(session.user.id)) {
    throw new Error("Forbidden");
  }

  const bill = await Bill.findById(billId);
  if (!bill) throw new Error("Bill not found");

  // Only allow bill creator (paidBy) or group creator to delete
  const isPaidBy = bill.paidBy.toString() === session.user.id;
  const isGroupCreator = group.createdBy.toString() === session.user.id;

  if (!isPaidBy && !isGroupCreator) {
    throw new Error("Không có quyền xóa hóa đơn này");
  }

  await Bill.findByIdAndDelete(billId);
  return { success: true };
}
