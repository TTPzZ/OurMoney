import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISettlement extends Document {
  groupId: Types.ObjectId;
  from: Types.ObjectId;
  to: Types.ObjectId;
  amount: number;
  status: 'pending' | 'completed';
  paidAt?: Date;
  completedAt?: Date;
}

const SettlementSchema = new Schema<ISettlement>({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  paidAt: { type: Date },
  completedAt: { type: Date },
});

const Settlement = (mongoose.models && mongoose.models.Settlement) || mongoose.model<ISettlement>('Settlement', SettlementSchema);

export default Settlement;
