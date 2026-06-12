import { create } from 'zustand';
import { favoritesAPI } from '../services/api';
import { Favorite } from '../types';

interface FavoritesState {
  favorites: number[];
  isLoading: boolean;
  loadFavorites: () => Promise<void>;
  addFavorite: (id: number) => Promise<void>;
  removeFavorite: (id: number) => Promise<void>;
  isFavorite: (id: number) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoading: false,
  
  loadFavorites: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ favorites: [] });
      return;
    }
    set({ isLoading: true });
    try {
      const response = await favoritesAPI.getAll();
      const data = response.data;
      const results = data.results || [];
      const serverFavorites = results.map((f: Favorite) => f.product);
      set({ favorites: serverFavorites });
    } catch (error) {
      console.error('Error loading favorites:', error);
      set({ favorites: [] });
    } finally {
      set({ isLoading: false });
    }
  },
  
  addFavorite: async (id: number) => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      await favoritesAPI.add(id);
      await get().loadFavorites();
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  },
  
  removeFavorite: async (id: number) => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      await favoritesAPI.remove(id);
      await get().loadFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  },
  
  isFavorite: (id: number) => get().favorites.includes(id),
  clearFavorites: () => set({ favorites: [] }),
}));