import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextRequest } from "next/server";

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }

  try {
    await connectDB();
    const user = await User.findById(userId).select("paymentQR").lean();

    if (!user || !user.paymentQR) {
      return new Response("QR Code not found", { status: 404 });
    }

    const image = user.paymentQR;

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
    console.error("Error fetching QR code:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
