'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { productsAPI, brandsAPI } from '../../services/api';
import { Brand, Product } from '../../types';

export default function BrandPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = parseInt(params.id as string);
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (brandId) {
      fetchBrandData();
    }
  }, [brandId]);

  const fetchBrandData = async () => {
    setLoading(true);
    try {
      // Получаем данные бренда
      const brandsRes = await brandsAPI.getAll();
      const brandsData = Array.isArray(brandsRes.data) ? brandsRes.data : brandsRes.data.results || [];
      const foundBrand = brandsData.find((b: Brand) => b.id === brandId);
      setBrand(foundBrand || null);
      
      // Получаем товары бренда
      const productsRes = await productsAPI.getAll({ brand: brandId, page_size: 20 });
      setProducts(productsRes.data.results || []);
      
    } catch (error) {
      console.error('Error fetching brand:', error);
      toast.error('Ошибка загрузки бренда');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2>Бренд не найден</h2>
        <Link href="/" style={{ color: '#db2777', marginTop: '16px', display: 'inline-block' }}>Вернуться на главную</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Хлебные крошки */}
      <div style={{ marginBottom: '24px', fontSize: '14px', color: '#6b7280' }}>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Главная</Link>
        {' / '}
        <span style={{ color: '#1f2937' }}>{brand.name}</span>
      </div>

      {/* Информация о бренде */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '40px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        textAlign: 'center'
      }}>
        {brand.logo && (
          <div style={{
            width: '150px',
            height: '150px',
            margin: '0 auto 24px',
            backgroundColor: '#f8f9fa',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <img
              src={brand.logo}
              alt={brand.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '20px'
              }}
            />
          </div>
        )}
        
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
          {brand.name}
        </h1>
        
        {brand.description && (
          <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', maxWidth: '800px', margin: '0 auto 24px' }}>
            {brand.description}
          </p>
        )}
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#db2777',
                color: 'white',
                borderRadius: '30px',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#be185d' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#db2777' }}
            >
              🌐 Официальный сайт
            </a>
          )}
          
          {brand.shop_url && (
            <a
              href={brand.shop_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                border: '2px solid #db2777',
                color: '#db2777',
                borderRadius: '30px',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf2f8' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
            >
              🛒 Магазин
            </a>
          )}
        </div>
      </div>

      {/* Товары бренда */}
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
        Товары бренда {brand.name}
      </h2>
      
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f9fafb', borderRadius: '16px' }}>
          <p style={{ color: '#6b7280' }}>Товары этого бренда скоро появятся</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '24px'
        }}>
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                cursor: 'pointer',
                height: '100%'
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
                  height: '200px',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {product.main_image_url ? (
                    <img
                      src={product.main_image_url}
                      alt={product.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '48px' }}>🧴</span>
                  )}
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#db2777', marginBottom: '6px', fontWeight: '500' }}>
                    {product.brand_name}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#1f2937' }}>
                    {product.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⭐</span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>{product.rating}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}