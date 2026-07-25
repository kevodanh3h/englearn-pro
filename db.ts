import { LessonData } from './src/types';

// The Firebase Database URL
const FIREBASE_URL = process.env.FIREBASE_URL || 'https://englearn-pro-db-default-rtdb.firebaseio.com';

export const db = {
  getLessons: async (): Promise<LessonData[]> => {
    try {
      const response = await fetch(`${FIREBASE_URL}/lessons.json`);
      if (!response.ok) return [];
      const data = await response.json();
      
      if (!data) return [];
      
      // Firebase stores arrays or objects, let's normalize to array
      if (Array.isArray(data)) {
        return data.filter(Boolean); // Remove nulls
      }
      
      return Object.values(data);
    } catch (e) {
      console.error("Firebase get error", e);
      return [];
    }
  },
  
  saveLesson: async (lesson: LessonData) => {
    const lessons = await db.getLessons();
    const existingIndex = lessons.findIndex(l => l.id === lesson.id);
    
    if (existingIndex >= 0) {
      lessons[existingIndex] = lesson;
    } else {
      lessons.unshift(lesson); // Add to beginning
    }
    
    try {
      await fetch(`${FIREBASE_URL}/lessons.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lessons)
      });
    } catch (e) {
      console.error("Firebase save error", e);
    }
  },
  
  deleteLesson: async (id: string) => {
    const lessons = await db.getLessons();
    const filtered = lessons.filter(l => l.id !== id);
    
    try {
      await fetch(`${FIREBASE_URL}/lessons.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filtered)
      });
    } catch (e) {
      console.error("Firebase delete error", e);
    }
  }
};
