import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextRequest } from "next/server";

interface AvatarUser {
  image?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }

  try {
    await connectDB();
    const user = await User.findById(userId).select("image").lean<AvatarUser>();

    if (!user || !user.image) {
      return new Response("Image not found", { status: 404 });
    }

    // Check if the image is a base64 string
    if (user.image.startsWith("data:image/")) {
      const parts = user.image.split(";base64,");
      const contentType = parts[0].split(":")[1];
      const base64Data = parts[1];
      const imageBuffer = Buffer.from(base64Data, "base64");

      return new Response(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, no-store",
        },
      });
    }

    // If it's a regular URL, redirect to it
    return Response.redirect(user.image);
    
  } catch (error) {
    console.error("Error fetching avatar:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
