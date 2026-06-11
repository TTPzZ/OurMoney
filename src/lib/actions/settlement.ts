"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Settlement from "@/models/Settlement";
import { revalidatePath } from "next/cache";

export async function markAsPaid(groupId: string, to: string, amount: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  await Settlement.create({
    groupId,
    from: session.user.id,
    to,
    amount,
    status: 'pending',
    paidAt: new Date()
  });

  revalidatePath(`/group/${groupId}`);
}

export async function confirmReceived(groupId: string, settlementId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  await Settlement.findByIdAndUpdate(settlementId, {
    status: 'completed',
    completedAt: new Date()
  });

  revalidatePath(`/group/${groupId}`);
}

export async function getSettlementsByGroupId(groupId: string) {
  await connectDB();
  const settlements = await Settlement.find({ groupId })
    .populate('from', 'name image')
    .populate('to', 'name image')
    .lean();
  
  return JSON.parse(JSON.stringify(settlements));
}
