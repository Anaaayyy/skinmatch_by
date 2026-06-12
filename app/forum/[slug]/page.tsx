'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { forumAPI } from '../../services/api';
import { moderationAPI } from '../../services/api';

interface TopicImage {
  id: number;
  url: string;
}

interface Topic {
  id: number;
  title: string;
  content: string;
  images: TopicImage[];
  author: { id: number; username: string; avatar_url: string | null };
  is_closed: boolean;
  is_pinned: boolean;
  posts_count: number;
  created_at: string;
}

interface ForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}

const MAX_IMAGES = 4;



export default function ForumCategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('access_token'));
    fetchCategory();
  }, [slug]);
  useEffect(() => { fetchTopics(); }, [slug, currentPage]);

  const fetchCategory = async () => {
    try {
      const res = await forumAPI.getCategories();
      const data = res.data as { results?: ForumCategory[] } | ForumCategory[];
      const cats = Array.isArray(data) ? data : (data.results || []);
      setCategory(cats.find((c: ForumCategory) => c.slug === slug) || null);
    } catch (error) { console.error(error); }
  };

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const catRes = await forumAPI.getCategories();
      const catData = catRes.data as { results?: ForumCategory[] } | ForumCategory[];
      const cats = Array.isArray(catData) ? catData : (catData.results || []);
      const cat = cats.find((c: ForumCategory) => c.slug === slug);
      if (!cat) { setTopics([]); setLoading(false); return; }
      const res = await forumAPI.getTopics({ category: cat.id, page: currentPage, search: searchQuery || undefined });
      const td = res.data as unknown as { results?: Topic[]; count?: number } | Topic[];
      setTopics(Array.isArray(td) ? td : (td.results || []));
      setTotalPages(Math.ceil((Array.isArray(td) ? td.length : (td.count || 0)) / 10) || 1);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const formatDate = (d: string) => {
    const date = new Date(d); const now = new Date();
    const diff = now.getTime() - date.getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
    if (m < 1) return 'сейчас'; if (m < 60) return `${m}м`; if (h < 24) return `${h}ч`; if (days < 7) return `${days}д`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const addImages = (files: FileList) => {
    const remaining = MAX_IMAGES - newImages.length;
    const toAdd = Array.from(files).slice(0, remaining).map(file => ({ file, preview: URL.createObjectURL(file) }));
    setNewImages(prev => [...prev, ...toAdd]);
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImages[index].preview);
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateTopic = async () => {
    const checkRes = await moderationAPI.checkText(newTitle + ' ' + newContent);
if (checkRes.data.has_bad_words) {
  toast.error(checkRes.data.message || 'Текст содержит запрещённые слова');
  setIsCreating(false);
  return;
}
    if (!newTitle.trim()) { toast.error('Введите заголовок'); return; }
    if (!newContent.trim()) { toast.error('Введите текст'); return; }
    if (!category) return;
    setIsCreating(true);
    try {
      const imageIds: number[] = [];
      for (const img of newImages) {
        const uploadRes = await forumAPI.uploadImage(await new Promise<string>(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.readAsDataURL(img.file); }));
        imageIds.push(uploadRes.data.image_id);
      }
      await forumAPI.createTopic({ category: category.id, title: newTitle.trim(), content: newContent.trim(), ...(imageIds.length > 0 && { images: imageIds }) } as Record<string, unknown>);
      setNewTitle(''); setNewContent(''); newImages.forEach(i => URL.revokeObjectURL(i.preview)); setNewImages([]); setShowCreateForm(false);
      toast.success('Тема создана');
      setCurrentPage(1);
      fetchTopics();
    } catch (error) { toast.error('Ошибка'); } finally { setIsCreating(false); }
  };

  if (loading && topics.length === 0) {
    return <div style={{ maxWidth: '760px', margin: '0 auto', padding: '80px 24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #fce7f3', borderTopColor: '#db2777', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>;
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>
      <Link href="/forum" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9ca3af', textDecoration: 'none', fontSize: 14, marginBottom: 12, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#db2777'} onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Форум
      </Link>

      {category && (
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1f2937', margin: '0 0 6px 0' }}>{category.name}</h1>
          {category.description && <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>{category.description}</p>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text" placeholder="Поиск по темам..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (setCurrentPage(1), fetchTopics())}
            style={{ width: '100%', padding: '11px 16px 11px 42px', border: '1px solid #f3f4f6', borderRadius: 12, fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
            onFocus={e => e.currentTarget.style.borderColor = '#fbcfe8'}
            onBlur={e => e.currentTarget.style.borderColor = '#f3f4f6'}
          />
        </div>
        {isLoggedIn && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: '11px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
              background: showCreateForm ? '#fdf2f8' : 'linear-gradient(135deg, #db2777, #be185d)',
              color: showCreateForm ? '#db2777' : 'white',
              transition: 'all 0.2s ease',
              boxShadow: showCreateForm ? 'none' : '0 2px 8px rgba(219,39,119,0.25)',
            }}
          >
            {showCreateForm ? 'Отмена' : '+ Новая тема'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #f3f4f6', padding: 24, marginBottom: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}>
          <input type="text" placeholder="Заголовок темы" value={newTitle} onChange={e => setNewTitle(e.target.value)} maxLength={200}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #f3f4f6', borderRadius: 12, fontSize: 15, outline: 'none', marginBottom: 14, boxSizing: 'border-box', fontWeight: 500 }}
            onFocus={e => e.currentTarget.style.borderColor = '#fbcfe8'} onBlur={e => e.currentTarget.style.borderColor = '#f3f4f6'} />
          <textarea placeholder="Что вы хотите обсудить?" value={newContent} onChange={e => setNewContent(e.target.value)}
            style={{ width: '100%', minHeight: 110, padding: '12px 16px', border: '1px solid #f3f4f6', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', marginBottom: 14, boxSizing: 'border-box', lineHeight: 1.6 }}
            onFocus={e => e.currentTarget.style.borderColor = '#fbcfe8'} onBlur={e => e.currentTarget.style.borderColor = '#f3f4f6'} />
          {newImages.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {newImages.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', width: 90, height: 90, borderRadius: 10, overflow: 'hidden', border: '1px solid #f3f4f6' }}>
                  <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removeNewImage(idx)} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ padding: '9px 16px', border: '1px solid #f3f4f6', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s', background: 'white' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbcfe8'; e.currentTarget.style.color = '#db2777'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.color = '#6b7280'; }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
              Фото ({newImages.length}/{MAX_IMAGES})
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => e.target.files && addImages(e.target.files)} />
            </label>
            <button onClick={handleCreateTopic} disabled={isCreating} style={{
              padding: '10px 28px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: 'linear-gradient(135deg, #db2777, #be185d)', color: 'white',
              boxShadow: '0 2px 10px rgba(219,39,119,0.3)', opacity: isCreating ? 0.7 : 1,
            }}>
              {isCreating ? 'Публикация...' : 'Опубликовать'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {topics.map(topic => (
          <div key={topic.id} style={{
            background: 'white', borderRadius: 16, border: '1px solid #f3f4f6', overflow: 'hidden',
            transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#fbcfe8'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#f3f4f6'}>
            <div style={{ padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {topic.author.avatar_url ? <img src={topic.author.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16, fontWeight: 700, color: '#db2777' }}>{topic.author.username.charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#1f2937' }}>{topic.author.username}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{formatDate(topic.created_at)}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  {topic.is_pinned && <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>Закреплено</span>}
                  {topic.is_closed && <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280', fontWeight: 600 }}>Закрыто</span>}
                </div>
              </div>

              <Link href={`/forum/${slug}/${topic.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h2 style={{ fontSize: 18, fontWeight: 650, color: '#1f2937', margin: '0 0 8px 0', lineHeight: 1.4 }}>{topic.title}</h2>
              </Link>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: '#6b7280', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 12 }}>
                {topic.content.length > 280 ? topic.content.slice(0, 280) + '...' : topic.content}
              </div>

              {topic.images && topic.images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(topic.images.length, 3)}, 1fr)`, gap: 8, marginBottom: 14 }}>
                  {topic.images.slice(0, 3).map(img => (
                    <div key={img.id} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #f3f4f6', aspectRatio: '1' }}>
                      <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ))}
                </div>
              )}

              <Link href={`/forum/${slug}/${topic.id}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 18px', background: '#fdf2f8', borderRadius: 20,
                textDecoration: 'none', fontSize: 13, color: '#db2777', fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fce7f3'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fdf2f8'; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {topic.posts_count} {topic.posts_count === 1 ? 'ответ' : topic.posts_count < 5 ? 'ответа' : 'ответов'}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!loading && topics.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14, background: '#fafafa', borderRadius: 16 }}>
          {searchQuery ? 'Ничего не найдено' : 'Тем пока нет'}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 36 }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ width: 38, height: 38, border: '1px solid #f3f4f6', borderRadius: 10, background: 'white', cursor: currentPage === 1 ? 'default' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, fontSize: 14, color: '#6b7280', transition: 'all 0.15s' }}>←</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setCurrentPage(p)} style={{
              width: 38, height: 38, border: p === currentPage ? 'none' : '1px solid #f3f4f6', borderRadius: 10,
              background: p === currentPage ? 'linear-gradient(135deg, #db2777, #be185d)' : 'white',
              color: p === currentPage ? 'white' : '#6b7280', cursor: 'pointer', fontSize: 14, fontWeight: p === currentPage ? 600 : 400,
              boxShadow: p === currentPage ? '0 2px 8px rgba(219,39,119,0.25)' : 'none',
            }}>{p}</button>
          ))}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ width: 38, height: 38, border: '1px solid #f3f4f6', borderRadius: 10, background: 'white', cursor: currentPage === totalPages ? 'default' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, fontSize: 14, color: '#6b7280' }}>→</button>
        </div>
      )}
    </div>
  );
}