export interface Vocab {
  word: string;
  phonetic: string;
  meaning: string;
}

export interface Grammar {
  structure: string;
  explanation: string;
  examples: ({ en: string; vn: string } | string)[];
}

export interface Type1 {
  vn: string;
  en: string;
}

export interface Type2 {
  word: string;
}

export interface Type3 {
  jumbled: string[];
  correct: string;
}

export interface Type4Q {
  question: string;
  options: string[];
  answer: string;
}

export interface Type4 {
  paragraph: string;
  questions: Type4Q[];
}

export interface Type5 {
  conversation: string;
  translation: string;
}

export interface Type6 {
  sentence: string;
}

export interface Type7 {
  topic: string;
}

export interface Type8 {
  question: string;
  options: string[];
  answer: string;
}

export interface LessonData {
  id?: string;
  grade?: string;
  title: string;
  partI: {
    vocabulary: Vocab[];
    grammar: Grammar[];
  };
  partII: {
    type1: Type1[];
    type2: Type2[];
    type3: Type3[];
    type4: Type4;
    type5: Type5[];
    type6: Type6[];
    type7: Type7;
    type8: Type8[];
  };
}
