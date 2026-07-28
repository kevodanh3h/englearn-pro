import React, { useState } from "react";
import { Volume2, CheckCircle2, XCircle, ArrowRight, Bot, Loader2 } from "lucide-react";
import { cn } from "../utils";
import { LessonData } from "../types";

function AutoGenerateButton({ type, lessonContext, existingItems, onGenerated }: { type: string, lessonContext: any, existingItems?: any, onGenerated: (item: any) => void }) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, context: lessonContext, existingItems })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onGenerated(data);
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleGenerate}
      disabled={loading}
      className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-medium transition-colors text-sm flex items-center"
    >
      {loading ? "Đang xử lý..." : "✨ Tạo tự động bằng AI"}
    </button>
  );
}

// Tải giọng nói tiếng Việt sẵn
let viVoice: SpeechSynthesisVoice | null = null;
const loadVoices = () => {
  const voices = window.speechSynthesis.getVoices();
  viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VI') || v.name.includes('Vietnamese')) || null;
};
// Gọi ngay và gắn sự kiện
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

const playSound = (isCorrect: boolean) => {
  const audio = new Audio(isCorrect ? 'https://www.soundjay.com/buttons/button-09.mp3' : 'https://www.soundjay.com/buttons/button-10.mp3');
  audio.play().catch(e => console.error("Audio play failed", e));
  
  try {
    const msg = new SpeechSynthesisUtterance(isCorrect ? "Em làm đúng rồi, chúc mừng em!" : "Em làm sai rồi, cố gắng lên nhé!");
    msg.lang = 'vi-VN';
    if (viVoice) msg.voice = viVoice;
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  } catch(e) {
    console.error("Speech synthesis failed", e);
  }
};

function HintButton({ question }: { question: any, lessonContext: any }) {
  const [showHint, setShowHint] = useState(false);

  // Tạo gợi ý trực tiếp không cần gọi AI để tránh lỗi lấy nhầm từ khóa JSON
  const getLocalHint = () => {
    let answer = "";
    if (question.en) answer = question.en;
    else if (question.word) answer = question.word;
    else if (question.correct) answer = question.correct;
    else if (question.sentence) answer = question.sentence;
    else if (question.answer) answer = question.answer;

    if (!answer) return "Không có gợi ý...";
    
    const words = answer.split(" ");
    if (words.length === 1) {
      return answer.slice(0, Math.max(1, Math.floor(answer.length / 2))) + "...";
    } else {
      return words.map(w => w.slice(0, 2) + "...").join(" ");
    }
  };

  return (
    <div className="mt-2">
      {!showHint ? (
        <button onClick={() => setShowHint(true)} className="text-sm text-amber-600 hover:text-amber-700 flex items-center font-medium">
          💡 Xin gợi ý
        </button>
      ) : (
        <div className="p-3 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-200 mt-2 whitespace-pre-wrap">
          <strong>💡 Gợi ý: </strong> {getLocalHint()}
        </div>
      )}
    </div>
  );
}

interface PracticeViewProps {
  data: any;
  lessonContext: { title: string, vocabulary: any[], grammar: any[] };
  onUpdate: (data: any) => void;
  isStudentMode?: boolean;
}

