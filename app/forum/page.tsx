'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { forumAPI } from '../services/api';

interface ForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  topics_count: number;
  posts_count: number;
}

export default function ForumPage() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const res = await forumAPI.getCategories();
      const data = res.data as { results?: ForumCategory[] } | ForumCategory[];
      setCategories(Array.isArray(data) ? data : (data.results || []));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '80px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #fce7f3', borderTopColor: '#db2777', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 20px 80px' }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{
          fontSize: 30, fontWeight: 700, color: '#1f2937', margin: 0,
          background: 'linear-gradient(135deg, #1f2937, #db2777)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Форум</h1>
        <p style={{ fontSize: 15, color: '#9ca3af', margin: '6px 0 0 0' }}>
          Обсуждайте уход, делитесь опытом и находите ответы
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {categories.map(cat => (
          <Link
            key={cat.id}
            href={`/forum/${cat.slug}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              padding: '20px 24px', background: 'white', borderRadius: 16,
              border: '1px solid #f3f4f6', textDecoration: 'none', color: 'inherit',
              transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              flexWrap: 'wrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbcfe8'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(219,39,119,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'; }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>{cat.name}</div>
              {cat.description && <div style={{ fontSize: 13, color: '#9ca3af' }}>{cat.description}</div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>{cat.topics_count}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>тем</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>{cat.posts_count}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>сообщ.</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!loading && categories.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af', fontSize: 14, background: '#fafafa', borderRadius: 16, marginTop: 8 }}>
          Разделы форума пока пусты
        </div>
      )}

      <style>{`
        @media (max-width: 500px) {
          .forum-card {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
}