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
  const start = Date.now();
  await connectDB();
  const group = await Group.findById(groupId)
    .populate("members", USER_PUBLIC_SELECT)
    .select("name members createdBy inviteCode")
    .lean() as unknown as PopulatedGroupForUser | null;
  
  const duration = Date.now() - start;
  console.log(`[Query] getGroupByIdForUser ${duration}ms`);

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
  const start = Date.now();
  await connectDB();
  const bills = await Bill.find({ groupId })
    .populate("paidBy", USER_PUBLIC_SELECT)
    .populate("splits.userId", USER_PUBLIC_SELECT)
    .select("description totalAmount paidBy splits imageUrl scanSource createdAt")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  
  const duration = Date.now() - start;
  console.log(`[Query] getBillsByGroupId ${duration}ms`);

  return serialize(
    bills.map((bill) => ({
      ...bill,
      paidBy: normalizePublicUser(bill.paidBy),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      splits: bill.splits.map((split: any) => ({
        ...split,
        userId: normalizePublicUser(split.userId),
      })),
    })),
  ) as unknown as BillWithPayer[];
}

export async function getSettlementsByGroupId(groupId: string): Promise<SettlementData[]> {
  const start = Date.now();
  await connectDB();
  const settlements = await Settlement.find({ groupId })
    .populate('from', USER_PUBLIC_SELECT)
    .populate('to', USER_PUBLIC_SELECT)
    .select("from to amount status paidAt completedAt")
    .lean();
  
  const duration = Date.now() - start;
  console.log(`[Query] getSettlementsByGroupId ${duration}ms`);

  return serialize(
    settlements.map((settlement) => ({
      ...settlement,
      from: normalizePublicUser(settlement.from),
      to: normalizePublicUser(settlement.to),
    })),
  ) as unknown as SettlementData[];
}
