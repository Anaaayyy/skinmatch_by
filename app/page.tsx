'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productsAPI, brandsAPI } from './services/api';
import { Product, Brand } from './types';
import { useQuizStore } from './store/quizStore';
import { useProductStore } from './store/productStore';
import Swiper from 'swiper';
import 'swiper/css';

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [popularBrands, setPopularBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const hasQuiz = useQuizStore((state) => state.hasQuiz());
  const answers = useQuizStore((state) => state.answers);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, brandsRes] = await Promise.all([
        productsAPI.getAll({ page_size: 8, ordering: '-first_published_at' }),
        brandsAPI.getAll()
      ]);
      setNewProducts(productsRes.data.results || []);
      
      let brandsData: Brand[] = [];
      const data = brandsRes.data;
      if (data) {
        if (Array.isArray(data)) {
          brandsData = data;
        } else if ('results' in data && Array.isArray(data.results)) {
          brandsData = data.results;
        }
      }
      setPopularBrands(brandsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setPopularBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedProducts = () => {
    if (!answers) return [];
    return newProducts.filter(product => 
      product.skin_type === answers.skin_type
    );
  };

  const recommendedProducts = getRecommendedProducts();

  const fallbackBrands: Brand[] = [
    { id: 1, name: 'Белита', description: 'Легендарный белорусский бренд', logo: null },
    { id: 2, name: 'Витекс', description: 'Профессиональная косметика', logo: null },
    { id: 3, name: 'Маркелл', description: 'Инновационная косметика', logo: null },
    { id: 4, name: 'Liv Delano', description: 'Премиальная косметика', logo: null },
    { id: 5, name: 'Натур Сиберика', description: 'Натуральная косметика', logo: null },
  ];

  const displayBrands = popularBrands.length > 0 ? popularBrands : fallbackBrands;

  // Для бесконечной прокрутки дублируем бренды
  const infiniteBrands = [...displayBrands, ...displayBrands, ...displayBrands];

  if (!isMounted) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Загрузка...</div>;
  }

  return (
    <div>
      {/* Hero секция */}
      <section style={{
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#1f2937',
            fontFamily: 'Gentium Plus, serif'
          }}>
            Подберите идеальную косметику
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#4a5568',
            marginBottom: '40px',
            lineHeight: '1.5',
            fontFamily: 'Gentium Plus, serif'
          }}>
            Пройдите анкету и получите персональные рекомендации по уходу за кожей
          </p>
          <Link
            href="/questionnaire"
            style={{
              background: '#db2777',
              color: 'white',
              padding: '14px 40px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-block',
              fontFamily: 'Gentium Plus, serif'
            }}
          >
            Пройти анкету
          </Link>
        </div>
      </section>

      {/* Рекомендованные товары */}
      {hasQuiz && recommendedProducts.length > 0 && (
        <section style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px', fontFamily: 'Gentium Plus, serif' }}>
            Рекомендовано для вас
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '28px'
          }}>
            {recommendedProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Новинки */}
      <section style={{ padding: '60px 20px', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px', fontFamily: 'Gentium Plus, serif' }}>
            Новинки белорусской косметики
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '28px'
            }}>
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Популярные бренды - БЕСКОНЕЧНАЯ КАРУСЕЛЬ */}

      <section style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px', fontFamily: 'Gentium Plus, serif' }}>
          Популярные <span className="gradient-text">бренды</span>
        </h2>
        <p style={{ fontSize: '16px', color: '#6b7280', textAlign: 'center', marginBottom: '48px', fontFamily: 'Gentium Plus, serif' }}>
          Ведущие белорусские производители косметики
        </p>
        
        <div className="brands-marquee">
          <div className="brands-track">
            {infiniteBrands.map((brand, idx) => (
              <Link key={`${brand.id}-${idx}`} href={`/brand/${brand.id}`} style={{ textDecoration: 'none' }}>
                <div className="brand-card">
                  <div className="brand-logo-rect">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          padding: '16px'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.parentElement) {
                            target.parentElement.innerHTML = '<span style="font-size: 40px;">✨</span>';
                          }
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '40px' }}>✨</span>
                    )}
                  </div>
                  <h3 className="brand-name">{brand.name}</h3>
                  <p className="brand-desc">{brand.description?.substring(0, 50) || 'Белорусский бренд'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .brands-marquee {
          width: 100%;
          overflow: hidden;
          position: relative;
        }
        
        .brands-track {
          display: flex;
          gap: 24px;
          animation: scroll 30s linear infinite;
          width: fit-content;
        }
        
        .brands-marquee:hover .brands-track {
          animation-play-state: paused;
        }
        
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .brand-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transition: transform 0.3s, box-shadow 0.3s;
          cursor: pointer;
          width: 180px;
          flex-shrink: 0;
        }
        
        .brand-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.12);
        }
        
        .brand-logo-rect {
          width: 100%;
          height: 120px;
          background-color:rgb(255, 255, 255);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          overflow: hidden;
        }
        
        .brand-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1f2937;
          font-family: 'Gentium Plus', serif;
        }
        
        .brand-desc {
          font-size: 12px;
          color: #6b7280;
          font-family: 'Gentium Plus', serif;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .brand-card {
            width: 150px;
            padding: 16px;
          }
          .brand-logo-rect {
            height: 100px;
          }
          .brand-name {
            font-size: 14px;
          }
          .brands-track {
            gap: 16px;
            animation: scroll 20s linear infinite;
          }
        }
      `}</style>
      


      {/* Преимущества */}
      <section style={{ backgroundColor: '#f9fafb', padding: '60px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '48px', fontFamily: 'Gentium Plus, serif' }}>
            Почему выбирают нас
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', fontFamily: 'Gentium Plus, serif' }}>Индивидуальный подход</h3>
              <p style={{ color: '#6b7280', fontFamily: 'Gentium Plus, serif' }}>Учитываем тип кожи, проблемы и аллергии</p>
            </div>
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', fontFamily: 'Gentium Plus, serif' }}>Только белорусские бренды</h3>
              <p style={{ color: '#6b7280', fontFamily: 'Gentium Plus, serif' }}>Лучшие производители Беларуси</p>
            </div>
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', fontFamily: 'Gentium Plus, serif' }}>Экономия времени</h3>
              <p style={{ color: '#6b7280', fontFamily: 'Gentium Plus, serif' }}>Не нужно самим изучать составы</p>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .brands-marquee {
          width: 100%;
          overflow: hidden;
          position: relative;
        }
        
        .brands-track {
          display: flex;
          gap: 24px;
          animation: scroll 30s linear infinite;
          width: fit-content;
        }
        
        .brands-marquee:hover .brands-track {
          animation-play-state: paused;
        }
        
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .brand-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transition: transform 0.3s, box-shadow 0.3s;
          cursor: pointer;
          width: 180px;
          flex-shrink: 0;
        }
        
        .brand-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.12);
        }
        
        .brand-logo {
          width: 100px;
          height: 100px;
          margin: 0 auto 16px;
          background-color: #f8f9fa;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .brand-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 16px;
        }
        
        .brand-logo span {
          font-size: 40px;
        }
        
        .brand-card h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1f2937;
          font-family: 'Gentium Plus', serif;
        }
        
        .brand-card p {
          font-size: 12px;
          color: #6b7280;
          font-family: 'Gentium Plus', serif;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .brand-card {
            width: 150px;
            padding: 16px;
          }
          .brand-logo {
            width: 80px;
            height: 80px;
          }
          .brand-logo span {
            font-size: 32px;
          }
          .brand-card h3 {
            font-size: 14px;
          }
          .brands-track {
            gap: 16px;
            animation: scroll 20s linear infinite;
          }
        }
      `}</style>
    </div>
  );
}

// Компонент карточки товара
function ProductCard({ product }: { product: Product }) {
  const getRating = useProductStore((state) => state.getRating);
  const displayRating = getRating(product.id) || product.rating;
  
  return (
    <Link href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'transform 0.3s, box-shadow 0.3s',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      }}>
        <div style={{
          height: '260px',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {product.main_image_url ? (
            <img
              src={product.main_image_url}
              alt={product.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.5s'
              }}
              onMouseEnter={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.transform = 'scale(1)';
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = '<span style="font-size: 56px;">🧴</span>';
                }
              }}
            />
          ) : (
            <span style={{ fontSize: '56px' }}>🧴</span>
          )}
        </div>
        <div style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ 
            fontSize: '13px', 
            color: '#db2777', 
            marginBottom: '6px',
            fontWeight: '500'
          }}>
            {product.brand_name}
          </div>
          <h3 style={{ 
            fontSize: '15px', 
            fontWeight: '600', 
            marginBottom: '8px', 
            color: '#1f2937',
            lineHeight: '1.3'
          }}>
            {product.title}
          </h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '13px' }}>⭐</span>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280' }}>{displayRating}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}