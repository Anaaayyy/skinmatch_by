'use client';

import { useEffect } from 'react';
import { useFavoritesStore } from '../store/favoritesStore';
import { useComparisonStore } from '../store/comparisonStore';

export default function AuthInitializer() {
  const loadFavorites = useFavoritesStore((state) => state.loadFavorites);
  const loadComparisons = useComparisonStore((state) => state.loadComparisons);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      loadFavorites();
      loadComparisons();
    } else {
      // Если нет токена, очищаем данные
      useFavoritesStore.getState().clearFavorites();
      useComparisonStore.getState().clearProducts();
    }
  }, [loadFavorites, loadComparisons]);

  return null;
}