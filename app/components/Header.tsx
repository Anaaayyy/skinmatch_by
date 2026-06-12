'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFavoritesStore } from '../store/favoritesStore';
import { useComparisonStore } from '../store/comparisonStore';

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const favoritesCount = useFavoritesStore((state) => state.favorites.length);
  const comparisonCount = useComparisonStore((state) => state.products.length);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    queueMicrotask(() => checkAuth());
    
    window.addEventListener('auth-change', checkAuth);
    return () => {
      window.removeEventListener('auth-change', checkAuth);
    };
  }, [checkAuth]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userSkinProfile');
    useFavoritesStore.getState().clearFavorites();
    useComparisonStore.getState().clearProducts();
    setIsLoggedIn(false);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  return (
    <header style={{
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <nav style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link href="/" style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: '30px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #db2777,#fd0098)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.3px',
          }}>
            SkinMatch
          </span>
          <span style={{
            fontSize: '30px',
            fontWeight: '700',
            color: '#1f2937',
            letterSpacing: '-0.3px',
          }}>
            BY
          </span>
        </Link>

        <div className="desktop-menu" style={{
          display: 'none',
          gap: '32px',
          alignItems: 'center'
        }}>
          <Link href="/" style={{ color: '#4a5568', textDecoration: 'none' }}>Главная</Link>
          <Link href="/catalog" style={{ color: '#4a5568', textDecoration: 'none' }}>Каталог</Link>
          <Link href="/forum" style={{ color: '#4a5568', textDecoration: 'none' }}>Форум</Link>
          <Link href="/questionnaire" style={{ color: '#4a5568', textDecoration: 'none' }}>Анкета</Link>
          <Link href="/routine" style={{ color: '#4a5568', textDecoration: 'none' }}>Подбор рутины</Link>
          
          <Link href="/favorites" style={{ color: '#4a5568', textDecoration: 'none', position: 'relative' }}>
            Избранное
            {favoritesCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-12px',
                backgroundColor: '#db2777',
                color: 'white',
                fontSize: '10px',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {favoritesCount}
              </span>
            )}
          </Link>
          
          <Link href="/compare" style={{ color: '#4a5568', textDecoration: 'none', position: 'relative' }}>
            Сравнение
            {comparisonCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-12px',
                backgroundColor: '#db2777',
                color: 'white',
                fontSize: '10px',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {comparisonCount}
              </span>
            )}
          </Link>
          
          {isLoggedIn ? (
            <>
              <Link href="/profile" style={{ color: '#4a5568', textDecoration: 'none' }}>Личный кабинет</Link>
              <button onClick={handleLogout} style={{
                background: '#db2777',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: '#db2777', textDecoration: 'none' }}>Вход</Link>
              <Link href="/register" style={{
                background: '#db2777',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '8px',
                textDecoration: 'none'
              }}>
                Регистрация
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="mobile-menu-btn"
          style={{
            display: 'block',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ☰
        </button>
      </nav>

      {isMenuOpen && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px',
          gap: '16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <Link href="/" style={{ color: '#4a5568', textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>Главная</Link>
          <Link href="/catalog" style={{ color: '#4a5568', textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>Каталог</Link>
          <Link href="/forum" style={{ color: '#4a5568', textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>Форум</Link>
          <Link href="/questionnaire" style={{ color: '#4a5568', textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>Анкета</Link>
          <Link href="/routine" style={{ color: '#4a5568', textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>Подбор рутины</Link>
          
          <Link href="/favorites" style={{ color: '#4a5568', textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
            Избранное {favoritesCount > 0 && `(${favoritesCount})`}
          </Link>
          
          <Link href="/compare" style={{ color: '#4a5568', textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
            Сравнение {comparisonCount > 0 && `(${comparisonCount})`}
          </Link>
          
          {isLoggedIn ? (
            <>
              <Link href="/profile" style={{ color: '#4a5568', textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>Личный кабинет</Link>
              <button onClick={handleLogout} style={{
                background: '#db2777',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: '#db2777', textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>Вход</Link>
              <Link href="/register" style={{
                background: '#db2777',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                textAlign: 'center'
              }} onClick={() => setIsMenuOpen(false)}>
                Регистрация
              </Link>
            </>
          )}
        </div>
      )}

    <style jsx>{`
      @media (min-width: 1200px) {
        .desktop-menu {
          display: flex !important;
        }
        .mobile-menu-btn {
          display: none !important;
        }
      }
    `}</style>
    </header>
  );
}