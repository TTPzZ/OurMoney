import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });
    }

    // Gemini only - User's Key
    await connectDB();
    const user = await User.findById(session.user.id).select("geminiApiKey");
    
    if (!user?.geminiApiKey) {
      return NextResponse.json({ 
        error: "Không thể nhận diện hóa đơn bằng OCR thường. Hãy thêm Gemini API Key trong Hồ sơ để bật AI OCR.",
        needKey: true
      }, { status: 400 });
    }

    console.log("[OCR AI] Starting Gemini analysis...");
    const aiStart = Date.now();
    
    const genAI = new GoogleGenerativeAI(user.geminiApiKey);
    
    // Use gemini-2.5-flash as requested by user
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const mimeType = imageBase64.split(';')[0].split(':')[1] || "image/jpeg";

    const prompt = `Analyze this receipt image and extract details.
Return ONLY a valid JSON object with this exact structure:
{
  "merchant": "string (Vietnamese)",
  "totalAmount": number (total amount paid),
  "items": [
    {
      "name": "string (Vietnamese)",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number
    }
  ]
}
Notes:
- "unitPrice" and "totalPrice" must be numbers.
- If an item doesn't have a quantity explicitly, assume 1.
Do not include markdown.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ]);

    const responseText = result.response.text().trim();
    const aiDuration = Date.now() - aiStart;
    
    let cleanedText = responseText;
    if (cleanedText.includes("```")) {
      const match = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) cleanedText = match[1];
    }

    try {
      const data = JSON.parse(cleanedText.trim());
      console.log(`[OCR AI] Gemini finished in ${aiDuration}ms. Success: true`);
      return NextResponse.json({ 
        ...data, 
        scanSource: "ai" 
      });
    } catch (parseError) {
      console.log(`[OCR AI] Gemini finished in ${aiDuration}ms. Success: false (Parse Error)`);
      return NextResponse.json({ error: "AI trả về dữ liệu không đúng cấu trúc. Hãy thử lại." }, { status: 500 });
    }

  } catch (error: any) {
    const errorDetails = error?.message || "Lỗi không xác định";
    const statusCode = error?.status || 500;
    
    console.error(`[OCR AI Error] Status: ${statusCode}, Message: ${errorDetails}`);
    
    // Specific check for model not found
    if (errorDetails.includes("not found") || statusCode === 404) {
      return NextResponse.json({ 
        error: `Model AI 'gemini-2.5-flash' không tồn tại hoặc chưa được hỗ trợ cho Key này. Lỗi: ${errorDetails}` 
      }, { status: 404 });
    }

    // Check for Quota Exceeded (429)
    if (statusCode === 429 || errorDetails.includes("429") || errorDetails.includes("Quota exceeded")) {
      return NextResponse.json({ 
        error: `Hết hạn mức AI (Quota Exceeded). Google báo: "${errorDetails}". Hãy đợi 1 phút hoặc thử lại.` 
      }, { status: 429 });
    }

    return NextResponse.json({ 
      error: `Lỗi AI: ${errorDetails}` 
    }, { status: statusCode });
  }
}
