import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { toPublicUser, USER_PUBLIC_SELECT, type PublicUserDocument } from "@/lib/current-user";
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
      .select(USER_PUBLIC_SELECT)
      .lean<PublicUserDocument>();

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
      resetName?: unknown;
      resetImage?: unknown;
    };

    await connectDB();
    const existingUser = await User.findById(session.user.id)
      .select(USER_PUBLIC_SELECT)
      .lean<PublicUserDocument>();

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const update: {
      name?: string;
      image?: string | null;
      customName?: string | null;
      customImage?: string | null;
    } = {};

    if (body.resetName === true) {
      update.customName = null;
      update.name = existingUser.googleName || existingUser.email || existingUser.name || "User";
    } else if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      update.customName = name;
      update.name = name;
    }

    if (body.resetImage === true) {
      update.customImage = null;
      update.image = existingUser.googleImage || null;
    } else if (typeof body.image === "string") {
      if (!body.image) {
        return NextResponse.json({ error: "Image is required" }, { status: 400 });
      }
      update.customImage = body.image;
      update.image = body.image;
    }

    if (
      update.name === undefined &&
      update.image === undefined &&
      update.customName === undefined &&
      update.customImage === undefined
    ) {
      return NextResponse.json({ error: "No profile fields to update" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(session.user.id, update, {
      new: true,
      runValidators: true,
    })
      .select(USER_PUBLIC_SELECT)
      .lean<PublicUserDocument>();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: toPublicUser(user as unknown as PublicUserDocument) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
