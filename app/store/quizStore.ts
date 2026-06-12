import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QuizAnswers {
  skin_type: string;
  problems: string[];
  age_range: string;
  allergies: string[];
}

interface QuizState {
  answers: QuizAnswers | null;
  setAnswers: (answers: QuizAnswers) => void;
  clearAnswers: () => void;
  hasQuiz: () => boolean;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      answers: null,
      setAnswers: (answers) => set({ answers }),
      clearAnswers: () => set({ answers: null }),
      hasQuiz: () => get().answers !== null,
    }),
    {
      name: 'quiz-storage',
    }
  )
);