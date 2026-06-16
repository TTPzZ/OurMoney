import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Tesseract from 'tesseract.js';

function parseRawText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let totalAmount = 0;
  const items: any[] = [];
  let merchant = "Hóa đơn mới";

  // Simple merchant heuristic (first non-empty line)
  if (lines.length > 0) merchant = lines[0];

  // Regex patterns for total
  const totalPatterns = [
    /(?:TỔNG|TONG|TOTAL|THANH TOAN|CỘNG|CONG)[:\s]+([\d.,]+)/i,
    /([\d.,]+)\s*(?:VNĐ|VND|Đ|D)/i,
  ];

  for (const line of lines) {
    // Try to find total
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        const value = parseInt(match[1].replace(/[.,]/g, ''));
        if (value > totalAmount) totalAmount = value;
      }
    }

    // Try to find items (simple heuristic: line with a number that looks like price)
    const itemMatch = line.match(/^(.+?)\s+([\d.,]+)$/);
    if (itemMatch) {
      const name = itemMatch[1].trim();
      const price = parseInt(itemMatch[2].replace(/[.,]/g, ''));
      if (price > 1000 && price < totalAmount && !line.toLowerCase().includes('tổng')) {
        items.push({
          name,
          quantity: 1,
          unitPrice: price,
          totalPrice: price
        });
      }
    }
  }

  return { merchant, totalAmount, items };
}

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

    // Extract raw base64 data and mimeType
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const buffer = Buffer.from(base64Data, 'base64');

    // 1. Try Free OCR (Tesseract)
    console.log("[OCR] Attempting Tesseract...");
    const { data: { text } } = await Tesseract.recognize(buffer, 'vie+eng');
    const ocrResult = parseRawText(text);

    if (ocrResult.totalAmount > 0 && ocrResult.items.length > 0) {
      console.log("[OCR] Tesseract successful");
      return NextResponse.json({ ...ocrResult, scanSource: "ocr" });
    }

    // 2. Fallback to Gemini with User's Key
    console.log("[OCR] Tesseract failed, checking user Gemini Key...");
    await connectDB();
    const user = await User.findById(session.user.id).select("geminiApiKey");
    
    if (!user?.geminiApiKey) {
      return NextResponse.json({ 
        error: "Không đọc được hóa đơn. Hãy thêm Gemini API Key trong Hồ sơ để bật AI OCR.",
        needKey: true
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(user.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
          mimeType: imageBase64.split(';')[0].split(':')[1] || "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text().trim();
    let cleanedText = responseText;
    if (cleanedText.includes("```")) {
      const match = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) cleanedText = match[1];
    }

    try {
      const data = JSON.parse(cleanedText.trim());
      return NextResponse.json({ 
        ...data, 
        scanSource: "ai" 
      });
    } catch (parseError) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

  } catch (error) {
    console.error("OCR API Error:", error);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
