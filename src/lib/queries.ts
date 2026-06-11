import connectDB from "@/lib/db";
import Group from "@/models/Group";
import Bill from "@/models/Bill";
import Settlement from "@/models/Settlement";
import { toPublicUser, USER_PUBLIC_SELECT, type PublicUserDocument } from "@/lib/current-user";
import type { BillWithPayer, GroupDetail, Settlement as SettlementData } from "@/lib/money-types";

type ObjectIdLike = { toString(): string };

interface PopulatedGroupForUser {
  _id: ObjectIdLike;
  name: string;
  createdBy: ObjectIdLike | string;
  inviteCode: string;
  members: PublicUserDocument[];
}

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizePublicUser(user: unknown) {
  return toPublicUser(user as PublicUserDocument);
}

export async function getGroupsForUser(userId: string) {
  await connectDB();
  const groups = await Group.find({ members: userId })
    .select("name members inviteCode createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(groups));
}

export async function getGroupByIdForUser(groupId: string, userId: string): Promise<GroupDetail | null> {
  await connectDB();
  const group = await Group.findById(groupId)
    .populate("members", USER_PUBLIC_SELECT)
    .select("name members createdBy inviteCode")
    .lean() as unknown as PopulatedGroupForUser | null;
  if (!group) return null;
  // Ensure user is member
  const isMember = group.members.some((m) => m._id.toString() === userId);
  if (!isMember) return null;

  return serialize({
    ...group,
    members: group.members.map(normalizePublicUser),
  }) as GroupDetail;
}

export async function getBillsByGroupId(groupId: string): Promise<BillWithPayer[]> {
  await connectDB();
  const bills = await Bill.find({ groupId })
    .populate("paidBy", USER_PUBLIC_SELECT)
    .select("description totalAmount paidBy splits createdAt")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return serialize(
    bills.map((bill) => ({
      ...bill,
      paidBy: normalizePublicUser(bill.paidBy),
    })),
  ) as unknown as BillWithPayer[];
}

export async function getSettlementsByGroupId(groupId: string): Promise<SettlementData[]> {
  await connectDB();
  const settlements = await Settlement.find({ groupId })
    .populate('from', USER_PUBLIC_SELECT)
    .populate('to', USER_PUBLIC_SELECT)
    .select("from to amount status paidAt completedAt")
    .lean();
  return serialize(
    settlements.map((settlement) => ({
      ...settlement,
      from: normalizePublicUser(settlement.from),
      to: normalizePublicUser(settlement.to),
    })),
  ) as unknown as SettlementData[];
}
