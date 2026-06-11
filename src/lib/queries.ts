import connectDB from "@/lib/db";
import Group from "@/models/Group";
import Bill from "@/models/Bill";
import Settlement from "@/models/Settlement";

export async function getGroupsForUser(userId: string) {
  await connectDB();
  const groups = await Group.find({ members: userId })
    .select("name members inviteCode createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(groups));
}

export async function getGroupByIdForUser(groupId: string, userId: string) {
  await connectDB();
  const group = (await Group.findById(groupId)
    .populate("members", "name image")
    .select("name members createdBy inviteCode")
    .lean()) as any;
  if (!group) return null;
  // Ensure user is member
  const isMember = group.members.some((m: any) => m._id.toString() === userId);
  if (!isMember) return null;
  return JSON.parse(JSON.stringify(group));
}

export async function getBillsByGroupId(groupId: string) {
  await connectDB();
  const bills = await Bill.find({ groupId })
    .populate("paidBy", "name image")
    .select("description totalAmount paidBy splits createdAt")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return JSON.parse(JSON.stringify(bills));
}

export async function getSettlementsByGroupId(groupId: string) {
  await connectDB();
  const settlements = await Settlement.find({ groupId })
    .populate('from', 'name image')
    .populate('to', 'name image')
    .select("from to amount status paidAt completedAt")
    .lean();
  return JSON.parse(JSON.stringify(settlements));
}
