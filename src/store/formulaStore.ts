import { create } from 'zustand';

type Suggestion = {
  id: string;
  name: string;
  category: string;
  value: string | number;
};

type Tag = {
  id: string;
  value: string; // For operands and numbers, this is the raw value; for tags, this is the name
  type: 'tag' | 'operand' | 'number';
  suggestion?: Suggestion; // Store the full suggestion object for tags
};

type FormulaState = {
  formula: Tag[];
  addTag: (value: string, type: Tag['type'], suggestion?: Suggestion) => void;
  removeTag: (id: string) => void;
  updateTag: (id: string, value: string, suggestion?: Suggestion) => void;
  clearFormula: () => void;
};

export const useFormulaStore = create<FormulaState>((set) => ({
  formula: [],
  addTag: (value, type, suggestion) =>
    set((state) => ({
      formula: [
        ...state.formula,
        { id: Date.now().toString(), value, type, suggestion },
      ],
    })),
  removeTag: (id) =>
    set((state) => ({
      formula: state.formula.filter((tag) => tag.id !== id),
    })),
  updateTag: (id, value, suggestion) =>
    set((state) => ({
      formula: state.formula.map((tag) =>
        tag.id === id ? { ...tag, value, suggestion } : tag
      ),
    })),
  clearFormula: () => set({ formula: [] }),
}));