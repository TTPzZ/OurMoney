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
        merchant: "Nhà hàng Phố Biển",
        totalAmount: 462000,
        items: [
          { name: "Lẩu Thái hải sản", quantity: 1, unitPrice: 350000, totalPrice: 350000 },
          { name: "Bia Tiger", quantity: 4, unitPrice: 20000, totalPrice: 80000 },
          { name: "Khăn lạnh", quantity: 4, unitPrice: 3000, totalPrice: 12000 },
          { name: "Đậu phộng rang", quantity: 1, unitPrice: 20000, totalPrice: 20000 },
        ]
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Extract raw base64 data and mimeType
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const mimeType = imageBase64.split(';')[0].split(':')[1] || "image/jpeg";

    const prompt = `Analyze this receipt image and extract details.
Return ONLY a valid JSON object with this exact structure:
{
  "merchant": "string (Vietnamese)",
  "totalAmount": number (total amount paid),
  "subtotal": number | null,
  "tax": number | null,
  "serviceCharge": number | null,
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
- "unitPrice" and "totalPrice" must be numbers (no currency symbols, dots, or commas).
- If an item doesn't have a quantity explicitly, assume 1.
- Ensure "totalAmount" is correctly identified from the receipt.
Do not include markdown formatting like \`\`\`json. Return just the raw JSON object.`;

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
    if (cleanedText.includes("```")) {
      const match = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        cleanedText = match[1];
      }
    }

    try {
      const data = JSON.parse(cleanedText.trim());
      // Ensure data has the required structure even if AI fails slightly
      const sanitized = {
        merchant: data.merchant || "Hóa đơn mới",
        totalAmount: data.totalAmount || 0,
        subtotal: data.subtotal || null,
        tax: data.tax || null,
        serviceCharge: data.serviceCharge || null,
        items: Array.isArray(data.items) ? data.items : []
      };
      return NextResponse.json(sanitized);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Response:", responseText);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

  } catch (error) {
    console.error("OCR API Error:", error);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
