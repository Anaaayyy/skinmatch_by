import { create } from 'zustand';
import { comparisonsAPI, productsAPI } from '../services/api';
import { AxiosError } from 'axios';

interface Comparison {
  id: number;
  name: string;
  products: number[];
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface ComparisonState {
  products: number[];
  isLoading: boolean;
  loadComparisons: () => Promise<void>;
  addProduct: (id: number, categoryId?: number) => Promise<void>;
  removeProduct: (id: number) => Promise<void>;
  isInComparison: (id: number) => boolean;
  clearProducts: () => void;
  getCategoryCount: (categoryId: number) => Promise<number>; // Новый метод
}

// Кэш: productId -> categoryId (число, а не строка!)
const productCategoryCache: Map<number, number> = new Map();

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  products: [],
  isLoading: false,
  
  loadComparisons: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ products: [] });
      return;
    }
    set({ isLoading: true });
    try {
      const response = await comparisonsAPI.getAll();
      const data = response.data as PaginatedResponse<Comparison>;
      const results = data.results || [];
      if (results.length > 0) {
        set({ products: results[0].products || [] });
      } else {
        set({ products: [] });
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error loading comparisons:', axiosError);
      set({ products: [] });
    } finally {
      set({ isLoading: false });
    }
  },
  
  addProduct: async (id: number, categoryId?: number) => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    const currentProducts = get().products;
    if (currentProducts.includes(id)) return;
    
    // Если categoryId не передан — получаем из API и кэшируем
    let catId: number | undefined = categoryId;
    
    if (catId === undefined) {
      if (productCategoryCache.has(id)) {
        catId = productCategoryCache.get(id);
      } else {
        try {
          const response = await productsAPI.getById(id);
          catId = response.data.category;
          if (catId !== undefined && catId !== null) {
            productCategoryCache.set(id, catId);
          }
        } catch {
          console.warn('Не удалось получить категорию товара');
        }
      }
    } else {
      productCategoryCache.set(id, catId);
    }
    
    // Проверка лимита по категории (только если catId определён)
    if (catId !== undefined) {
      const countInCategory = await get().getCategoryCount(catId);
      if (countInCategory >= 4) {
        console.warn(`Нельзя добавить более 4 товаров в категорию ${catId}`);
        return;
      }
    }
    
    try {
      const response = await comparisonsAPI.getAll();
      const data = response.data as PaginatedResponse<Comparison>;
      const results = data.results || [];
      let comparisonId: number;
      
      if (results.length > 0) {
        comparisonId = results[0].id;
      } else {
        const newComparison = await comparisonsAPI.create('Мое сравнение');
        comparisonId = newComparison.data.id;
      }
      
      await comparisonsAPI.addProduct(comparisonId, id);
      await get().loadComparisons();
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error adding to comparison:', axiosError);
    }
  },
  
  removeProduct: async (id: number) => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const response = await comparisonsAPI.getAll();
      const data = response.data as PaginatedResponse<Comparison>;
      const results = data.results || [];
      
      if (results.length > 0) {
        await comparisonsAPI.removeProduct(results[0].id, id);
      }
      await get().loadComparisons();
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error removing from comparison:', axiosError);
    }
  },
  
  isInComparison: (id: number) => {
    return get().products.includes(id);
  },
  
  clearProducts: () => set({ products: [] }),
  
  getCategoryCount: async (categoryId: number): Promise<number> => {
    const currentProducts = get().products;
    let count = 0;
    
    for (const productId of currentProducts) {
      let catId = productCategoryCache.get(productId);
      if (catId === undefined) {
        try {
          const response = await productsAPI.getById(productId);
          catId = response.data.category;
          if (catId !== undefined && catId !== null) {
            productCategoryCache.set(productId, catId);
          }
        } catch {
          continue;
        }
      }
      if (catId === categoryId) count++;
    }
    
    return count;
  },
}));