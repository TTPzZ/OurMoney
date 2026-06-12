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
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  const bill = await Bill.create({
    groupId,
    description: data.description,
    totalAmount: data.totalAmount,
    paidBy: data.paidBy,
    splits: data.splits,
  });

  return JSON.parse(JSON.stringify(
    await Bill.findById(bill._id).populate("paidBy", USER_PUBLIC_SELECT).lean()
  ));
}

export async function getBillsByGroupId(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();

  const bills = await Bill.find({ groupId })
    .populate("paidBy", USER_PUBLIC_SELECT)
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(
    bills.map((bill) => ({
      ...bill,
      paidBy: toPublicUser(bill.paidBy as unknown as PublicUserDocument),
    })),
  ));
}
