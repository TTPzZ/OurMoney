"use server";

import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(name: string, image: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  await User.findByIdAndUpdate(session.user.id, {
    name,
    image,
    customName: name,
    customImage: image,
  });

  revalidatePath("/dashboard");
}

export async function updateGeminiKey(key: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  await User.findByIdAndUpdate(session.user.id, {
    geminiApiKey: key,
  });

  revalidatePath("/profile");
}