export function PracticeView({ data, lessonContext, onUpdate, isStudentMode = false }: PracticeViewProps) {
  const [activeTab, setActiveTab] = useState<number>(1);

  const tabs = [
    { id: 1, label: "D1: Viết từ vựng" },
    { id: 2, label: "D2: Luyện nghe từ" },
    { id: 3, label: "D3: Ghép câu" },
    { id: 4, label: "D4: Đọc hiểu" },
    { id: 5, label: "D5: Nghe dịch" },
    { id: 6, label: "D6: Nghe chép chính tả" },
    { id: 7, label: "D7: Viết luận" },
    { id: 8, label: "D8: Trắc nghiệm" },
  ];

  const handleAdd = (typeKey: keyof LessonData["partII"], newItem: any) => {
    if (typeKey === "type4" || typeKey === "type7") return;
    
    onUpdate({
      ...data,
      [typeKey]: [...(data[typeKey] as any[]), newItem]
    });
  };

  const handleAddType4Q = (newQ: any) => {
    onUpdate({
      ...data,
      type4: {
        ...data.type4,
        questions: [...data.type4.questions, newQ]
      }
    });
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      <div className="w-full md:w-64 shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">Dạng bài tập</h3>
          </div>
          <div className="flex flex-col p-2 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:p-8 min-h-[500px]">
        {activeTab === 1 && <Type1Exercise items={data.type1} lessonContext={lessonContext} onAdd={(item) => handleAdd("type1", item)} isStudentMode={isStudentMode} />}
        {activeTab === 2 && <Type2Exercise items={data.type2} lessonContext={lessonContext} onAdd={(item) => handleAdd("type2", item)} isStudentMode={isStudentMode} />}
        {activeTab === 3 && <Type3Exercise items={data.type3} lessonContext={lessonContext} onAdd={(item) => handleAdd("type3", item)} isStudentMode={isStudentMode} />}
        {activeTab === 4 && <Type4Exercise data={data.type4} lessonContext={lessonContext} onAddQ={handleAddType4Q} isStudentMode={isStudentMode} />}
        {activeTab === 5 && <Type5Exercise items={data.type5} lessonContext={lessonContext} onAdd={(item) => handleAdd("type5", item)} isStudentMode={isStudentMode} />}
        {activeTab === 6 && <Type6Exercise items={data.type6} lessonContext={lessonContext} onAdd={(item) => handleAdd("type6", item)} isStudentMode={isStudentMode} />}
        {activeTab === 7 && <Type7Exercise data={data.type7} isStudentMode={isStudentMode} />}
        {activeTab === 8 && <Type8Exercise items={data.type8} lessonContext={lessonContext} onAdd={(item) => handleAdd("type8", item)} isStudentMode={isStudentMode} />}
      </div>
    </div>
  );
}

const speak = (text: string) => {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  window.speechSynthesis.speak(u);
};

const fireConfetti = (big = false) => {
  if (!(window as any).confetti) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
    script.onload = () => runConfetti(big);
    document.body.appendChild(script);
  } else {
    runConfetti(big);
  }
};

const runConfetti = (big = false) => {
  const confetti = (window as any).confetti;
  if (!confetti) return;
  
  if (big) {
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
    var randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    var interval: any = setInterval(function() {
      var timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      var particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  } else {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 100
    });
  }
};

