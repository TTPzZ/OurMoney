import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email?: string;
  image?: string;
  googleId: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    image: { type: String },
    googleId: { type: String, unique: true, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const User = (mongoose.models && mongoose.models.User) || mongoose.model<IUser>('User', UserSchema);

export default User;
