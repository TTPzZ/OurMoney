import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email?: string;
  image?: string | null;
  googleId: string;
  googleName?: string | null;
  googleImage?: string | null;
  customName?: string | null;
  customImage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    image: { type: String },
    googleId: { type: String, unique: true, required: true },
    googleName: { type: String, default: null },
    googleImage: { type: String, default: null },
    customName: { type: String, default: null },
    customImage: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const User = (mongoose.models && mongoose.models.User) || mongoose.model<IUser>('User', UserSchema);

export default User;
