import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email?: string;
  image?: string;
  facebookId: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  image: { type: String },
  facebookId: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = (mongoose.models && mongoose.models.User) || mongoose.model<IUser>('User', UserSchema);

export default User;
