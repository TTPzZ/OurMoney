import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { toPublicUser, type PublicUserDocument } from "@/lib/current-user";
import User from "@/models/User";
import { NextResponse } from "next/server";

export const preferredRegion = "sin1";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .select("name image email createdAt updatedAt")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: toPublicUser(user as unknown as PublicUserDocument) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: unknown;
      image?: unknown;
    };

    const update: { name?: string; image?: string } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      update.name = name;
    }

    if (typeof body.image === "string") {
      update.image = body.image;
    }

    if (!update.name && !update.image) {
      return NextResponse.json({ error: "No profile fields to update" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(session.user.id, update, {
      new: true,
      runValidators: true,
    })
      .select("name image email createdAt updatedAt")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: toPublicUser(user as unknown as PublicUserDocument) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
