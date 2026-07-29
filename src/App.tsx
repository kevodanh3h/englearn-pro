import React, { useState, useEffect, Component, ReactNode } from "react";
import { UploadView } from "./components/UploadView";
import { TheoryView } from "./components/TheoryView";
import { PracticeView } from "./components/PracticeView";
import { LessonData } from "./types";
import { BookOpen, GraduationCap, ChevronLeft, Plus, Book, Trash2 } from "lucide-react";
import { cn } from "./utils";

class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: error.message };
  }
  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="p-10 m-10 border-4 border-red-500 bg-red-50 rounded-2xl">
          <h1 className="text-3xl text-red-600 font-bold mb-4">LỖI HỆ THỐNG</h1>
          {/* @ts-ignore */}
          <p className="text-xl font-mono text-red-800">{this.state.errorMsg}</p>
          <p className="mt-4 text-slate-600">Vui lòng chụp ảnh màn hình này gửi cho đội ngũ kỹ thuật.</p>
        </div>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}

export default function App() {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [activeTab, setActiveTab] = useState<"theory" | "practice">("theory");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>("6");
  const [isStudentMode, setIsStudentMode] = useState(false);

  useEffect(() => {
    // Check student mode
    const params = new URLSearchParams(window.location.search);
    if (params.get("student") === "true") {
      setIsStudentMode(true);
    }

    // Fetch lessons from DB
    fetch("/api/lessons")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLessons(data);
      })
      .catch(e => console.error("Failed to load lessons", e));
  }, []);

  const saveLessons = (newLessons: LessonData[]) => {
    setLessons(newLessons);
  };

  const syncLessonToDB = async (lesson: LessonData) => {
    try {
      await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lesson)
      });
    } catch (e) {
      console.error("Failed to save lesson to DB", e);
    }
  };

  const handleUploadSuccess = (data: LessonData) => {
    const newLesson = { ...data, id: Date.now().toString(), grade: selectedGrade };
    const newLessons = [newLesson, ...lessons];
    saveLessons(newLessons);
    syncLessonToDB(newLesson);
    setLessonData(newLesson);
    setIsUploading(false);
  };

  const deleteLesson = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc muốn xoá bài học này?")) {
      saveLessons(lessons.filter(l => l.id !== id));
      try {
        await fetch(`/api/lessons/${id}`, { method: "DELETE" });
      } catch (e) {
        console.error("Failed to delete lesson", e);
      }
    }
  };

  const updateLesson = (updatedLesson: LessonData) => {
    setLessonData(updatedLesson);
    saveLessons(lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l));
    syncLessonToDB(updatedLesson);
  };

  const filteredLessons = lessons.filter(l => (l.grade || "6") === selectedGrade);

  if (!lessonData && !isUploading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <header className="bg-white border-b border-slate-200 px-6 py-8 shadow-sm flex flex-col items-center sticky top-0 z-10">
          <div className="flex items-center mb-2">
            <GraduationCap className="w-10 h-10 text-blue-600 mr-3" />
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">EngLearn Pro</h1>
          </div>
          <p className="text-slate-500 font-medium mb-6">Teacher: Bùi Văn Hải</p>
          
          <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {[
              { id: "6", label: "Khối 6" },
              { id: "7", label: "Khối 7" },
              { id: "8", label: "Khối 8" },
              { id: "9", label: "Khối 9" },
              { id: "general", label: "Tổng hợp" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedGrade(tab.id)}
                className={cn(
                  "px-6 py-2 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap",
                  selectedGrade === tab.id 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              Danh sách bài học - {selectedGrade === 'general' ? 'Tổng hợp' : `Khối ${selectedGrade}`}
            </h2>
            {!isStudentMode && (
              <button 
                onClick={() => setIsUploading(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tạo bài học
              </button>
            )}
          </div>

          {filteredLessons.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-slate-600">
                Chưa có bài học nào cho {selectedGrade === 'general' ? 'phần Tổng hợp' : `Khối ${selectedGrade}`}
              </h2>
              <p className="text-slate-500 mt-2">Hãy tải lên một file PDF sách giáo khoa để bắt đầu.</p>
              {!isStudentMode && (
                <button 
                  onClick={() => setIsUploading(true)}
                  className="mt-6 inline-flex items-center px-6 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                >
                  Tải lên ngay
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessons.map(lesson => (
                <div 
                  key={lesson.id} 
                  onClick={() => setLessonData(lesson)}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col group relative"
                >
                  {!isStudentMode && (
                    <button 
                      onClick={(e) => deleteLesson(lesson.id!, e)}
                      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      title="Xoá bài học"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-blue-600 group-hover:scale-110 transition-transform">
                    <Book className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{lesson.title}</h3>
                  <div className="mt-auto pt-4 flex gap-4 text-sm text-slate-500 border-t border-slate-100">
                    <span className="flex items-center"><BookOpen className="w-4 h-4 mr-1"/> {lesson.partI?.vocabulary?.length || 0} Từ vựng</span>
                    <span className="flex items-center"><GraduationCap className="w-4 h-4 mr-1"/> {lesson.partI?.grammar?.length || 0} Ngữ pháp</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center shadow-sm">
          <button 
            onClick={() => setIsUploading(false)}
            className="p-2 mr-4 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <GraduationCap className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Thêm bài học mới - Khối {selectedGrade}</h1>
        </header>
        <main className="container mx-auto py-12">
          <UploadView onUploadSuccess={handleUploadSuccess} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => { setLessonData(null); setIsUploading(false); }}
              className="mr-4 p-2 text-slate-500 hover:bg-slate-100 rounded-full hidden sm:block"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <GraduationCap className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-xl font-bold text-slate-800 hidden md:block">EngLearn Pro</h1>
            <div className="hidden md:block w-px h-6 bg-slate-300 mx-4"></div>
            <h2 className="text-lg font-medium text-slate-600 truncate max-w-[200px] sm:max-w-md md:max-w-lg">
              {typeof lessonData!.title === 'string' ? lessonData!.title : "Bài học mới"}
            </h2>
          </div>
          <button 
            onClick={() => { setLessonData(null); setIsUploading(false); }}
            className="sm:hidden flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Trở lại
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 mt-2 pb-2">
          <button
            onClick={() => setActiveTab("theory")}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center",
              activeTab === "theory" 
                ? "bg-blue-600 text-white shadow-md" 
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Phần I. Kiến thức
          </button>
          <button
            onClick={() => setActiveTab("practice")}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center",
              activeTab === "practice" 
                ? "bg-blue-600 text-white shadow-md" 
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Phần II. Bài tập
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          {activeTab === "theory" ? (
            <TheoryView vocabulary={lessonData!.partI?.vocabulary || []} grammar={lessonData!.partI?.grammar || []} />
          ) : (
            <PracticeView 
              data={lessonData!.partII || {}} 
              lessonContext={{ title: lessonData!.title || "Bài học", vocabulary: lessonData!.partI?.vocabulary || [], grammar: lessonData!.partI?.grammar || [] }}
              onUpdate={(newData) => updateLesson({ ...lessonData!, partII: newData })}
              isStudentMode={isStudentMode}
            />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}
