import { create } from 'zustand';

interface ProductRating {
  [productId: number]: number;
}

interface ProductStore {
  ratings: ProductRating;
  updateRating: (productId: number, newRating: number) => void;
  getRating: (productId: number) => number | null;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  ratings: {},
  
  updateRating: (productId: number, newRating: number) => {
    set((state) => ({
      ratings: { ...state.ratings, [productId]: newRating }
    }));
  },
  
  getRating: (productId: number) => {
    return get().ratings[productId] || null;
  },
}));