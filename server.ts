import "dotenv/config";
import express from "express";
import path from "path";
import multer from "multer";
import os from "os";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { PDFDocument } from 'pdf-lib';
import { db } from './db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Multer for disk uploads
  const upload = multer({ dest: os.tmpdir() });
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // API Route for uploading and processing PDF
  app.post("/api/generate-lesson", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let fileToUpload = req.file.path;
      const startPage = parseInt(req.body.startPage);
      const endPage = parseInt(req.body.endPage);

      if (!isNaN(startPage) && !isNaN(endPage) && req.file.mimetype === 'application/pdf') {
        console.log(`Slicing PDF from page ${startPage} to ${endPage}`);
        try {
          const pdfBytes = fs.readFileSync(req.file.path);
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const totalPages = pdfDoc.getPageCount();
          
          const actualStart = Math.max(0, startPage - 1);
          const actualEnd = Math.min(totalPages - 1, endPage - 1);
          
          if (actualStart <= actualEnd) {
            const newPdf = await PDFDocument.create();
            const pageIndices = [];
            for (let i = actualStart; i <= actualEnd; i++) pageIndices.push(i);
            
            const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
            copiedPages.forEach(page => newPdf.addPage(page));
            
            const newPdfBytes = await newPdf.save();
            const slicedPath = path.join(os.tmpdir(), `sliced_${Date.now()}.pdf`);
            fs.writeFileSync(slicedPath, newPdfBytes);
            fileToUpload = slicedPath;
            console.log("Sliced PDF created at:", slicedPath);
          }
        } catch (pdfErr) {
          console.error("Error slicing PDF, falling back to original file:", pdfErr);
        }
      }

      console.log(`Processing file: ${req.file.originalname} (${req.file.size} bytes)`);

      // Upload file to Gemini File API
      let uploadedFile = await ai.files.upload({
        file: fileToUpload,
        config: {
          mimeType: req.file.mimetype,
        }
      });

      // Remove the local files
      try {
        if (fileToUpload !== req.file.path) fs.unlinkSync(fileToUpload);
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error deleting temp file:", err);
      }

      // Wait for the file to be processed
      console.log(`File uploaded. Status: ${uploadedFile.state}`);
      while (uploadedFile.state === "PROCESSING") {
        console.log("File is processing, waiting 2 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        uploadedFile = await ai.files.get({ name: uploadedFile.name });
      }

      if (uploadedFile.state === "FAILED") {
        throw new Error("Tệp PDF bị lỗi khi xử lý trên hệ thống Gemini.");
      }

      const prompt = `
        Bạn là một chuyên gia thiết kế chương trình học tiếng Anh. Dựa vào nội dung tài liệu đính kèm (hoặc phần nội dung của nó), hãy trích xuất và tạo ra một bài học hoàn chỉnh theo cấu trúc JSON.
        
        Nếu tài liệu không có sẵn các dạng bài tập cụ thể, BẠN PHẢI TỰ ĐỘNG SINH RA các bài tập cho đủ 8 dạng dưới đây dựa trên từ vựng và ngữ pháp của tài liệu.

        YÊU CẦU TRÍCH XUẤT ĐẦY ĐỦ: BẠN PHẢI TRÍCH XUẤT 100% TOÀN BỘ TỪ VỰNG VÀ TOÀN BỘ CẤU TRÚC NGỮ PHÁP CÓ TRONG TÀI LIỆU, TUYỆT ĐỐI KHÔNG ĐƯỢC LƯỢC BỎ, TÓM TẮT HAY BỎ SÓT BẤT KỲ TỪ VỰNG/NGỮ PHÁP NÀO. ĐÂY LÀ YÊU CẦU BẮT BUỘC.

        CHÚ Ý VÔ CÙNG QUAN TRỌNG: AI THƯỜNG BỊ NHẦM LẪN GIỮA TIẾNG ANH VÀ TIẾNG VIỆT. BẠN PHẢI TUÂN THỦ NGHIÊM NGẶT LUẬT SAU:
        - Các trường "word", "en", "correct", "paragraph", "conversation", "sentence", "topic" BẮT BUỘC 100% PHẢI LÀ TIẾNG ANH.
        - Tuyệt đối không được lấy nghĩa Tiếng Việt (ví dụ "trường học") để điền vào trường "word" hoặc "en".

        Cấu trúc JSON yêu cầu:
        {
          "title": "Tên bài học (BẮT BUỘC TRÍCH XUẤT THEO ĐÚNG ĐỊNH DẠNG 'UNIT [X]: [TÊN UNIT]', ví dụ: 'UNIT 1: MY NEW SCHOOL')",
          "partI": {
            "vocabulary": [{"word": "TỪ VỰNG TIẾNG ANH (VD: school)", "phonetic": "phiên âm (VD: /sku:l/)", "meaning": "Nghĩa tiếng Việt (VD: trường học)"}],
            "grammar": [{"structure": "Cấu trúc ngữ pháp tiếng Anh", "explanation": "Giải thích bằng tiếng Việt", "examples": [{"en": "Ví dụ tiếng Anh 1", "vn": "Nghĩa tiếng Việt 1"}]}]
          },
          "partII": {
            "type1": [{"vn": "Nghĩa tiếng Việt", "en": "TỪ TIẾNG ANH"}], // Luyện tập viết từ mới
            "type2": [{"word": "TỪ TIẾNG ANH"}], // Luyện nghe
            "type3": [{"jumbled": ["các", "từ", "tiếng", "anh", "xáo", "trộn"], "correct": "Câu TIẾNG ANH hoàn chỉnh đúng"}], // Viết câu theo cấu trúc
            "type4": {
              "paragraph": "Đoạn văn đọc hiểu TIẾNG ANH",
              "questions": [{"question": "Câu hỏi TIẾNG ANH?", "options": ["A", "B", "C", "D"], "answer": "Đáp án đúng (ví dụ: A)"}]
            },
            "type5": [{"conversation": "Đoạn hội thoại ngắn TIẾNG ANH", "translation": "Dịch sang tiếng Việt"}],
            "type6": [{"sentence": "Câu TIẾNG ANH để chép chính tả"}],
            "type7": {"topic": "Chủ đề viết đoạn văn ngắn bằng TIẾNG ANH"},
            "type8": [{"question": "Câu hỏi trắc nghiệm?", "options": ["A", "B", "C", "D"], "answer": "Đáp án đúng"}]
          }
        }
        
        Hãy luôn đảm bảo số lượng bài tập (type1, type2, type3, type5, type6, type8) có ít nhất 3-5 câu mỗi dạng. Type 4 có 1 đoạn văn và 3 câu hỏi. Type 7 có 1 chủ đề.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  fileUri: uploadedFile.uri,
                  mimeType: uploadedFile.mimeType || req.file.mimetype || "application/pdf",
                },
              },
              { text: prompt }
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");

      try {
        const parsed = JSON.parse(text);
        res.json(parsed);
      } catch (parseErr) {
        console.error("Failed to parse JSON response:", text);
        throw new Error("Invalid JSON response from model");
      }
    } catch (error: any) {
      console.error("Error processing file:", error);
      console.error("Error details:", error.stack || error);
      
      let errorMessage = error.message || "Lỗi khi xử lý file PDF.";
      if (error.status === 429 || (error.message && error.message.includes("429"))) {
        errorMessage = "API Key của bạn đã vượt quá giới hạn hoặc hết lượt dùng miễn phí (Quota exceeded). Hãy thử lại sau ít phút hoặc nâng cấp giới hạn API.";
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/generate-question", async (req, res) => {
    try {
      const { type, context, existingItems } = req.body;
      
      let prompt = `Bạn là một giáo viên tiếng Anh. Dựa vào nội dung bài học sau:
Tiêu đề: ${context.title}
Từ vựng: ${JSON.stringify(context.vocabulary)}
Ngữ pháp: ${JSON.stringify(context.grammar)}

ĐÂY LÀ CÁC BÀI TẬP ĐÃ CÓ (BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC TẠO CÂU HỎI TRÙNG LẶP VỚI BẤT KỲ CÂU NÀO TRONG DANH SÁCH NÀY):
${JSON.stringify(existingItems || [])}

Hãy tạo ra một câu hỏi HOÀN TOÀN MỚI (chưa từng xuất hiện ở trên) cho dạng bài tập: `;

      let schema;
      
      if (type === "type1") {
        prompt += "Dạng 1: Viết từ vựng. Cung cấp một từ tiếng Việt và nghĩa tiếng Anh tương ứng từ danh sách từ vựng.";
        schema = {
          type: Type.OBJECT,
          properties: {
            vn: { type: Type.STRING, description: "Nghĩa tiếng Việt" },
            en: { type: Type.STRING, description: "Từ tiếng Anh tương ứng" }
          },
          required: ["vn", "en"]
        };
      } else if (type === "type2") {
        prompt += "Dạng 2: Luyện nghe từ. Cung cấp một từ vựng tiếng Anh (để sinh ra bài tập luyện nghe).";
        schema = {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: "Từ tiếng Anh" }
          },
          required: ["word"]
        };
      } else if (type === "type3") {
        prompt += "Dạng 3: Ghép câu. Viết một câu hoàn chỉnh (áp dụng ngữ pháp bài học) và cung cấp danh sách các từ bị xáo trộn để người học ghép lại.";
        schema = {
          type: Type.OBJECT,
          properties: {
            jumbled: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mảng các từ bị xáo trộn" },
            correct: { type: Type.STRING, description: "Câu hoàn chỉnh đúng" }
          },
          required: ["jumbled", "correct"]
        };
      } else if (type === "type4") {
        prompt += "Dạng 4: Đọc hiểu. Cung cấp một câu hỏi trắc nghiệm dựa vào đoạn văn đọc hiểu của bài học.";
        schema = {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "Câu hỏi" },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 lựa chọn đáp án" },
            answer: { type: Type.STRING, description: "Đáp án đúng (phải khớp chính xác với 1 trong 4 lựa chọn)" }
          },
          required: ["question", "options", "answer"]
        };
      } else if (type === "type5") {
        prompt += "Dạng 5: Nghe dịch. Cung cấp một đoạn hội thoại ngắn bằng tiếng Anh (áp dụng từ vựng/ngữ pháp bài học) và bản dịch tiếng Việt tương ứng.";
        schema = {
          type: Type.OBJECT,
          properties: {
            conversation: { type: Type.STRING, description: "Đoạn hội thoại bằng tiếng Anh" },
            translation: { type: Type.STRING, description: "Bản dịch tiếng Việt" }
          },
          required: ["conversation", "translation"]
        };
      } else if (type === "type6") {
        prompt += "Dạng 6: Nghe chép chính tả. Cung cấp một câu tiếng Anh áp dụng từ vựng/ngữ pháp bài học.";
        schema = {
          type: Type.OBJECT,
          properties: {
            sentence: { type: Type.STRING, description: "Câu tiếng Anh" }
          },
          required: ["sentence"]
        };
      } else if (type === "type8") {
        prompt += "Dạng 8: Trắc nghiệm tổng hợp. Tạo một câu hỏi trắc nghiệm (về từ vựng hoặc ngữ pháp) của bài học này.";
        schema = {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "Câu hỏi" },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 lựa chọn đáp án" },
            answer: { type: Type.STRING, description: "Đáp án đúng (phải khớp chính xác với 1 trong 4 lựa chọn)" }
          },
          required: ["question", "options", "answer"]
        };
      }

      if (!schema) {
         return res.status(400).json({ error: "Unsupported question type for auto-generation" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      
      const text = response.text;
      if (!text) {
        throw new Error("Empty response from AI");
      }
      
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Error generating question:", error);
      let errorMessage = error.message || "Lỗi khi tạo câu hỏi tự động.";
      if (error.status === 429 || (error.message && error.message.includes("429"))) {
        errorMessage = "API Key của bạn đã vượt quá giới hạn (Quota exceeded).";
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  // DB Endpoints
  app.get("/api/lessons", async (req, res) => {
    try {
      const lessons = await db.getLessons();
      res.json(lessons);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.post("/api/lessons", async (req, res) => {
    try {
      await db.saveLesson(req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to save lesson" });
    }
  });

  app.delete("/api/lessons/:id", async (req, res) => {
    try {
      await db.deleteLesson(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  // Hint Endpoint
  app.post("/api/hint", async (req, res) => {
    try {
      const { type, question, context } = req.body;
      const prompt = `Nhiệm vụ: Tạo gợi ý điền từ cho câu hỏi tiếng Anh sau.
Dữ liệu câu hỏi: ${JSON.stringify(question)}

Quy tắc:
1. Tìm đáp án hoặc từ vựng chính tiếng Anh trong câu hỏi trên.
2. Trích xuất 2-3 chữ cái đầu tiên của từ đó.
3. Thêm dấu "..." vào cuối.
4. CHỈ trả về đúng chuỗi ký tự đó, TUYỆT ĐỐI KHÔNG trả lời thêm bất kỳ chữ nào khác.
Ví dụ: Nếu từ là "hello" -> "hel...", nếu từ là "dog" -> "do...".`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      res.json({ hint: response.text });
    } catch (error: any) {
      console.error("Error generating hint:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
