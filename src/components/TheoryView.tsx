import React from "react";
import { Vocab, Grammar } from "../types";
import { BookOpen, Volume2 } from "lucide-react";

interface TheoryViewProps {
  vocabulary: Vocab[];
  grammar: Grammar[];
}

export function TheoryView({ vocabulary, grammar }: TheoryViewProps) {
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Vocabulary Section */}
      <section>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">1. Từ vựng trọng tâm</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(vocabulary) ? vocabulary : []).map((v, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold text-blue-700">{v.word}</h3>
                  <p className="text-sm text-slate-500 font-mono mt-1">{v.phonetic}</p>
                </div>
                <button 
                  onClick={() => speak(v.word)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100">
                <p className="text-slate-700 font-medium">{v.meaning}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grammar Section */}
      <section>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">2. Cấu trúc ngữ pháp</h2>
        </div>

        <div className="space-y-6">
          {(Array.isArray(grammar) ? grammar : []).map((g, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-purple-700 mb-3 font-mono bg-purple-50 inline-block px-3 py-1 rounded-md">
                {g.structure}
              </h3>
              <p className="text-slate-700 mb-4 text-lg">{g.explanation}</p>
              
              {g.examples && g.examples.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Ví dụ:</h4>
                  <ul className="space-y-2">
                    {(Array.isArray(g.examples) ? g.examples : []).map((ex: any, i) => {
                      const isString = typeof ex === 'string';
                      const enText = isString ? ex : ex.en;
                      const vnText = isString ? null : ex.vn;
                      
                      return (
                        <li key={i} className="flex items-start">
                          <span className="text-purple-400 mr-2 mt-0.5">•</span>
                          <div className="flex-1">
                            <span className="text-slate-800 font-medium">{enText}</span>
                            {vnText && <span className="text-slate-500 italic ml-2">- {vnText}</span>}
                          </div>
                          <button 
                            onClick={() => speak(enText)}
                            className="ml-2 mt-0.5 text-slate-400 hover:text-purple-600 transition-colors flex-shrink-0"
                            title="Nghe phát âm"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
