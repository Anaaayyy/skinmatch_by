'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authAPI, quizAPI } from '../services/api';
import { useFavoritesStore } from '../store/favoritesStore';
import { useComparisonStore } from '../store/comparisonStore';
import { useQuizStore } from '../store/quizStore';
import { useUserProfileStore } from '../store/userProfileStore';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const loadFavorites = useFavoritesStore((state) => state.loadFavorites);
  const loadComparisons = useComparisonStore((state) => state.loadComparisons);
  const { answers, clearAnswers } = useQuizStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!username.trim()) { toast.error('Введите имя пользователя'); return; }
    if (!password.trim()) { toast.error('Введите пароль'); return; }
    if (username.length > 30) { toast.error('Имя пользователя не должно превышать 30 символов'); return; }
    
    setLoading(true);
    
    try {
      const response = await authAPI.login({ username, password });
      
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      window.dispatchEvent(new Event('auth-change'));

      if (answers) {
        try {
          await quizAPI.saveResults({
            skin_type: answers.skin_type,
            problems: answers.problems,
            age_range: answers.age_range,
            allergies: answers.allergies,
          });
          toast.success('Анкета перенесена в профиль!');
          clearAnswers();
        } catch (err) {
          console.error('Error saving quiz:', err);
        }
      }
      
      await loadFavorites();
      await loadComparisons();
      useUserProfileStore.getState().loadProfile();
      
      toast.success('Вход выполнен успешно!');
      setTimeout(() => router.push('/profile'), 1000);
    } catch (err) {
      toast.error('Неверное имя пользователя или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '32px' }}>Вход в аккаунт</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Имя пользователя</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            placeholder="Введите имя пользователя"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            background: '#db2777',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>
        Нет аккаунта? <Link href="/register" style={{ color: '#db2777', textDecoration: 'none' }}>Зарегистрироваться</Link>
      </p>
    </div>
  );
}