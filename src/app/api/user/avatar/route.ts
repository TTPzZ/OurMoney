import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextRequest } from "next/server";

interface AvatarUser {
  name?: string | null;
  image?: string | null;
  googleName?: string | null;
  googleImage?: string | null;
  customName?: string | null;
  customImage?: string | null;
}

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }

  try {
    await connectDB();
    const user = await User.findById(userId)
      .select("name image googleName googleImage customName customImage")
      .lean<AvatarUser>();

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const image = user.customImage || user.image || user.googleImage;
    const name = user.customName || user.googleName || user.name || "User";

    if (!image) {
      return Response.redirect(
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      );
    }

    if (image.startsWith("data:image/")) {
      const parts = image.split(";base64,");
      if (parts.length !== 2) {
        return new Response("Invalid image data", { status: 400 });
      }

      const contentType = parts[0].split(":")[1];
      if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
        return new Response("Unsupported image type", { status: 415 });
      }

      const base64Data = parts[1];
      const imageBuffer = Buffer.from(base64Data, "base64");

      return new Response(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    return Response.redirect(new URL(image, request.url));
    
  } catch (error) {
    console.error("Error fetching avatar:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
