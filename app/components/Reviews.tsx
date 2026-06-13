'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useProductStore } from '../store/productStore';
import { moderationAPI } from '../services/api';

interface ReviewImage {
  id: number;
  url: string;
}

interface Review {
  id: number;
  username: string;
  user_id: number;
  rating: number;
  text: string;
  created_at: string;
  images: ReviewImage[];
  avatar_url?: string;
}

interface ReviewsProps {
  productId: number;
  onRatingUpdate?: (newRating: number) => void;
}

const fixImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  // Извлекаем только путь после /media/
  const mediaIndex = url.indexOf('/media/');
  if (mediaIndex !== -1) {
    return 'https://skinmatch.online' + url.substring(mediaIndex);
  }
  // Если уже абсолютный URL с skinmatch.online — оставляем
  if (url.includes('skinmatch.online')) return url;
  // Если относительный путь — добавляем домен
  if (url.startsWith('/')) return 'https://skinmatch.online' + url;
  return url;
};

export default function Reviews({ productId, onRatingUpdate }: ReviewsProps) {
  const router = useRouter();
  const updateProductRating = useProductStore((state) => state.updateRating);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImagesOnly, setShowImagesOnly] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, text: '' });
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string; id?: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
    fetchReviews();
  }, [productId, showImagesOnly]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://skinmatch.online/api/reviews/?product=${productId}`);
      const data = await response.json();
      let reviewsData = data.results || [];
      
      if (showImagesOnly) {
        reviewsData = reviewsData.filter((r: Review) => r.images && r.images.length > 0);
      }
      
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<number | null> => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          const response = await fetch('https://skinmatch.online/api/reviews/upload_image/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ image: base64String })
          });
          const data = await response.json();
          resolve(data.image_id);
        } catch (error) {
          console.error('Error uploading image:', error);
          resolve(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedImages.length + files.length > 5) {
      toast.error('Можно загрузить не более 5 фото');
      return;
    }
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(uploadedImages[index].preview);
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }
    
    const checkRes = await moderationAPI.checkText(newReview.text);
    if (checkRes.data.has_bad_words) {
      toast.error(checkRes.data.message || 'Текст содержит запрещённые слова');
      setIsSubmitting(false);
      return;
    }
    if (!newReview.text.trim()) {
      toast.error('Напишите текст отзыва');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const uploadedImageIds: number[] = [];
      for (const img of uploadedImages) {
        const imageId = await uploadImage(img.file);
        if (imageId) uploadedImageIds.push(imageId);
      }
      
      const response = await fetch('https://skinmatch.online/api/reviews/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product: productId,
          rating: newReview.rating,
          text: newReview.text,
          uploaded_images: uploadedImageIds
        })
      });
      
      if (response.ok) {
        toast.success('Отзыв добавлен!');
        setNewReview({ rating: 5, text: '' });
        setUploadedImages([]);
        
        await fetchReviews();
        
        const updatedProduct = await fetch(`https://skinmatch.online/api/products/${productId}/`);
        const productData = await updatedProduct.json();
        const newRating = productData.average_rating || productData.rating;
        
        updateProductRating(productId, newRating);
        
        if (onRatingUpdate) {
          onRatingUpdate(newRating);
        }
      } else {
        toast.error('Ошибка при добавлении отзыва');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Ошибка при добавлении отзыва');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && setNewReview(prev => ({ ...prev, rating: star }))}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: interactive ? 'pointer' : 'default',
              color: star <= rating ? '#fbbf24' : '#e5e7eb',
              transition: 'transform 0.1s',
              padding: '0'
            }}
            onMouseEnter={(e) => {
              if (interactive) e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              if (interactive) e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const reviewsWithPhotos = reviews.filter(r => r.images && r.images.length > 0).length;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }));

  return (
    <div style={{ marginTop: '60px', borderTop: '1px solid #e5e7eb', paddingTop: '40px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px' }}>Отзывы</h2>
      
      {reviews.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '40px',
          marginBottom: '40px',
          padding: '24px',
          backgroundColor: '#f9fafb',
          borderRadius: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1f2937' }}>{averageRating}</div>
            <div style={{ marginTop: '8px' }}>{renderStars(Math.round(parseFloat(averageRating)))}</div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{reviews.length} отзывов</div>
          </div>
          <div style={{ flex: 1 }}>
            {ratingDistribution.map(({ star, percentage }) => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ width: '30px', fontSize: '14px' }}>{star} ★</span>
                <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#fbbf24', borderRadius: '4px' }} />
                </div>
                <span style={{ width: '40px', fontSize: '14px', color: '#6b7280' }}>{percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowImagesOnly(false)}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              border: showImagesOnly ? '1px solid #e5e7eb' : 'none',
              backgroundColor: showImagesOnly ? 'white' : '#db2777',
              color: showImagesOnly ? '#6b7280' : 'white',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s',
              boxShadow: showImagesOnly ? 'none' : '0 2px 8px rgba(219,39,119,0.3)'
            }}
          >
            Все отзывы ({reviews.length})
          </button>
          <button
            onClick={() => setShowImagesOnly(true)}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              border: showImagesOnly ? 'none' : '1px solid #e5e7eb',
              backgroundColor: showImagesOnly ? '#db2777' : 'white',
              color: showImagesOnly ? 'white' : '#6b7280',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s',
              boxShadow: showImagesOnly ? '0 2px 8px rgba(219,39,119,0.3)' : 'none'
            }}
          >
            📷 С фото ({reviewsWithPhotos})
          </button>
        </div>
      </div>

      {isLoggedIn && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '28px',
          marginBottom: '32px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             Оставить отзыв
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500', fontSize: '14px' }}>Ваша оценка</label>
            {renderStars(newReview.rating, true)}
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500', fontSize: '14px' }}>Ваш отзыв</label>
            <textarea
              value={newReview.text}
              onChange={(e) => setNewReview(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Расскажите о своем опыте использования продукта..."
              rows={4}
              style={{
                width: '100%',
                padding: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#db2777'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500', fontSize: '14px' }}>Фотографии (до 5 шт.)</label>
            <div style={{
              border: '1px dashed #e5e7eb',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              backgroundColor: '#fafafa'
            }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#db2777'; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files);
              if (uploadedImages.length + files.length > 5) {
                toast.error('Можно загрузить не более 5 фото');
                return;
              }
              const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
              setUploadedImages(prev => [...prev, ...newImages]);
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="review-image-input"
              />
              <label htmlFor="review-image-input" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Нажмите или перетащите фото сюда</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>PNG, JPG до 5MB</div>
              </label>
            </div>
            {uploadedImages.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                {uploadedImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img
                      src={img.preview}
                      alt="Preview"
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={handleSubmitReview}
            disabled={isSubmitting}
            style={{
              padding: '12px 28px',
              backgroundColor: '#db2777',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              fontWeight: '600',
              fontSize: '15px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(219,39,119,0.3)'
            }}
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#be185d'; }}
            onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#db2777'; }}
          >
            {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#db2777', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f9fafb', borderRadius: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Пока нет отзывов</h3>
          <p style={{ color: '#6b7280' }}>Будьте первым, кто поделится впечатлениями!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reviews.map((review) => (
            <div key={review.id} style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              transition: 'box-shadow 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {review.avatar_url ? (
  <img
    src={fixImageUrl(review.avatar_url) || ''}
    alt={review.username}
    style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '2px solid #fdf2f8'
    }}
  />
) : (
  <span style={{
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#fdf2f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    color: '#db2777'
  }}>
    {review.username.charAt(0).toUpperCase()}
  </span>
)}
                    <span style={{ fontWeight: '600', fontSize: '16px' }}>{review.username}</span>
                    {renderStars(review.rating)}
                  </div>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDate(review.created_at)}</span>
                </div>
              </div>
              <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '16px', fontSize: '15px' }}>{review.text}</p>
              {review.images && review.images.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {review.images.map((img) => {
                    const imageUrl = fixImageUrl(img.url) || '';
                    return (
                      <img
                        key={img.id}
                        src={imageUrl}
                        alt="Review"
                        style={{
                          width: '90px',
                          height: '90px',
                          objectFit: 'cover',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          border: '1px solid #e5e7eb',
                          transition: 'transform 0.2s'
                        }}
                        onClick={() => setSelectedImage(imageUrl)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }}
          />
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}