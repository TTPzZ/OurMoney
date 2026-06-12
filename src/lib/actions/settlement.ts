"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Settlement from "@/models/Settlement";
import { toPublicUser, USER_PUBLIC_SELECT, type PublicUserDocument } from "@/lib/current-user";

export async function markAsPaid(groupId: string, to: string, amount: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  // Verify membership
  const Group = (await import("@/models/Group")).default;
  const isMember = await Group.exists({ _id: groupId, members: session.user.id });
  if (!isMember) throw new Error("Forbidden");

  await Settlement.create({
    groupId,
    from: session.user.id,
    to,
    amount,
    status: 'pending',
    paidAt: new Date()
  });
}

export async function confirmReceived(groupId: string, settlementId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  // Verify membership
  const Group = (await import("@/models/Group")).default;
  const isMember = await Group.exists({ _id: groupId, members: session.user.id });
  if (!isMember) throw new Error("Forbidden");

  await Settlement.findByIdAndUpdate(settlementId, {
    status: 'completed',
    completedAt: new Date()
  });
}

export async function directConfirm(groupId: string, from: string, amount: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  // Verify membership
  const Group = (await import("@/models/Group")).default;
  const isMember = await Group.exists({ _id: groupId, members: session.user.id });
  if (!isMember) throw new Error("Forbidden");

  // Create a completed settlement directly
  await Settlement.create({
    groupId,
    from,
    to: session.user.id,
    amount,
    status: 'completed',
    paidAt: new Date(),
    completedAt: new Date()
  });
}

export async function getSettlementsByGroupId(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();

  // Verify membership
  const Group = (await import("@/models/Group")).default;
  const isMember = await Group.exists({ _id: groupId, members: session.user.id });
  if (!isMember) return [];

  const settlements = await Settlement.find({ groupId })
    .populate('from', USER_PUBLIC_SELECT)
    .populate('to', USER_PUBLIC_SELECT)
    .lean();
  
  return JSON.parse(JSON.stringify(
    settlements.map((settlement) => ({
      ...settlement,
      from: toPublicUser(settlement.from as unknown as PublicUserDocument),
      to: toPublicUser(settlement.to as unknown as PublicUserDocument),
    })),
  ));
}
