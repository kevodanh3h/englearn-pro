import React, { useState, useRef } from "react";
import { UploadCloud, File, X, Loader2 } from "lucide-react";

interface UploadViewProps {
  onUploadSuccess: (data: any) => void;
}

export function UploadView({ onUploadSuccess }: UploadViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [startPage, setStartPage] = useState<string>("1");
  const [endPage, setEndPage] = useState<string>("5");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setError("");
      } else {
        setError("Vui lòng tải lên định dạng PDF.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError("");
      } else {
        setError("Vui lòng tải lên định dạng PDF.");
      }
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("startPage", startPage);
    formData.append("endPage", endPage);

    try {
      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error("File quá lớn. Vui lòng tải lên file nhỏ hơn (dưới 10MB) hoặc chia nhỏ file PDF.");
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi khi xử lý file (Status: ${response.status}).`);
      }

      const data = await response.json();
      onUploadSuccess(data);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Tải lên bài học</h2>
          <p className="text-slate-500 mt-2">Tải lên sách giáo khoa tiếng Anh (PDF) để tự động tạo bài giảng và bài tập.</p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer
            ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400 bg-slate-50"}
            ${file ? "border-green-400 bg-green-50" : ""}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />

          {!file ? (
            <>
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <UploadCloud className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-lg font-medium text-slate-700">Kéo thả file PDF vào đây</p>
              <p className="text-sm text-slate-500 mt-1">hoặc click để chọn file</p>
            </>
          ) : (
            <div className="flex items-center space-x-4 w-full max-w-md mx-auto bg-white p-4 rounded-lg shadow-sm border border-green-100">
              <div className="bg-green-100 p-3 rounded-lg">
                <File className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-6">
            <h4 className="font-semibold text-slate-700 mb-3">Tùy chọn cắt sách PDF (Bắt buộc nếu là sách dày)</h4>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Từ trang</label>
                <input type="number" min="1" value={startPage} onChange={(e) => setStartPage(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Đến trang</label>
                <input type="number" min="1" value={endPage} onChange={(e) => setEndPage(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 italic">Mẹo: Chỉ nên chọn khoảng 5-10 trang chứa nội dung Unit bạn muốn dạy để AI phân tích tốt nhất và không bị quá tải.</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleProcess}
            disabled={!file || isLoading}
            className={`
              flex items-center justify-center px-8 py-3 rounded-full font-medium text-white transition-all
              ${!file || isLoading 
                ? "bg-slate-300 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang xử lý (có thể mất 1-2 phút)...
              </>
            ) : (
              "Tạo bài học ngay"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
