'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { forumAPI } from '../../../services/api';
import { moderationAPI } from '../../../services/api';

interface PostImage {
  id: number;
  url: string;
}

interface Post {
  id: number;
  author: { id: number; username: string; avatar_url: string | null };
  content: string;
  images?: PostImage[];
  likes_count: number;
  is_liked: boolean;
  parent_id: number | null;
  created_at: string;
}

interface Topic {
  id: number;
  title: string;
  author: { id: number; username: string; avatar_url: string | null };
  is_closed: boolean;
  posts: Post[];
  created_at: string;
}

const MAX_IMAGES = 4;



export default function TopicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const topicId = params.topicId as string;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyImages, setReplyImages] = useState<{ file: File; preview: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
    if (token) {
      try { setCurrentUserId(JSON.parse(atob(token.split('.')[1])).user_id || null); } catch { setCurrentUserId(null); }
    }
    const id = Number(topicId);
    if (id && !isNaN(id)) fetchTopic(id);
    else setLoading(false);
  }, [topicId]);

  const fetchTopic = async (id: number) => {
    try {
      const res = await forumAPI.getTopic(id);
      setTopic(res.data);
    } catch (error) { toast.error('Тема не найдена'); } finally { setLoading(false); }
  };

  const formatDate = (d: string) => {
    const date = new Date(d); const now = new Date();
    const diff = now.getTime() - date.getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
    if (m < 1) return 'сейчас'; if (m < 60) return `${m}м`; if (h < 24) return `${h}ч`; if (days < 7) return `${days}д`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const addImages = (files: FileList) => {
    const remaining = MAX_IMAGES - replyImages.length;
    const toAdd = Array.from(files).slice(0, remaining).map(file => ({ file, preview: URL.createObjectURL(file) }));
    setReplyImages(prev => [...prev, ...toAdd]);
  };

  const removeReplyImage = (index: number) => {
    URL.revokeObjectURL(replyImages[index].preview);
    setReplyImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleReply = async () => {
    const checkRes = await moderationAPI.checkText(replyContent);
if (checkRes.data.has_bad_words) {
  toast.error(checkRes.data.message || 'Текст содержит запрещённые слова');
  setIsSubmitting(false);
  return;
}
    if (!replyContent.trim()) { toast.error('Напишите сообщение'); return; }
    setIsSubmitting(true);
    try {
      const imageIds: number[] = [];
      for (const img of replyImages) {
        const uploadRes = await forumAPI.uploadImage(await new Promise<string>(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.readAsDataURL(img.file); }));
        imageIds.push(uploadRes.data.image_id);
      }
      await forumAPI.createPost({ topic: Number(topicId), content: replyContent, ...(imageIds.length > 0 && { images: imageIds }), ...(replyTo && { parent: replyTo.id }) });
      setReplyContent(''); replyImages.forEach(i => URL.revokeObjectURL(i.preview)); setReplyImages([]); setReplyTo(null);
      toast.success('Ответ добавлен');
      fetchTopic(Number(topicId));
    } catch (error) { toast.error('Ошибка при отправке'); } finally { setIsSubmitting(false); }
  };

  const handleLike = async (postId: number) => {
    if (!isLoggedIn) { toast.error('Войдите'); return; }
    try { await forumAPI.likePost(postId); fetchTopic(Number(topicId)); } catch (error) { console.error(error); }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('Удалить сообщение и все ответы?')) return;
    try { await forumAPI.deletePost(postId); toast.success('Удалено'); fetchTopic(Number(topicId)); }
    catch (error: unknown) { toast.error((error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Ошибка удаления'); }
  };

  const buildTree = (posts: Post[]) => {
    if (!posts) return { root: [], replies: () => [] };
    const root = posts.filter(p => !p.parent_id);
    const replies = (parentId: number) => posts.filter(p => p.parent_id === parentId);
    return { root, replies };
  };

  if (loading) {
    return <div style={{ maxWidth: '740px', margin: '0 auto', padding: '80px 24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #fce7f3', borderTopColor: '#db2777', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>;
  }

  if (!topic) {
    return <div style={{ maxWidth: '740px', margin: '0 auto', padding: '60px 24px', textAlign: 'center', color: '#9ca3af' }}>Тема не найдена</div>;
  }

  const { root, replies } = buildTree(topic.posts || []);

  const PostImages = ({ images, compact }: { images: PostImage[]; compact?: boolean }) => {
    if (!images?.length) return null;
    const size = compact ? 80 : 140;
    return (
      <div style={{ display: 'flex', gap: compact ? 4 : 6, flexWrap: 'wrap', marginBottom: compact ? 6 : 10 }}>
        {images.map(img => (
          <div key={img.id} style={{ borderRadius: compact ? 8 : 10, overflow: 'hidden', border: '1px solid #f3f4f6', width: size, height: size, flexShrink: 0 }}>
            <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '740px', margin: '0 auto', padding: '48px 24px 80px' }}>
      <Link href={`/forum/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9ca3af', textDecoration: 'none', fontSize: 14, marginBottom: 20, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#db2777'} onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        К темам
      </Link>

      <div style={{
        background: 'white', borderRadius: 20, border: '1px solid #f3f4f6',
        padding: '28px 30px', marginBottom: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1f2937', margin: '0 0 14px 0', lineHeight: 1.35 }}>
          {topic.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {topic.author.avatar_url ? <img src={topic.author.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 15, fontWeight: 700, color: '#db2777' }}>{topic.author.username.charAt(0).toUpperCase()}</span>}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>{topic.author.username}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{formatDate(topic.created_at)}</div>
            </div>
          </div>
          {topic.is_closed && <><div style={{ width: 4, height: 4, borderRadius: '50%', background: '#e5e7eb' }} /><span style={{ fontSize: 13, color: '#ef4444', fontWeight: 500 }}>Закрыто</span></>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 36 }}>
        {root.map(post => {
          const postReplies = replies(post.id);
          const isOwner = currentUserId === post.author.id;
          return (
            <div key={post.id}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {post.author.avatar_url ? <img src={post.author.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16, fontWeight: 700, color: '#db2777' }}>{post.author.username.charAt(0).toUpperCase()}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 650, fontSize: 15, color: '#1f2937' }}>{post.author.username}</span>
                      <span style={{ fontSize: 12, color: '#cbd5e1' }}>{formatDate(post.created_at)}</span>
                    </div>
                    {isOwner && (
                      <button onClick={() => handleDelete(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#d1d5db', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'none'; }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    )}
                  </div>
                  <div style={{
                    background: '#fafbfc', borderRadius: 14, padding: '16px 20px',
                    border: '1px solid #f3f4f6', fontSize: 14, lineHeight: 1.6,
                    color: '#4b5563', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 8,
                  }}>
                    {post.content}
                  </div>
                  <PostImages images={post.images || []} />
                  <div style={{ display: 'flex', gap: 18, marginTop: 4 }}>
                    <button onClick={() => handleLike(post.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: post.is_liked ? '#db2777' : '#9ca3af', fontWeight: post.is_liked ? 600 : 400, padding: '6px 10px', borderRadius: 8, transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (!post.is_liked) { e.currentTarget.style.color = '#db2777'; e.currentTarget.style.background = '#fdf2f8'; } }}
                      onMouseLeave={e => { if (!post.is_liked) { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'none'; } }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={post.is_liked ? '#db2777' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      {post.likes_count > 0 && post.likes_count}
                    </button>
                    <button onClick={() => { setReplyTo({ id: post.id, username: post.author.username }); replyInputRef.current?.focus(); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#9ca3af', padding: '6px 10px', borderRadius: 8, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#db2777'; e.currentTarget.style.background = '#fdf2f8'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'none'; }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      Ответить
                    </button>
                  </div>
                </div>
              </div>

              {postReplies.length > 0 && (
                <div style={{ marginLeft: 21, marginTop: 12, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 20, width: 2, background: 'linear-gradient(to bottom, #fbcfe8, #fdf2f8)', borderRadius: 1 }} />
                  <div style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {postReplies.map((reply, idx) => {
                      const isReplyOwner = currentUserId === reply.author.id;
                      return (
                        <div key={reply.id} style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', left: -20, top: 16, width: 20, height: 2, background: '#fbcfe8' }} />
                          <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 10, background: '#fdf2f8', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {reply.author.avatar_url ? <img src={reply.author.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 12, fontWeight: 700, color: '#db2777' }}>{reply.author.username.charAt(0).toUpperCase()}</span>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 650, fontSize: 13, color: '#1f2937' }}>{reply.author.username}</span>
                                  <span style={{ fontSize: 11, color: '#cbd5e1' }}>{formatDate(reply.created_at)}</span>
                                </div>
                                {isReplyOwner && (
                                  <button onClick={() => handleDelete(reply.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: '#d1d5db', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'none'; }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                  </button>
                                )}
                              </div>
                              <div style={{ fontSize: 13, lineHeight: 1.55, color: '#6b7280', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 6 }}>
                                {reply.content}
                              </div>
                              <PostImages images={reply.images || []} compact />
                              <button onClick={() => handleLike(reply.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: reply.is_liked ? '#db2777' : '#9ca3af', fontWeight: reply.is_liked ? 600 : 400, padding: '4px 8px', borderRadius: 6, transition: 'all 0.15s' }}
                                onMouseEnter={e => { if (!reply.is_liked) { e.currentTarget.style.color = '#db2777'; e.currentTarget.style.background = '#fdf2f8'; } }}
                                onMouseLeave={e => { if (!reply.is_liked) { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'none'; } }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill={reply.is_liked ? '#db2777' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                {reply.likes_count > 0 && reply.likes_count}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {topic.is_closed ? (
        <div style={{ textAlign: 'center', padding: 28, background: '#fafafa', borderRadius: 16, color: '#9ca3af', fontSize: 14 }}>Обсуждение закрыто</div>
      ) : isLoggedIn ? (
        <div style={{
          background: 'white', borderRadius: 20, border: '1px solid #f3f4f6', padding: 28,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          {replyTo && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', background: '#fdf2f8', borderRadius: 14, marginBottom: 18, fontSize: 13, color: '#be185d' }}>
              <span>Ответ для <strong>@{replyTo.username}</strong></span>
              <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#db2777', fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          )}
          <textarea ref={replyInputRef} style={{
            width: '100%', minHeight: 110, padding: '14px 18px', border: '1px solid #f3f4f6',
            borderRadius: 14, fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
            outline: 'none', marginBottom: 18, boxSizing: 'border-box', lineHeight: 1.6,
            transition: 'border-color 0.2s',
          }}
            placeholder="Напишите ответ..." value={replyContent} onChange={e => setReplyContent(e.target.value)}
            onFocus={e => e.currentTarget.style.borderColor = '#fbcfe8'} onBlur={e => e.currentTarget.style.borderColor = '#f3f4f6'} />
          {replyImages.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {replyImages.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: '1px solid #f3f4f6' }}>
                  <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removeReplyImage(idx)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 11 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ padding: '10px 18px', border: '1px solid #f3f4f6', borderRadius: 12, cursor: 'pointer', fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s', background: 'white' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbcfe8'; e.currentTarget.style.color = '#db2777'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.color = '#6b7280'; }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
              Фото ({replyImages.length}/{MAX_IMAGES})
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => e.target.files && addImages(e.target.files)} />
            </label>
            <button onClick={handleReply} disabled={isSubmitting} style={{
              padding: '11px 28px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: 'linear-gradient(135deg, #db2777, #be185d)', color: 'white',
              boxShadow: '0 2px 12px rgba(219,39,119,0.25)', opacity: isSubmitting ? 0.7 : 1,
            }}>
              {isSubmitting ? 'Отправка...' : 'Ответить'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 32, background: '#fafafa', borderRadius: 16, color: '#9ca3af', fontSize: 14 }}>
          <Link href="/login" style={{ color: '#db2777', textDecoration: 'none', fontWeight: 600 }}>Войдите</Link>, чтобы участвовать в обсуждении
        </div>
      )}
    </div>
  );
}