import type { Bill } from "@/lib/utils/debt";

export interface GroupMember {
  _id: string;
  name: string;
  email?: string;
  image?: string | null;
}

export interface GroupListItem {
  _id: string;
  name: string;
  members: string[];
  inviteCode?: string;
  createdAt?: string;
}

export interface GroupDetail {
  _id: string;
  name: string;
  createdBy: string;
  inviteCode: string;
  members: GroupMember[];
}

export interface BillWithPayer extends Omit<Bill, "paidBy"> {
  _id: string;
  description: string;
  createdAt: string;
  paidBy: GroupMember;
}

export interface Settlement {
  _id: string;
  from: GroupMember;
  to: GroupMember;
  amount: number;
  status: "pending" | "completed";
  paidAt?: string;
  completedAt?: string;
}

export interface GroupDetailData {
  group: GroupDetail;
  bills: BillWithPayer[];
  settlements: Settlement[];
}
