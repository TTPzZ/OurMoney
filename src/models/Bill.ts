import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBillSplit {
  userId: Types.ObjectId;
  amount: number;
}

export interface IBill extends Document {
  groupId: Types.ObjectId;
  description: string;
  totalAmount: number;
  paidBy: Types.ObjectId;
  splits: IBillSplit[];
  imageUrl?: string;
  scanSource?: 'ocr' | 'ai' | null;
  createdAt: Date;
}

const BillSchema = new Schema<IBill>({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  description: { type: String, required: true, trim: true, maxlength: 100 },
  totalAmount: { type: Number, required: true },
  paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  splits: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      amount: { type: Number, required: true },
    },
  ],
  imageUrl: { type: String },
  scanSource: { type: String, enum: ['ocr', 'ai'], default: null },
  createdAt: { type: Date, default: Date.now },
});

BillSchema.index({ groupId: 1, createdAt: -1 });
BillSchema.index({ paidBy: 1 });

const Bill = (mongoose.models && mongoose.models.Bill) || mongoose.model<IBill>('Bill', BillSchema);

export default Bill;