function Type1Exercise({ items, lessonContext, onAdd, isStudentMode }: { items: any[], lessonContext: any, onAdd: (item: any) => void, isStudentMode: boolean }) {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<{ [key: number]: boolean | null }>({});
  
  const [showAdd, setShowAdd] = useState(false);
  const [newVn, setNewVn] = useState("");
  const [newEn, setNewEn] = useState("");

  if (!items?.length) return <div>Không có dữ liệu bài tập dạng này.</div>;

  const checkAnswer = (idx: number, correctEn: string) => {
    const userAns = (answers[idx] || "").trim().toLowerCase();
    const correct = correctEn.trim().toLowerCase();
    const isCorrect = userAns === correct;
    playSound(isCorrect);
    setResults(prev => ({ ...prev, [idx]: isCorrect }));
    if (isCorrect) fireConfetti(false);
  };

  const handleAdd = () => {
    if (newVn.trim() && newEn.trim()) {
      onAdd({ vn: newVn.trim(), en: newEn.trim() });
      setNewVn("");
      setNewEn("");
      setShowAdd(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">Dạng 1: Luyện tập viết từ mới</h3>
        {!isStudentMode && (
          <div className="flex gap-4 items-center">
            <AutoGenerateButton type="type1" lessonContext={lessonContext} existingItems={items} onGenerated={onAdd} />
            <button onClick={() => setShowAdd(!showAdd)} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              + Thêm thủ công
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Nghĩa Tiếng Việt</label>
            <input type="text" value={newVn} onChange={e => setNewVn(e.target.value)} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: con chó" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Từ Tiếng Anh</label>
            <input type="text" value={newEn} onChange={e => setNewEn(e.target.value)} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: dog" />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Thêm</button>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
            <div className="w-48 font-medium text-slate-700">{item.vn}</div>
            <div className="flex-1 w-full">
              <input
                type="text"
                value={answers[idx] || ""}
                onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                placeholder="Nhập từ tiếng Anh..."
                className="w-full px-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer(idx, item.en)}
              />
              <HintButton question={{ en: item.en }} lessonContext={lessonContext} />
            </div>
            <button 
              onClick={() => checkAnswer(idx, item.en)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shrink-0"
            >
              Kiểm tra
            </button>
            <div className="w-10 flex justify-center shrink-0">
              {results[idx] === true && <CheckCircle2 className="text-green-500" />}
              {results[idx] === false && <XCircle className="text-red-500" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Type2Exercise({ items, lessonContext, onAdd, isStudentMode }: { items: any[], lessonContext: any, onAdd: (item: any) => void, isStudentMode: boolean }) {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<{ [key: number]: boolean | null }>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState("");

  if (!items?.length) return <div>Không có dữ liệu bài tập dạng này.</div>;

  const checkAnswer = (idx: number, correctWord: string) => {
    const userAns = (answers[idx] || "").trim().toLowerCase();
    const correct = correctWord.trim().toLowerCase();
    const isCorrect = userAns === correct;
    playSound(isCorrect);
    setResults(prev => ({ ...prev, [idx]: isCorrect }));
    if (isCorrect) fireConfetti(false);
  };

  const handleAdd = () => {
    if (newWord.trim()) {
      onAdd({ word: newWord.trim() });
      setNewWord("");
      setShowAdd(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">Dạng 2: Luyện nghe từ</h3>
        {!isStudentMode && (
          <div className="flex gap-4 items-center">
            <AutoGenerateButton type="type2" lessonContext={lessonContext} existingItems={items} onGenerated={onAdd} />
            <button onClick={() => setShowAdd(!showAdd)} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              + Thêm thủ công
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Từ Tiếng Anh</label>
            <input type="text" value={newWord} onChange={e => setNewWord(e.target.value)} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: apple" />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Thêm</button>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
            <button 
              onClick={() => speak(item.word)}
              className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors shrink-0"
            >
              <Volume2 className="w-6 h-6" />
            </button>
            <div className="flex-1 w-full">
              <input
                type="text"
                value={answers[idx] || ""}
                onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                placeholder="Nghe và viết từ..."
                className="w-full px-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer(idx, item.word)}
              />
              <HintButton question={{ word: item.word }} lessonContext={lessonContext} />
            </div>
            <button 
              onClick={() => checkAnswer(idx, item.word)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shrink-0"
            >
              Kiểm tra
            </button>
            <div className="w-10 flex justify-center shrink-0">
              {results[idx] === true && <CheckCircle2 className="text-green-500" />}
              {results[idx] === false && <XCircle className="text-red-500" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Type3Item({ item, idx, checkAnswer, result }: { key?: any, item: any, idx: number, checkAnswer: (idx: number, ans: string, correct: string) => void, result?: boolean | null }) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>(Array.isArray(item.jumbled) ? item.jumbled : []);

  const handleSelect = (word: string, index: number) => {
    setSelectedWords([...selectedWords, word]);
    const newAvail = [...availableWords];
    newAvail.splice(index, 1);
    setAvailableWords(newAvail);
  };

  const handleDeselect = (word: string, index: number) => {
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
    setAvailableWords([...availableWords, word]);
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-2 text-sm font-medium text-slate-500">Câu {idx + 1}: Hãy ghép các từ sau thành câu hoàn chỉnh</div>
      
      <div className="min-h-[60px] p-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl mb-4 flex flex-wrap gap-2 items-center">
        {selectedWords.length === 0 && <span className="text-slate-400 text-sm">Click vào các từ bên dưới để đưa lên đây...</span>}
        {selectedWords.map((word, i) => (
          <button 
            key={i} 
            onClick={() => handleDeselect(word, i)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm font-medium hover:bg-blue-700 hover:scale-105 transition-all animate-in zoom-in duration-200"
          >
            {word}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6 min-h-[50px]">
        {availableWords.map((word, i) => (
          <button 
            key={i} 
            onClick={() => handleSelect(word, i)}
            className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-lg shadow-sm font-medium hover:border-blue-400 hover:text-blue-600 hover:scale-105 transition-all"
          >
            {word}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button 
          onClick={() => {
            const isCorrect = selectedWords.join(" ") === item.correct;
            playSound(isCorrect);
            checkAnswer(idx, selectedWords.join(" "), item.correct);
          }}
          className="px-6 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-bold shadow-sm transition-colors flex items-center"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Kiểm tra
        </button>
        
        {result !== undefined && (
          <div className={cn("px-4 py-2 rounded-lg font-bold animate-in slide-in-from-right-4", result ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            {result ? "🎉 Chính xác!" : "❌ Thử lại nhé!"}
          </div>
        )}
      </div>
      {result === false && (
         <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
           Đáp án đúng: <strong>{item.correct}</strong>
         </div>
      )}
    </div>
  );
}

function Type3Exercise({ items, lessonContext, onAdd, isStudentMode }: { items: any[], lessonContext: any, onAdd: (item: any) => void, isStudentMode: boolean }) {
  const [results, setResults] = useState<{ [key: number]: boolean | null }>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newCorrect, setNewCorrect] = useState("");

  if (!items?.length) return <div>Không có dữ liệu bài tập dạng này.</div>;

  const checkAnswer = (idx: number, ans: string, correctSentence: string) => {
    const normalize = (str: string) => str.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const isCorrect = normalize(ans) === normalize(correctSentence);
    setResults(prev => ({ ...prev, [idx]: isCorrect }));
    
    if (isCorrect) {
      fireConfetti(false);
    }
  };

  const handleAdd = () => {
    if (newCorrect.trim()) {
      const words = newCorrect.trim().split(/\s+/);
      const jumbled = [...words].sort(() => Math.random() - 0.5);
      onAdd({ correct: newCorrect.trim(), jumbled });
      setNewCorrect("");
      setShowAdd(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Dạng 3: Ghép câu (Minigame)</h3>
        {!isStudentMode && (
          <div className="flex gap-4 items-center">
            <AutoGenerateButton type="type3" lessonContext={lessonContext} existingItems={items} onGenerated={onAdd} />
            <button onClick={() => setShowAdd(!showAdd)} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              + Thêm thủ công
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Câu hoàn chỉnh (Hệ thống sẽ tự xáo trộn từ)</label>
            <input type="text" value={newCorrect} onChange={e => setNewCorrect(e.target.value)} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: I am a student" />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Thêm</button>
        </div>
      )}

      <div className="space-y-6">
        {items.map((item, idx) => (
          <Type3Item key={idx} item={item} idx={idx} checkAnswer={checkAnswer} result={results[idx]} />
        ))}
      </div>
    </div>
  );
}

function Type4Exercise({ data, lessonContext, onAddQ, isStudentMode }: { data: any, lessonContext: any, onAddQ: (q: any) => void, isStudentMode: boolean }) {
  const [selected, setSelected] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  
  const [newQ, setNewQ] = useState("");
  const [newOpts, setNewOpts] = useState(["", "", "", ""]);
  const [newAns, setNewAns] = useState("");

  if (!data?.paragraph) return <div>Không có dữ liệu bài tập dạng này.</div>;

  const handleAdd = () => {
    if (newQ.trim() && newOpts.every(o => o.trim()) && newAns.trim()) {
      onAddQ({ question: newQ.trim(), options: newOpts.map(o => o.trim()), answer: newAns.trim() });
      setNewQ("");
      setNewOpts(["", "", "", ""]);
      setNewAns("");
      setShowAdd(false);
    } else {
      alert("Vui lòng điền đủ câu hỏi, 4 đáp án và đáp án đúng!");
    }
  };

  const handleSelect = (idx: number, opt: string, isCorrect: boolean) => {
    if (submitted) return;
    playSound(isCorrect);
    setSelected({ ...selected, [idx]: opt });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">Dạng 4: Đọc hiểu và trắc nghiệm</h3>
        {!isStudentMode && (
          <div className="flex gap-4 items-center">
            <AutoGenerateButton type="type4" lessonContext={lessonContext} existingItems={data.questions} onGenerated={onAddQ} />
            <button onClick={() => setShowAdd(!showAdd)} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              + Thêm thủ công
            </button>
          </div>
        )}
      </div>

      <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-100 mb-8">
        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{data.paragraph}</p>
      </div>

      {showAdd && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-8 flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Câu hỏi mới</label>
            <input type="text" value={newQ} onChange={e => setNewQ(e.target.value)} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {newOpts.map((opt, i) => (
              <div key={i}>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Đáp án {i + 1}</label>
                <input type="text" value={opt} onChange={e => {
                  const opts = [...newOpts];
                  opts[i] = e.target.value;
                  setNewOpts(opts);
                }} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Đáp án đúng (Phải khớp chính xác với 1 trong 4 đáp án trên)</label>
            <input type="text" value={newAns} onChange={e => setNewAns(e.target.value)} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button onClick={handleAdd} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-fit self-end">Thêm câu hỏi</button>
        </div>
      )}

      <div className="space-y-8">
        {(Array.isArray(data.questions) ? data.questions : []).map((q: any, idx: number) => (
          <div key={idx} className="space-y-4">
            <h4 className="font-semibold text-slate-800">{idx + 1}. {q.question}</h4>
            <div className="grid gap-3">
              {(Array.isArray(q.options) ? q.options : []).map((opt: string, optIdx: number) => {
                const isSelected = selected[idx] === opt;
                const isCorrect = opt === q.answer;
                
                let btnClass = "text-left p-4 rounded-lg border transition-all ";
                if (!submitted) {
                  btnClass += isSelected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:border-slate-300 bg-white";
                } else {
                  if (isCorrect) btnClass += "border-green-500 bg-green-50 text-green-700 font-medium";
                  else if (isSelected && !isCorrect) btnClass += "border-red-500 bg-red-50 text-red-700 line-through opacity-70";
                  else btnClass += "border-slate-200 bg-white opacity-50";
                }

                return (
                  <button
                    key={optIdx}
                    disabled={submitted}
                    onClick={() => handleSelect(idx, opt, isCorrect)}
                    className={btnClass}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {selected[idx] === undefined && <HintButton question={q} lessonContext={lessonContext} />}
          </div>
        ))}
      </div>

      {!submitted ? (
        <button 
          onClick={() => setSubmitted(true)}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Nộp bài Đọc hiểu
        </button>
      ) : (
        <button 
          onClick={() => { setSubmitted(false); setSelected({}); }}
          className="mt-6 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
        >
          Làm lại
        </button>
      )}
    </div>
  );
}

function Type5Exercise({ items, lessonContext, onAdd, isStudentMode }: { items: any[], lessonContext: any, onAdd: (item: any) => void, isStudentMode: boolean }) {
  const [showAnswer, setShowAnswer] = useState<{ [key: number]: boolean }>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newEn, setNewEn] = useState("");
  const [newVn, setNewVn] = useState("");

  if (!items?.length) return <div>Không có dữ liệu bài tập dạng này.</div>;

  const handleAdd = () => {
    if (newEn.trim() && newVn.trim()) {
      onAdd({ conversation: newEn.trim(), translation: newVn.trim() });
      setNewEn("");
      setNewVn("");
      setShowAdd(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">Dạng 5: Nghe đoạn hội thoại và dịch</h3>
        {!isStudentMode && (
          <div className="flex gap-4 items-center">
            <AutoGenerateButton type="type5" lessonContext={lessonContext} existingItems={items} onGenerated={onAdd} />
            <button onClick={() => setShowAdd(!showAdd)} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              + Thêm thủ công
            </button>
          </div>
        )}
      </div>
      
      <p className="text-slate-500 mb-6 mt-0">Nghe đoạn hội thoại tiếng Anh, tự dịch ra giấy/vở sau đó bấm "Xem đáp án" để đối chiếu.</p>
      
      {showAdd && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Đoạn hội thoại (Tiếng Anh)</label>
            <textarea value={newEn} onChange={e => setNewEn(e.target.value)} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none resize-y" rows={2} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Bản dịch (Tiếng Việt)</label>
            <textarea value={newVn} onChange={e => setNewVn(e.target.value)} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none resize-y" rows={2} />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 self-end">Thêm</button>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="p-5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => speak(item.conversation)}
                className="w-12 h-12 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors shrink-0"
              >
                <Volume2 className="w-6 h-6" />
              </button>
              <div className="flex-1 text-lg font-medium text-slate-800">
                Nhấn để nghe đoạn {idx + 1}
              </div>
              <button 
                onClick={() => setShowAnswer({ ...showAnswer, [idx]: !showAnswer[idx] })}
                className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-100 text-sm font-medium"
              >
                {showAnswer[idx] ? "Ẩn đáp án" : "Xem đáp án"}
              </button>
            </div>
            
            {showAnswer[idx] && (
              <div className="mt-2 p-4 bg-white rounded-md border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400">Gốc (Tiếng Anh)</span>
                  <p className="text-slate-800">{item.conversation}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-blue-400">Dịch (Tiếng Việt)</span>
                  <p className="text-blue-800">{item.translation}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Type6Exercise({ items, lessonContext, onAdd, isStudentMode }: { items: any[], lessonContext: any, onAdd: (item: any) => void, isStudentMode: boolean }) {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<{ [key: number]: boolean | null }>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newSentence, setNewSentence] = useState("");

  if (!items?.length) return <div>Không có dữ liệu bài tập dạng này.</div>;

  const checkAnswer = (idx: number, correctSentence: string) => {
    const normalize = (str: string) => str.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const isCorrect = normalize(answers[idx] || "") === normalize(correctSentence);
    playSound(isCorrect);
    setResults(prev => ({ ...prev, [idx]: isCorrect }));
    if (isCorrect) fireConfetti(false);
  };

  const handleAdd = () => {
    if (newSentence.trim()) {
      onAdd({ sentence: newSentence.trim() });
      setNewSentence("");
      setShowAdd(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">Dạng 6: Nghe chép chính tả</h3>
        {!isStudentMode && (
          <div className="flex gap-4 items-center">
            <AutoGenerateButton type="type6" lessonContext={lessonContext} existingItems={items} onGenerated={onAdd} />
            <button onClick={() => setShowAdd(!showAdd)} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              + Thêm thủ công
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Câu văn hoàn chỉnh</label>
            <input type="text" value={newSentence} onChange={e => setNewSentence(e.target.value)} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: The weather is beautiful today" />
          </div>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Thêm</button>
        </div>
      )}
      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={idx} className="p-5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex gap-4 mb-4">
              <button 
                onClick={() => speak(item.sentence)}
                className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors shrink-0"
              >
                <Volume2 className="w-6 h-6" />
              </button>
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-sm font-medium text-slate-500">Nghe và viết lại chính xác câu này</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <textarea
                value={answers[idx] || ""}
                onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                placeholder="Nhập câu bạn nghe được..."
                className="w-full px-4 py-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              />
              <HintButton question={{ question: "Listen and write", type: "Dictation" }} lessonContext={lessonContext} />
              <button 
                onClick={() => checkAnswer(idx, item.sentence)}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 shrink-0 self-end sm:self-stretch flex items-center justify-center"
              >
                Kiểm tra
              </button>
            </div>

            {results[idx] !== undefined && (
              <div className={cn("mt-4 p-4 rounded-md text-sm", results[idx] ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100")}>
                {results[idx] ? "Tuyệt vời! Bạn chép rất chính xác." : <>Chưa chính xác. Đáp án đúng: <br/><strong className="text-base block mt-2">{item.sentence}</strong></>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Type7Exercise({ data, isStudentMode }: { data: any, isStudentMode: boolean }) {
  if (!data?.topic) return <div>Không có dữ liệu bài tập dạng này.</div>;
  const [content, setContent] = useState("");

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Dạng 7: Viết đoạn văn</h3>
      
      <div className="p-6 bg-purple-50 rounded-xl border border-purple-100 mb-6">
        <h4 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-2">Chủ đề</h4>
        <p className="text-slate-800 text-lg font-medium">{data.topic}</p>
      </div>

      <div className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết đoạn văn của bạn ở đây..."
          className="w-full h-64 p-5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700 resize-y"
        />
        <div className="flex justify-between items-center text-sm text-slate-500">
          <span>{content.split(/\s+/).filter(w => w.length > 0).length} từ</span>
        </div>
      </div>
    </div>
  );
}

function Type8Exercise({ items, lessonContext, onAdd, isStudentMode }: { items: any[], lessonContext: any, onAdd: (item: any) => void, isStudentMode: boolean }) {
  const [selected, setSelected] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<{ [key: number]: boolean }>({});
  const [submitted, setSubmitted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [newQ, setNewQ] = useState("");
  const [newOpts, setNewOpts] = useState(["", "", "", ""]);
  const [newAns, setNewAns] = useState("");

  if (!items?.length) return <div>Không có dữ liệu bài tập dạng này.</div>;

  const handleAdd = () => {
    if (newQ.trim() && newOpts.every(o => o.trim()) && newAns.trim()) {
      onAdd({ question: newQ.trim(), options: newOpts.map(o => o.trim()), answer: newAns.trim() });
      setNewQ("");
      setNewOpts(["", "", "", ""]);
      setNewAns("");
      setShowAdd(false);
    } else {
      alert("Vui lòng điền đủ câu hỏi, 4 đáp án và đáp án đúng!");
    }
  };
  
  const handleSelect = (idx: number, opt: string) => {
    if (submitted) return;
    const isCorrect = opt === items[idx].answer;
    playSound(isCorrect);
    setSelected({ ...selected, [idx]: opt });
    setResults({ ...results, [idx]: isCorrect });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const correctCount = Object.keys(results).filter(k => results[Number(k)]).length;
    if (correctCount === items.length && items.length > 0) {
      fireConfetti(true);
    }
  };

  const correctCount = Object.keys(results).filter(k => results[Number(k)]).length;
  const progress = Math.round((Object.keys(selected).length / items.length) * 100) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">Dạng 8: Trắc nghiệm (Quiz Mode)</h3>
        {!isStudentMode && (
          <div className="flex gap-4 items-center">
            <AutoGenerateButton type="type8" lessonContext={lessonContext} existingItems={items} onGenerated={onAdd} />
            <button onClick={() => setShowAdd(!showAdd)} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              + Thêm thủ công
            </button>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden shadow-inner">
        <div 
          className="bg-gradient-to-r from-orange-400 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {showAdd && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-8 flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Câu hỏi mới</label>
            <input type="text" value={newQ} onChange={e => setNewQ(e.target.value)} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {newOpts.map((opt, i) => (
              <div key={i}>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Đáp án {i + 1}</label>
                <input type="text" value={opt} onChange={e => {
                  const opts = [...newOpts];
                  opts[i] = e.target.value;
                  setNewOpts(opts);
                }} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Đáp án đúng (Phải khớp chính xác với 1 trong 4 đáp án trên)</label>
            <input type="text" value={newAns} onChange={e => setNewAns(e.target.value)} className="w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button onClick={handleAdd} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-fit self-end">Thêm câu hỏi</button>
        </div>
      )}

      <div className="space-y-8">
        {items.map((q: any, idx: number) => {
          const isAnswered = selected[idx] !== undefined;
          
          return (
            <div key={idx} className={cn("p-6 rounded-2xl border-2 transition-all shadow-sm", isAnswered ? "bg-white border-blue-200" : "bg-slate-50 border-slate-100")}>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold shrink-0">
                  {idx + 1}
                </div>
                <h4 className="font-bold text-slate-800 text-lg pt-1">{q.question}</h4>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {(Array.isArray(q.options) ? q.options : []).map((opt: string, optIdx: number) => {
                  const isSelected = selected[idx] === opt;
                  const isCorrect = opt === q.answer;
                  
                  let btnClass = "text-left p-4 rounded-xl border-2 transition-all font-medium text-slate-700 flex justify-between items-center group ";
                  
                  if (!submitted) {
                    btnClass += isSelected 
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-[1.02]" 
                      : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 hover:shadow-sm";
                  } else {
                    if (isCorrect) {
                      btnClass += "border-green-500 bg-green-50 text-green-700 font-bold shadow-md transform scale-[1.02]";
                    } else if (isSelected && !isCorrect) {
                      btnClass += "border-red-400 bg-red-50 text-red-700 opacity-80";
                    } else {
                      btnClass += "border-slate-200 bg-white opacity-40";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={submitted}
                      onClick={() => handleSelect(idx, opt)}
                      className={btnClass}
                    >
                      <span>{opt}</span>
                      {submitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      {submitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                      {!submitted && isSelected && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-8 pb-4">
        {!submitted ? (
          <button 
            disabled={Object.keys(selected).length < items.length}
            onClick={handleSubmit}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg flex items-center justify-center"
          >
            Nộp bài Trắc nghiệm
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="text-center sm:text-left">
              <div className="text-3xl font-black text-slate-800">
                <span className={correctCount === items.length ? "text-green-500" : "text-blue-600"}>
                  {correctCount}
                </span> 
                <span className="text-slate-400 text-2xl"> / {items.length}</span>
              </div>
              <div className="text-slate-500 font-medium mt-1">Câu trả lời đúng</div>
            </div>
            
            <button 
              onClick={() => { setSubmitted(false); setSelected({}); }}
              className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 font-bold transition-all ml-auto shadow-sm"
            >
              Làm lại bài này
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
