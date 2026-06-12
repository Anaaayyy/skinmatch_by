'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useComparisonStore } from '../store/comparisonStore';
import { productsAPI, categoriesAPI } from '../services/api';
import { Product, Category } from '../types';
import { AxiosError } from 'axios';
import { useUserProfileStore } from '../store/userProfileStore';
import { translateSkinType, translateProblems, calculateMatchPercentage } from '../utils/translations';

const MAX_PRODUCTS_PER_CATEGORY = 4;

export default function ComparePage() {
  const router = useRouter();
  const { products: comparisonIds, removeProduct, clearProducts, loadComparisons } = useComparisonStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const userProfile = useUserProfileStore(state => state.profile);
  const isProfileComplete = useUserProfileStore(state => state.isProfileComplete);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsAuthenticated(false);
      setCheckingAuth(false);
      setLoading(false);
      return;
    }
    setIsAuthenticated(true);
    setCheckingAuth(false);
    loadData();
    loadCategories();
    useUserProfileStore.getState().loadProfile();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      const categoriesData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await loadComparisons();
      const currentIds = useComparisonStore.getState().products;
      if (currentIds.length > 0) {
        const promises = currentIds.map(id => productsAPI.getById(id));
        const responses = await Promise.all(promises);
        setProducts(responses.map(r => r.data));
      } else {
        setProducts([]);
      }
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error loading comparison:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsAuthenticated(false);
        router.push('/login');
      } else {
        toast.error('Ошибка загрузки сравнения');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    await removeProduct(id);
    setProducts(products.filter(p => p.id !== id));
    toast.success('Удалено из сравнения');
  };

  const handleClearAll = async () => {
    if (confirm('Вы уверены, что хотите удалить все товары из сравнения?')) {
      await clearProducts();
      setProducts([]);
      setSelectedCategory(null);
      toast.success('Сравнение очищено');
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const productsByCategory = categories
    .map(cat => ({
      category: cat,
      products: filteredProducts.filter(p => p.category === cat.id)
    }))
    .filter(group => group.products.length > 0);

  const canAddMore = productsByCategory.some(
    group => group.products.length < MAX_PRODUCTS_PER_CATEGORY
  );

  const allCategoriesFull = productsByCategory.length > 0 && 
    productsByCategory.every(group => group.products.length >= MAX_PRODUCTS_PER_CATEGORY);

  if (checkingAuth) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <style jsx>{`
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 60vh;
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid #fce7f3;
            border-top-color: #db2777;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <div className="auth-content">
          <div className="auth-icon">📊</div>
          <h1>Требуется авторизация</h1>
          <p>Чтобы просматривать сравнение,<br />пожалуйста, войдите в аккаунт</p>
          <div className="auth-buttons">
            <Link href="/login" className="login-btn">Войти</Link>
            <Link href="/register" className="register-btn">Зарегистрироваться</Link>
          </div>
          <button className="back-home" onClick={() => router.push('/')}>Вернуться на главную</button>
        </div>
        <style jsx>{`
          .auth-required {
            min-height: 70vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #fdf8f7 0%, #fff 100%);
          }
          .auth-content {
            text-align: center;
            max-width: 450px;
            padding: 48px 32px;
            background: white;
            border-radius: 32px;
            box-shadow: 0 20px 40px -12px rgba(0,0,0,0.1);
          }
          .auth-icon {
            font-size: 64px;
            margin-bottom: 24px;
          }
          .auth-content h1 {
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #1f2937;
          }
          .auth-content p {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 32px;
            line-height: 1.5;
          }
          .auth-buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
            margin-bottom: 24px;
          }
          .login-btn {
            padding: 12px 32px;
            background: linear-gradient(135deg, #db2777, #be185d);
            color: white;
            text-decoration: none;
            border-radius: 40px;
            font-weight: 500;
            transition: all 0.3s;
          }
          .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(219,39,119,0.3);
          }
          .register-btn {
            padding: 12px 32px;
            border: 2px solid #db2777;
            color: #db2777;
            background: white;
            text-decoration: none;
            border-radius: 40px;
            font-weight: 500;
            transition: all 0.3s;
          }
          .register-btn:hover {
            background: #fdf2f8;
            transform: translateY(-2px);
          }
          .back-home {
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            font-size: 14px;
            text-decoration: underline;
          }
          @media (max-width: 768px) {
            .auth-content {
              padding: 32px 24px;
              margin: 20px;
            }
            .auth-content h1 {
              font-size: 28px;
            }
            .auth-buttons {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (comparisonIds.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-content">
          <h1>Сравнение</h1>
          <p>У вас пока нет товаров для сравнения</p>
          <Link href="/catalog" className="empty-btn">Перейти в каталог</Link>
        </div>
        <style jsx>{`
          .empty-state {
            min-height: 70vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #fdf8f7 0%, #fff 100%);
          }
          .empty-content {
            text-align: center;
            max-width: 500px;
            padding: 40px 20px;
          }
          .empty-content h1 {
            font-size: 48px;
            font-weight: 600;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #1f2937, #4b5563);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .empty-content p {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 32px;
          }
          .empty-btn {
            display: inline-block;
            padding: 14px 36px;
            background: linear-gradient(135deg, #db2777, #be185d);
            color: white;
            text-decoration: none;
            border-radius: 40px;
            transition: all 0.3s;
          }
          .empty-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(219,39,119,0.4);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="compare-page">
      <div className="page-header">
        <h1>
          <span className="title-gradient">Сравнение товаров</span>
          <span className="product-count">{products.length} товаров</span>
        </h1>
      </div>

      <div className="filters-section">
        <div className="filters">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`filter-chip ${selectedCategory === null ? 'active' : ''}`}
          >
            Все товары
            <span className="chip-count">{products.length}</span>
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.category === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`filter-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              >
                {cat.name}
                <span className="chip-count">{count}/{MAX_PRODUCTS_PER_CATEGORY}</span>
              </button>
            );
          })}
        </div>
        <button onClick={handleClearAll} className="clear-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Очистить всё
        </button>
      </div>

      {filteredProducts.length === 0 && selectedCategory ? (
        <div className="empty-category">
          <p>В этой категории нет товаров для сравнения</p>
        </div>
      ) : (
        productsByCategory.map(({ category, products: categoryProducts }) => {
          const isCategoryFull = categoryProducts.length >= MAX_PRODUCTS_PER_CATEGORY;
          
          return (
            <div key={category.id} className="category-section">
              <div className="category-title">
                <h2>{category.name}</h2>
                <div className="title-line"></div>
                <div className="category-limit-info">
                  {categoryProducts.length} из {MAX_PRODUCTS_PER_CATEGORY} товаров
                  {isCategoryFull && (
                    <span className="limit-warning">⚠️ Лимит категории достигнут</span>
                  )}
                </div>
              </div>
              <div className="table-wrapper">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th className="feature-header">Характеристика</th>
                      {categoryProducts.map((product) => (
                        <th key={product.id} className="product-header">
                          <button
                            className="remove-product"
                            onClick={() => handleRemove(product.id)}
                          >
                            ✕
                          </button>
                          <div className="product-image">
                            {product.main_image_url ? (
                              <img src={product.main_image_url} alt={product.title} />
                            ) : (
                              <span>✨</span>
                            )}
                          </div>
                          <Link href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                              <div className="product-brand">{product.brand_name}</div>
                              <div className="product-title">{product.title}</div>
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    
                    <tr>
                      <td className="feature-name">Рейтинг</td>
                      {categoryProducts.map((product) => (
                        <td key={product.id} className="feature-value">
                          <span className="rating-badge">★ {product.rating}</span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="feature-name">Тип кожи</td>
                      {categoryProducts.map((product) => (
                        <td key={product.id} className="feature-value">
                          {translateSkinType(product.suitable_skin_types || 'all')}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="feature-name">Объем</td>
                      {categoryProducts.map((product) => (
                        <td key={product.id} className="feature-value">
                          {product.volume ? `${product.volume} мл` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="feature-name">Проблемы</td>
                      {categoryProducts.map((product) => (
                        <td key={product.id} className="feature-value problems">
                          {translateProblems(product.solves_problems || '') || '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              
              {isCategoryFull && (
                <div className="category-full-notice">
                  Чтобы добавить новый товар, удалите один из текущих
                </div>
              )}
            </div>
          );
        })
      )}

      {canAddMore && !loading && (
        <div className="add-more">
          <Link href="/catalog" className="add-more-btn">
            <span>+</span> Добавить товар
          </Link>
        </div>
      )}

      {allCategoriesFull && !loading && (
        <div className="all-full-message">
          <p>Вы достигли лимита во всех категориях. Удалите ненужные товары, чтобы добавить новые.</p>
        </div>
      )}

      <style jsx>{`
        .compare-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 60px 24px;
          background: #fff;
        }
        .page-header {
          margin-bottom: 48px;
          text-align: center;
        }
        .page-header h1 {
          font-size: 48px;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .title-gradient {
          background: linear-gradient(135deg, #1f2937, #db2777);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .product-count {
          font-size: 18px;
          font-weight: 400;
          color: #9ca3af;
        }
        .filters-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 48px;
          padding-bottom: 24px;
          border-bottom: 1px solid #f0f0f0;
        }
        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .filter-chip {
          padding: 8px 20px;
          border-radius: 40px;
          border: 1px solid #e5e7eb;
          background: white;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-chip:hover {
          border-color: #db2777;
          color: #db2777;
        }
        .filter-chip.active {
          background: #db2777;
          border-color: #db2777;
          color: white;
        }
        .chip-count {
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 20px;
          background: rgba(0,0,0,0.05);
        }
        .filter-chip.active .chip-count {
          background: rgba(255,255,255,0.2);
        }
        .clear-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 40px;
          border: 1px solid #fecaca;
          background: white;
          color: #f43f5e;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .clear-btn:hover {
          background: #fef2f2;
          border-color: #f43f5e;
        }
        .empty-category {
          text-align: center;
          padding: 60px;
          background: #fafafa;
          border-radius: 24px;
          color: #9ca3af;
        }
        .category-section {
          margin-bottom: 64px;
        }
        .category-title {
          margin-bottom: 32px;
        }
        .category-title h2 {
          font-size: 28px;
          font-weight: 500;
          color: #1f2937;
          margin: 0 0 12px 0;
        }
        .title-line {
          width: 50px;
          height: 3px;
          background: linear-gradient(90deg, #db2777, #fbcfe8);
          border-radius: 3px;
        }
        .category-limit-info {
          margin-top: 12px;
          font-size: 14px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .limit-warning {
          color: #f59e0b;
          font-weight: 500;
        }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 20px;
          background: white;
          border: 1px solid #f0f0f0;
        }
        .compare-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }
        .compare-table th,
        .compare-table td {
          padding: 20px;
          text-align: center;
          border-bottom: 1px solid #f0f0f0;
        }
        .feature-header {
          text-align: left;
          width: 180px;
          background: #fafafa;
          font-weight: 500;
          color: #4b5563;
        }
        .product-header {
          position: relative;
          min-width: 180px;
          background: white;
        }
        .remove-product {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #fafafa;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: #9ca3af;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .remove-product:hover {
          background: #f43f5e;
          color: white;
        }
        .product-image {
          width: 80px;
          height: 80px;
          margin: 0 auto 12px;
          background: linear-gradient(135deg, #fafafa, #f5f5f5);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .product-image span {
          font-size: 32px;
          color: #d1d5db;
        }
        .product-brand {
          font-size: 12px;
          color: #db2777;
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .product-title {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }
        .feature-name {
          text-align: left;
          font-weight: 500;
          color: #4b5563;
          background: #fafafa;
          width: 180px;
        }
        .feature-value {
          color: #6b7280;
        }
        .rating-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          background: #fef3c7;
          border-radius: 30px;
          color: #92400e;
          font-weight: 500;
        }
        .problems {
          font-size: 13px;
          color: #9ca3af;
          max-width: 200px;
        }
        .match-badge {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 16px;
          border-radius: 12px;
          font-weight: 600;
        }
        .match-percent {
          font-size: 18px;
        }
        .match-detail {
          font-size: 11px;
          font-weight: 400;
        }
        .add-to-category {
          text-align: center;
          margin-top: 20px;
        }
        .add-to-category-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #db2777;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }
        .add-to-category-btn span {
          font-size: 18px;
        }
        .add-to-category-btn:hover {
          text-decoration: underline;
        }
        .category-full-notice {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #9ca3af;
        }
        .add-more {
          text-align: center;
          margin-top: 48px;
        }
        .add-more-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 32px;
          border: 2px solid #db2777;
          border-radius: 40px;
          color: #db2777;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
        }
        .add-more-btn span {
          font-size: 20px;
        }
        .add-more-btn:hover {
          background: #db2777;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(219,39,119,0.2);
        }
        .all-full-message {
          text-align: center;
          margin-top: 48px;
          padding: 32px;
          background: #fafafa;
          border-radius: 24px;
          color: #6b7280;
          font-size: 16px;
        }
        @media (max-width: 768px) {
          .compare-page {
            padding: 40px 16px;
          }
          .page-header h1 {
            font-size: 32px;
          }
          .category-title h2 {
            font-size: 24px;
          }
          .compare-table th,
          .compare-table td {
            padding: 12px;
          }
          .product-image {
            width: 60px;
            height: 60px;
          }
          .product-title {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}