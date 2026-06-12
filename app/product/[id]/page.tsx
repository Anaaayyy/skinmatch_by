'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { productsAPI } from '../../services/api';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useComparisonStore } from '../../store/comparisonStore';
import { useProductStore } from '../../store/productStore';
import Reviews from '../../components/Reviews';
import { Product, ProductImage } from '../../types';
import { translateSkinType, translateProblems } from '../../utils/translations';



export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { addProduct, removeProduct, isInComparison } = useComparisonStore();
  const updateRating = useProductStore((state) => state.updateRating);
  const getRating = useProductStore((state) => state.getRating);
  const storedRating = getRating(productId);
  const currentRating = storedRating || product?.rating;

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getById(productId);
      setProduct(response.data);
      
      if (response.data.main_image_url) {
        setActiveImage(response.data.main_image_url);
      } else if (response.data.gallery && response.data.gallery.length > 0) {
        setActiveImage(response.data.gallery[0].url);
      }
      
      const similarRes = await productsAPI.getAll({ 
        category: response.data.category,
        page_size: 4 
      });
      setSimilarProducts(similarRes.data.results.filter((p: Product) => p.id !== productId));
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Товар не найден');
      router.push('/catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!product) return;
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Войдите в аккаунт, чтобы добавлять в избранное');
      router.push('/login');
      return;
    }
    
    if (isFavorite(product.id)) {
      await removeFavorite(product.id);
      toast.success('Удалено из избранного');
    } else {
      await addFavorite(product.id);
      toast.success('Добавлено в избранное');
    }
  };

  const handleCompare = async () => {
    if (!product) return;
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Войдите в аккаунт, чтобы сравнивать товары');
      router.push('/login');
      return;
    }
    
    if (isInComparison(product.id)) {
      await removeProduct(product.id);
      toast.success('Удалено из сравнения');
    } else {
      const store = useComparisonStore.getState();
      const countInCategory = await store.getCategoryCount(product.category);
      
      if (countInCategory >= 4) {
        toast.error(`В категории «${product.category_name}» уже 4 товара. Удалите один перед добавлением.`);
        return;
      }
      
      await addProduct(product.id, product.category);
      toast.success('Добавлено в сравнение');
    }
  };

  const getAllImages = (): string[] => {
    const images: string[] = [];
    if (product?.main_image_url) {
      images.push(product.main_image_url);
    }
    if (product?.gallery) {
      product.gallery.forEach((img: ProductImage) => {
        if (img.url) images.push(img.url);
      });
    }
    return images;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Загрузка...</div>;
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2>Товар не найден</h2>
        <Link href="/catalog" style={{ color: '#db2777', marginTop: '16px', display: 'inline-block' }}>Вернуться в каталог</Link>
      </div>
    );
  }

  const allImages = getAllImages();
  const hasMultipleImages = allImages.length > 1;

  return (
    <div className="product-page-container">
      <div className="product-breadcrumbs">
        <Link href="/">Главная</Link>
        {' / '}
        <Link href="/catalog">Каталог</Link>
        {' / '}
        <span>{product.title}</span>
      </div>

      <div className="product-main">
        <div className="product-gallery">
          <div className="product-main-image" onClick={() => activeImage && setShowModal(true)}>
            {activeImage ? (
              <img src={activeImage} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>🧴</span>
            )}
            {hasMultipleImages && <div className="product-zoom-hint">🔍</div>}
          </div>
          
          {hasMultipleImages && (
            <div className="product-thumbnails">
              {allImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className={`product-thumbnail ${activeImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setActiveImage(imgUrl)}
                >
                  <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
        <div className="product-brand">
          {product.brand_website || product.brand_shop_url ? (
            <a 
              href={product.brand_website || product.brand_shop_url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#db2777', textDecoration: 'none' }}
            >
              {product.brand_name}
            </a>
          ) : (
            <span>{product.brand_name}</span>
          )}
        </div>
          <h1 className="product-title">{product.title}</h1>
          
          <div className="product-rating-volume">
            <div className="product-rating">
              <span>⭐</span>
              <span>{currentRating}</span>
              <span>/ 5</span>
            </div>
            {product.volume && <div className="product-volume">{product.volume} мл</div>}
          </div>

          {product.description && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Описание</h3>
              <p style={{ color: '#4b5563', lineHeight: '1.6', fontSize: '15px' }}>
                {product.description}
              </p>
            </div>
          )}

          <div className="product-characteristics">
            <h3 className="product-section-title">Характеристики</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#6b7280' }}>Тип кожи</span>
              <span style={{ fontWeight: '500', color: '#1f2937' }}>
                {translateSkinType(product.suitable_skin_types || 'all')}
              </span>
            </div>
            <div className="product-char-item">
              <span>Категория</span>
              <span>{product.category_name}</span>
            </div>
          </div>

          {product.solves_problems && (
            <div className="product-problems">
              <h3 className="product-section-title">Решает проблемы</h3>
              <div className="product-problems-list">
                {translateProblems(product.solves_problems)
                  .split(', ')
                  .filter(p => p)
                  .map((problem, idx) => (
                    <span key={idx}>{problem.trim()}</span>
                  ))}
              </div>
            </div>
          )}

          {!product.solves_problems && product.suitable_skin_types === 'all' && (
            <div className="product-problems">
              <h3 className="product-section-title">Тип кожи</h3>
              <div className="product-problems-list">
                <span>Подходит для всех типов кожи</span>
              </div>
            </div>
          )}

          {product.ingredients && (
            <div className="product-ingredients">
              <h3 className="product-section-title">Состав (INCI)</h3>
              <div>{product.ingredients}</div>
            </div>
          )}

          {product.how_to_use && (
            <div className="product-how-to-use">
              <h3 className="product-section-title">Способ применения</h3>
              <p>{product.how_to_use}</p>
            </div>
          )}

          <div className="product-actions">
            <button className={`product-favorite ${isFavorite(product.id) ? 'active' : ''}`} onClick={handleFavorite}>
              {isFavorite(product.id) ? 'В избранном' : 'В избранное'}
            </button>
            <button className={`product-compare ${isInComparison(product.id) ? 'active' : ''}`} onClick={handleCompare}>
              {isInComparison(product.id) ? 'В сравнении' : 'Сравнить'}
            </button>
          </div>
        </div>
      </div>

      <Reviews 
        productId={product.id} 
        onRatingUpdate={(newRating: number) => {
          updateRating(product.id, newRating);
          setProduct((prev: Product | null) => prev ? { ...prev, rating: newRating } : null);
        }}
      />

      {similarProducts.length > 0 && (
        <div className="similar-products">
          <h2>Похожие товары</h2>
          <div className="similar-grid">
            {similarProducts.map((similar: Product) => (
              <Link key={similar.id} href={`/product/${similar.id}`} className="similar-card">
                <div className="similar-image">
                  {similar.main_image_url ? (
                    <img src={similar.main_image_url} alt={similar.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>🧴</span>
                  )}
                </div>
                <div className="similar-info">
                  <div className="similar-brand">{similar.brand_name}</div>
                  <h3>{similar.title}</h3>
                  <div className="similar-rating">
                    <span>⭐</span>
                    <span>{similar.rating}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showModal && activeImage && (
        <div className="product-modal" onClick={() => setShowModal(false)}>
          <div className="product-modal-content">
            <img src={activeImage} alt={product.title} style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} />
            <button className="product-modal-close" onClick={() => setShowModal(false)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}