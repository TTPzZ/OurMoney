import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  inviteCode: string;
  createdAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  inviteCode: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now },
});

GroupSchema.index({ members: 1, createdAt: -1 });

const Group = (mongoose.models && mongoose.models.Group) || mongoose.model<IGroup>('Group', GroupSchema);

export default Group;
