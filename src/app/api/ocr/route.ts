import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";

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

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback to Mock Data if API key is not configured
    if (!apiKey) {
      return NextResponse.json({
        items: [
          { name: "Lẩu Thái hải sản", price: 350000 },
          { name: "Bia Tiger (x4)", price: 80000 },
          { name: "Khăn lạnh (x4)", price: 12000 },
          { name: "Đậu phộng rang", price: 20000 },
        ]
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Extract raw base64 data and mimeType
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const mimeType = imageBase64.split(';')[0].split(':')[1] || "image/jpeg";

    const prompt = `Analyze this receipt image and extract all the ordered line items.
Return ONLY a valid JSON array of objects, where each object has exactly two properties:
- "name": The name of the item (string, Vietnamese)
- "price": The total price of that item row (number, without currency symbols, dots, or commas. E.g. 120000).
Ignore totals, subtotals, tax, and discount rows. Only extract actual purchased items.
Do not include markdown formatting like \`\`\`json. Return just the raw array.`;

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
    
    // Clean up potential markdown formatting from Gemini's response
    let cleanedText = responseText;
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }

    try {
      const items = JSON.parse(cleanedText.trim());
      return NextResponse.json({ items });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Response:", responseText);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

  } catch (error) {
    console.error("OCR API Error:", error);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
