"use client";

import { useState, useRef, useEffect } from "react";
import { PaddleOcrService } from "ppu-paddle-ocr/web";

const MODEL_BASE = "https://media.githubusercontent.com/media/PT-Perkasa-Pilar-Utama/ppu-paddle-ocr-models/refs/heads/main";
const DICT_BASE = "https://raw.githubusercontent.com/PT-Perkasa-Pilar-Utama/ppu-paddle-ocr-models/refs/heads/main";

import { preprocessImage, parseRawText } from "@/components/AddBillForm";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function OCRPlayground() {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(145);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [rawText, setRawText] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileRef.current = file;
    setImage(URL.createObjectURL(file));
    runOCR(file, threshold);
  };

  const [scanStatus, setScanStatus] = useState("");

  const runOCR = async (file: File, manualT: number) => {
    setIsProcessing(true);
    setProgress(0);
    setRawText("");
    setOcrResult(null);

    const thresholds = manualT > 0 ? [manualT] : [0, 130, 170]; // 0 là Adaptive
    let bestLocalResult = { text: "", parsed: null as any, image: "" };

    try {
      for (let i = 0; i < thresholds.length; i++) {
        const currentT = thresholds[i];
        setScanStatus(`Lần thử ${i + 1}: ${currentT === 0 ? "Adaptive (Tự thích nghi)" : `Ngưỡng cố định ${currentT}`}`);
        setProgress(((i + 1) / thresholds.length) * 100);

        const processed = await preprocessImage(file, currentT);
        setProcessedImage(processed);

        // Create an image element from the processed base64 to pass to PaddleOCR
        const img = new Image();
        img.src = processed;
        await new Promise((r) => (img.onload = r));

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0);

        const service = new PaddleOcrService({
          model: {
            detection: `${MODEL_BASE}/detection/PP-OCRv5_mobile_det_infer.onnx`,
            recognition: `${MODEL_BASE}/recognition/multi/latin/v5/latin_PP-OCRv5_mobile_rec_infer.onnx`,
            charactersDictionary: `${DICT_BASE}/recognition/multi/latin/v5/ppocrv5_latin_dict.txt`,
          },
        });

        await service.initialize();
        const result = await service.recognize(canvas);
        await service.destroy();

        const parsed = parseRawText(result.text);

        // Lưu kết quả nếu là kết quả "Tốt" đầu tiên hoặc là kết quả nhiều item nhất
        if (!bestLocalResult.parsed || (parsed.totalAmount > 0 && parsed.items.length >= bestLocalResult.parsed.items.length)) {
          bestLocalResult = { text: result.text, parsed, image: processed };
          setRawText(result.text);
          setOcrResult(parsed);
          setProcessedImage(processed);
        }

        // Nếu đã đủ tốt (có cả tiền và món), dừng lại luôn
        if (parsed.totalAmount > 0 && parsed.items.length > 0) {
          setScanStatus(`Thành công ở lần thử ${i + 1}!`);
          break;
        }
      }

      if (!bestLocalResult.parsed || bestLocalResult.parsed.totalAmount === 0) {
        setScanStatus("OCR nội bộ không tốt. Hệ thống thật sẽ gọi AI ở bước này.");
      }
    } catch (err) {
      console.error(err);
      setScanStatus("Lỗi khi xử lý OCR");
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setThreshold(val);
  };

  const reRun = () => {
    if (fileRef.current) {
      runOCR(fileRef.current, threshold);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-400">OCR Playground</h1>
            <p className="text-slate-400 mt-2">Thử nghiệm Tiền xử lý & PaddleOCR (Không cần Auth)</p>
            {scanStatus && (
              <div className="mt-2 inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-500/50 rounded-full text-xs font-bold text-indigo-300 animate-pulse">
                {scanStatus}
              </div>
            )}
          </div>
          <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
            Tải ảnh lên
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cột trái: Điều khiển và Ảnh */}
          <div className="space-y-6">
            <Card className="p-6 bg-slate-800 border-slate-700">
              <h2 className="text-lg font-bold mb-4">Chế độ quét</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Ngưỡng (Threshold): <span className="text-indigo-400 font-mono font-bold">{threshold === 0 ? "AUTO" : threshold}</span></span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="255" 
                  value={threshold} 
                  onChange={handleThresholdChange}
                  onMouseUp={reRun}
                  onTouchEnd={reRun}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-[10px] text-slate-400">
                  * Kéo về <span className="text-indigo-400 font-bold">0</span> để kích hoạt chế độ <span className="font-bold text-indigo-400">AUTO (Thử đa ngưỡng)</span>. Đây là chế độ mặc định của ứng dụng chính.
                </p>
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Ảnh sau khi xử lý (Tesseract thấy cái này)</h3>
              <div className="aspect-auto bg-black rounded-xl overflow-hidden border border-slate-700 min-h-[300px] flex items-center justify-center">
                {processedImage ? (
                  <img src={processedImage} alt="Processed" className="max-w-full h-auto" />
                ) : (
                  <p className="text-slate-600">Chưa có ảnh</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Ảnh gốc</h3>
              <div className="aspect-auto bg-slate-800 rounded-xl overflow-hidden border border-slate-700 min-h-[100px] flex items-center justify-center opacity-50">
                {image ? (
                  <img src={image} alt="Original" className="max-w-full h-auto" />
                ) : (
                  <p className="text-slate-600">Chưa có ảnh</p>
                )}
              </div>
            </div>
          </div>

          {/* Cột phải: Kết quả */}
          <div className="space-y-6">
            <Card className="p-6 bg-slate-800 border-slate-700 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Kết quả nhận diện</h2>
                {isProcessing && (
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-xs font-mono">{progress}%</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-6 overflow-auto">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Dữ liệu đã Parse (JSON)</h3>
                  <pre className="p-4 bg-slate-950 rounded-lg text-emerald-400 font-mono text-sm overflow-x-auto border border-slate-700">
                    {ocrResult ? JSON.stringify(ocrResult, null, 2) : "// Chờ dữ liệu..."}
                  </pre>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Văn bản thô (Raw Text)</h3>
                  <div className="p-4 bg-slate-950 rounded-lg text-slate-300 font-mono text-xs whitespace-pre-wrap border border-slate-700 min-h-[200px]">
                    {rawText || "// Chờ dữ liệu..."}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
