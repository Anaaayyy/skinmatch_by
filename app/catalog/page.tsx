'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { productsAPI, brandsAPI, categoriesAPI } from '../services/api';
import { useQuizStore } from '../store/quizStore';
import { useProductStore } from '../store/productStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { Product, Brand, Category } from '../types';
import { calculateMatchPercentage } from '../utils/translations';

interface ProductsParams {
  page?: number;
  page_size?: number;
  brand?: number;
  category?: number;
  search?: string;
  ordering?: string;
}

interface RecommendedProduct extends Product {
  match_percentage?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function CustomSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: '180px' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 36px 10px 16px',
          border: `1px solid ${isOpen ? '#db2777' : '#e5e7eb'}`,
          borderRadius: '8px',
          backgroundColor: 'white',
          fontSize: '15px',
          textAlign: 'left',
          cursor: 'pointer',
          color: value ? '#1f2937' : '#9ca3af',
          position: 'relative',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(219, 39, 119, 0.1)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        {displayText}
        <span style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: `translateY(-50%) rotate(${isOpen ? '180deg' : '0deg'})`,
          transition: 'transform 0.2s',
          fontSize: '10px',
          color: '#6b7280',
        }}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 10,
          overflow: 'hidden',
          maxHeight: '240px',
          overflowY: 'auto',
        }}>
          <div
            onClick={() => { onChange(''); setIsOpen(false); }}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              color: value === '' ? '#db2777' : '#6b7280',
              background: value === '' ? '#fdf2f8' : 'white',
              fontSize: '14px',
              borderBottom: '1px solid #f0f0f0',
            }}
            onMouseEnter={(e) => { if (value !== '') e.currentTarget.style.background = '#f9fafb'; }}
            onMouseLeave={(e) => { if (value !== '') e.currentTarget.style.background = 'white'; }}
          >
            {placeholder}
          </div>
          {options.map(option => (
            <div
              key={option.value}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                color: value === option.value ? '#db2777' : '#6b7280',
                background: value === option.value ? '#fdf2f8' : 'white',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => { if (value !== option.value) e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={(e) => { if (value !== option.value) e.currentTarget.style.background = 'white'; }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 12;

export default function CatalogPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { answers } = useQuizStore();
  const getRating = useProductStore((state) => state.getRating);
  const userProfile = useUserProfileStore(state => state.profile);
  const loadProfile = useUserProfileStore(state => state.loadProfile);
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [useQuizFilter, setUseQuizFilter] = useState(true);
  const [showMatchScore, setShowMatchScore] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);
    
    if (loggedIn) {
      loadProfile();
    }
    
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      setCurrentPage(1);
    }
  }, [selectedBrand, selectedCategory, searchQuery, sortBy, useQuizFilter]);

  useEffect(() => {
    if (isMounted) {
      fetchData();
    }
  }, [currentPage, selectedBrand, selectedCategory, searchQuery, sortBy, useQuizFilter, isMounted, userProfile, answers]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const allParams: ProductsParams = { page_size: 999 };
      if (selectedBrand) allParams.brand = selectedBrand;
      if (selectedCategory) allParams.category = selectedCategory;
      if (searchQuery) allParams.search = searchQuery;
      
      const allRes = await productsAPI.getAll(allParams);
      let allProducts: RecommendedProduct[] = allRes.data.results || [];
      
      if (isLoggedIn) {
        const effectiveSkinType = answers?.skin_type || userProfile?.skinType || '';
        const effectiveProblems = answers?.problems || userProfile?.problems || [];
        
        if (useQuizFilter && effectiveSkinType) {
          const userSkinType = effectiveSkinType.toLowerCase();
          allProducts = allProducts.filter(product => {
            const types = (product.suitable_skin_types || '').toLowerCase();
            if (!types || types === 'all') return true;
            return types.split(',').map(t => t.trim()).includes(userSkinType);
          });
        }
        
        if (effectiveSkinType || effectiveProblems.length > 0) {
          allProducts = allProducts.map(product => ({
            ...product,
            match_percentage: calculateMatchPercentage(
              product.suitable_skin_types || 'all',
              product.solves_problems || '',
              { skinType: effectiveSkinType || 'normal', problems: effectiveProblems }
            ).percentage
          }));
        }
        
        if (sortBy === 'match') {
          allProducts.sort((a, b) => (b.match_percentage || 0) - (a.match_percentage || 0));
        }
      }
      
      if (sortBy === 'rating') {
        allProducts.sort((a, b) => b.rating - a.rating);
      }
      
      const totalCount = allProducts.length;
      const pages = Math.ceil(totalCount / PAGE_SIZE) || 1;
      setTotalPages(pages);
      
      if (currentPage > pages) {
        setCurrentPage(1);
        return;
      }
      
      const start = (currentPage - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageProducts = allProducts.slice(start, end);
      
      setProducts(pageProducts);
      
      if (brands.length === 0 || categories.length === 0) {
        const [brandsRes, categoriesRes] = await Promise.all([
          brandsAPI.getAll(),
          categoriesAPI.getAll()
        ]);
        
        const brandsData = brandsRes.data as Brand[] | PaginatedResponse<Brand>;
        setBrands(Array.isArray(brandsData) ? brandsData : brandsData?.results || []);
        
        const categoriesData = categoriesRes.data as Category[] | PaginatedResponse<Category>;
        setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData?.results || []);
      }
      
    } catch (error) {
      console.error('Error fetching catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFavorite = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error('Войдите, чтобы добавлять в избранное');
      return;
    }
    if (isFavorite(productId)) {
      removeFavorite(productId);
      toast.success('Удалено из избранного');
    } else {
      addFavorite(productId);
      toast.success('Добавлено в избранное');
    }
  };

  const toggleFilter = () => {
    setUseQuizFilter(!useQuizFilter);
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (!isMounted) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>Каталог косметики</h1>
        <div style={{ textAlign: 'center', padding: '60px' }}>Загрузка...</div>
      </div>
    );
  }

  const hasUserData = isLoggedIn && (
    userProfile?.skinType ||
    (userProfile?.problems && userProfile.problems.length > 0) ||
    answers?.skin_type ||
    (answers?.problems && answers.problems.length > 0)
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>Каталог косметики</h1>
      
      {hasUserData && (
        <div style={{
          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
          border: '1px solid #fbcfe8',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>Персональный подбор</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {useQuizFilter 
                  ? 'Подобрано с учетом вашего типа кожи, проблем и аллергий'
                  : 'Показываются все товары без фильтрации'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowMatchScore(!showMatchScore)}
              style={{
                padding: '6px 12px',
                border: '1px solid #db2777',
                borderRadius: '20px',
                background: 'white',
                color: '#db2777',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showMatchScore ? 'Скрыть совпадения' : 'Показать совпадения'}
            </button>
            <button
              onClick={toggleFilter}
              style={{
                padding: '8px 16px',
                backgroundColor: useQuizFilter ? '#db2777' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {useQuizFilter ? 'Показать все' : 'По профилю'}
            </button>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '32px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px'
      }}>
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '16px',
            outline: 'none',
          }}
        />
        
        <CustomSelect
          value={selectedBrand ? String(selectedBrand) : ''}
          onChange={(v) => setSelectedBrand(v ? Number(v) : null)}
          options={brands.map(b => ({ value: String(b.id), label: b.name }))}
          placeholder="Все бренды"
        />
        
        <CustomSelect
          value={selectedCategory ? String(selectedCategory) : ''}
          onChange={(v) => setSelectedCategory(v ? Number(v) : null)}
          options={categories.map(c => ({ value: String(c.id), label: c.name }))}
          placeholder="Все категории"
        />
        
        <CustomSelect
          value={sortBy}
          onChange={setSortBy}
          options={[
            ...(isLoggedIn ? [{ value: 'match', label: 'По совпадению' }] : []),
            { value: 'newest', label: 'Сначала новинки' },
            { value: 'rating', label: 'По рейтингу' },
          ]}
          placeholder="Сортировка"
        />
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>Загрузка...</div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {products.map((product) => {
              const displayRating = getRating(product.id) || product.rating;
              const fav = isFavorite(product.id);
              
              return (
                <Link key={product.id} href={`/product/${product.id}`} style={{ textDecoration: 'none', display: 'flex' }}>
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s',
                    cursor: 'pointer',
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}>
                    
                    <button
                      onClick={(e) => handleFavorite(e, product.id)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 2,
                        fontSize: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s',
                        color: fav ? '#ef4444' : '#d1d5db',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {fav ? '❤️' : '🤍'}
                    </button>
                    
                    {isLoggedIn && showMatchScore && product.match_percentage !== undefined && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: product.match_percentage >= 70 ? '#22c55e' : product.match_percentage >= 40 ? '#f59e0b' : '#ef4444',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        zIndex: 1
                      }}>
                        Совпадение {product.match_percentage}%
                      </div>
                    )}
                    
                    <div style={{
                      height: '220px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      {product.main_image_url ? (
                        <img
                          src={product.main_image_url}
                          alt={product.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.innerHTML = '<span style="font-size: 48px;">🧴</span>';
                            }
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '48px' }}>🧴</span>
                      )}
                    </div>
                    
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '14px', color: '#db2777', marginBottom: '8px' }}>{product.brand_name}</div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '12px',
                        color: '#1f2937',
                        lineHeight: '1.4',
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>{product.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
                        <span>⭐</span>
                        <span style={{ color: '#6b7280' }}>{displayRating}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '40px',
            }}>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: currentPage === 1 ? 'default' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                ← Назад
              </button>
              
              {getPageNumbers().map((page, idx) => (
                page === '...' ? (
                  <span key={`dots-${idx}`} style={{ padding: '0 4px', color: '#9ca3af' }}>...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: page === currentPage ? 'none' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background: page === currentPage ? '#db2777' : 'white',
                      color: page === currentPage ? 'white' : '#6b7280',
                      cursor: 'pointer',
                      fontWeight: page === currentPage ? '600' : '400',
                    }}
                  >
                    {page}
                  </button>
                )
              ))}
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: currentPage === totalPages ? 'default' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                Вперед →
              </button>
            </div>
          )}
        </>
      )}
      
      {!loading && products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          {hasUserData && useQuizFilter ? 'Нет товаров, подходящих под ваши параметры. Попробуйте отключить фильтр.' : 'Товары не найдены'}
        </div>
      )}
    </div>
  );
}