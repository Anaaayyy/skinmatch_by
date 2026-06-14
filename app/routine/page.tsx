'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { productsAPI, profileAPI, routinesAPI } from '../services/api';
import { Product } from '../types';

interface SkinProfile {
  id: number;
  username: string;
  email: string;
  skin_type: string;
  problems: string;
  age_range: string;
  allergies: string;
}

interface SelectedProducts {
  cleansing: Product | null;
  toner: Product | null;
  serum: Product | null;
  cream: Product | null;
  spf: Product | null;
}

interface Step {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  exclude: string[];
}

export default function RoutinePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProducts>({
    cleansing: null,
    toner: null,
    serum: null,
    cream: null,
    spf: null,
  });
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);

  const steps: Step[] = [
    { id: 'cleansing', name: 'Очищение', description: 'Выберите средство для умывания', keywords: ['очищ', 'гель', 'пенк', 'мусс'], exclude: ['тоник', 'сыворотк', 'крем', 'spf', 'солнце'] },
    { id: 'toner', name: 'Тонизирование', description: 'Выберите тоник или лосьон', keywords: ['тоник', 'тонер'], exclude: ['очищ', 'гель', 'пенк', 'сыворотк', 'крем', 'spf'] },
    { id: 'serum', name: 'Сыворотка', description: 'Выберите сыворотку', keywords: ['сыворотк', 'serum'], exclude: ['очищ', 'гель', 'пенк', 'тоник', 'крем', 'spf'] },
    { id: 'cream', name: 'Увлажнение', description: 'Выберите крем', keywords: ['крем', 'флюид', 'эмульс'], exclude: ['очищ', 'гель', 'пенк', 'тоник', 'сыворотк', 'spf', 'солнцезащит', 'солнце', 'bb', 'cc', 'тональ', 'санскрин'] },
    { id: 'spf', name: 'SPF защита', description: 'Выберите SPF средство', keywords: ['spf', 'солнцезащит', 'санскрин', 'sunscreen', 'sun'], exclude: ['очищ', 'гель', 'пенк', 'тоник'] },
  ];

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [profileRes, productsRes] = await Promise.all([
        profileAPI.get(),
        productsAPI.getAll({ page_size: 100 })
      ]);
      setSkinProfile(profileRes.data);
      const products = productsRes.data.results || [];
      setAllProducts(products);
      filterProducts(profileRes.data, products, steps[0]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = (profile: SkinProfile, products: Product[], step: Step): void => {
    let filtered = [...products];
    
    // Включаем только те, где есть ключевые слова
    filtered = filtered.filter(p => {
      if (!p.title && !p.category_name) return false;
      const text = `${p.title} ${p.category_name}`.toLowerCase();
      return step.keywords.some(kw => text.includes(kw));
    });
    
    // Исключаем те, где есть слова из exclude
    if (step.exclude.length > 0) {
      filtered = filtered.filter(p => {
        const text = `${p.title} ${p.category_name}`.toLowerCase();
        return !step.exclude.some(kw => text.includes(kw));
      });
    }
    
    // Фильтр по типу кожи
    if (profile?.skin_type) {
      const skinType = profile.skin_type.toLowerCase();
      filtered = filtered.filter(p => {
        if (!p.suitable_skin_types) return true;
        const suitable = p.suitable_skin_types.toLowerCase();
        return suitable.includes(skinType) || suitable.includes('all');
      });
    }
    
    // Фильтр по проблемам (кроме очищения и SPF)
    if (profile?.problems && step.id !== 'cleansing' && step.id !== 'spf') {
      const problems = profile.problems.split(',').map(p => p.trim().toLowerCase());
      filtered = filtered.filter(p => {
        if (!p.solves_problems) return true;
        const solves = p.solves_problems.toLowerCase();
        return problems.some(problem => solves.includes(problem));
      });
    }
    
    filtered.sort((a, b) => b.rating - a.rating);
    
    setFilteredProducts(filtered.slice(0, 15));
  };

  const selectProduct = (stepId: string, product: Product): void => {
    setSelectedProducts(prev => ({ ...prev, [stepId]: product }));
    
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (skinProfile) {
        filterProducts(skinProfile, allProducts, steps[nextStep]);
      }
    } else {
      setShowNameModal(true);
    }
  };

  const goBack = (): void => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (skinProfile) {
        filterProducts(skinProfile, allProducts, steps[prevStep]);
      }
    }
  };

  const skipStep = (): void => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (skinProfile) {
        filterProducts(skinProfile, allProducts, steps[nextStep]);
      }
    } else {
      setShowNameModal(true);
    }
  };

  const saveRoutine = async (): Promise<void> => {
    if (!routineName.trim()) {
      toast.error('Введите название рутины');
      return;
    }
    
    setSaving(true);
    try {
      await routinesAPI.create({
        name: routineName,
        goal: 'custom',
        time_of_day: 'morning',
        cleansing: selectedProducts.cleansing?.id || null,
        toner: selectedProducts.toner?.id || null,
        serum: selectedProducts.serum?.id || null,
        cream: selectedProducts.cream?.id || null,
        spf: selectedProducts.spf?.id || null,
      });
      toast.success('Рутина сохранена в профиль');
      setShowNameModal(false);
      router.push('/profile');
    } catch (error) {
      console.error('Error saving routine:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const currentStepData = steps[currentStep];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#db2777', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px' }}>Требуется авторизация</h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>Войдите в аккаунт, чтобы создать рутину ухода</p>
        <Link href="/login" style={{ background: '#db2777', color: 'white', padding: '12px 32px', borderRadius: '30px', textDecoration: 'none' }}>
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '12px' }}>
        {currentStep > 0 && (
          <button onClick={goBack} style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: '#6b7280', marginBottom: '20px' }}>
            ← Назад
          </button>
        )}
        <div style={{ display: 'flex', gap: 8, marginBottom: '28px' }}>
          {steps.map((step, idx) => (
            <div key={step.id} style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: idx <= currentStep ? '#db2777' : '#e5e7eb',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          Шаг {currentStep + 1} из {steps.length}
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>{currentStepData.name}</h2>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>{currentStepData.description}</p>
      </div>

      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#f9fafb', borderRadius: '16px' }}>
          <p style={{ color: '#6b7280' }}>Нет подходящих продуктов для этого этапа</p>
          <button 
            onClick={skipStep}
            style={{ marginTop: '16px', padding: '8px 20px', border: '1px solid #db2777', borderRadius: '8px', background: 'white', color: '#db2777', cursor: 'pointer' }}
          >
            Пропустить этап
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => selectProduct(currentStepData.id, product)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                background: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#db2777'; e.currentTarget.style.backgroundColor = '#fdf2f8' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = 'white' }}
            >
              <div style={{ width: '50px', height: '50px', background: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {product.main_image_url ? (
                  <img src={product.main_image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '24px', color: '#d1d5db' }}>○</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#db2777' }}>{product.brand_name}</div>
                <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{product.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span>★</span>
                  <span>{product.rating}</span>
                  {product.volume && <span style={{ color: '#6b7280' }}>{product.volume} мл</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <button
          onClick={skipStep}
          style={{ padding: '10px 24px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '14px' }}
        >
          Пропустить этот шаг
        </button>
      </div>

      {showNameModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px' }}>Сохранить рутину</h3>
            <input
              type="text"
              placeholder="Название рутины (например: Мой ежедневный уход)"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowNameModal(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>
                Отмена
              </button>
              <button onClick={saveRoutine} disabled={saving} style={{ flex: 1, padding: '12px', background: '#db2777', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}