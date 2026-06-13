'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { profileAPI, routinesAPI, productsAPI } from '../services/api';
import { useQuizStore } from '../store/quizStore';
import { useUserProfileStore } from '../store/userProfileStore';
import Link from 'next/link';

interface UserProfileData {
  id: number;
  username: string;
  email: string;
  skin_type: string;
  problems: string;
  age_range: string;
  allergies: string;
  avatar_url?: string;
}

interface RoutineData {
  id: number;
  name: string;
  goal: string;
  created_at: string;
  cleansing?: number | null;
  toner?: number | null;
  serum?: number | null;
  cream?: number | null;
  spf?: number | null;
}

interface RoutineProduct {
  id: number;
  title: string;
  brand_name: string;
  main_image_url: string | null;
  rating: number;
}

const fixImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://127.0.0.1:8001') || url.startsWith('http://localhost:8000')) {
    return url.replace(/^https?:\/\/(127\.0\.0\.1:8001|localhost:8000)/, 'https://skinmatch.online');
  }
  if (url.startsWith('http')) return url;
  return `https://skinmatch.online${url}`;
};

const skinTypeDisplay: Record<string, string> = {
  'dry': 'Сухая кожа', 'oily': 'Жирная кожа', 'combination': 'Комбинированная кожа',
  'normal': 'Нормальная кожа', 'sensitive': 'Чувствительная кожа',
};

const problemsDisplay: Record<string, string> = {
  'acne': 'Акне, прыщи', 'blackheads': 'Черные точки', 'pigmentation': 'Пигментные пятна',
  'wrinkles': 'Морщины', 'redness': 'Покраснения', 'dehydration': 'Обезвоженность',
  'rosacea': 'Розацеа', 'enlarged_pores': 'Расширенные поры',
};

const ageDisplay: Record<string, string> = {
  'under18': 'До 18 лет', '18-25': '18-25 лет', '25-35': '25-35 лет',
  '35-45': '35-45 лет', '45plus': '45+ лет',
};

const allergiesDisplay: Record<string, string> = {
  'alcohol': 'Спирт', 'fragrance': 'Отдушки', 'essential_oils': 'Эфирные масла',
  'parabens': 'Парабены', 'sulfates': 'Сульфаты (SLS, SLES)', 'silicones': 'Силиконы',
};

const skinTypes = [
  { value: 'dry', label: 'Сухая кожа', desc: 'Шелушение, стянутость' },
  { value: 'oily', label: 'Жирная кожа', desc: 'Блеск, расширенные поры' },
  { value: 'combination', label: 'Комбинированная кожа', desc: 'Жирная Т-зона, сухие щеки' },
  { value: 'normal', label: 'Нормальная кожа', desc: 'Сбалансированная' },
  { value: 'sensitive', label: 'Чувствительная кожа', desc: 'Покраснения, раздражения' },
];

const problemsList = [
  { value: 'acne', label: 'Акне, прыщи' }, { value: 'blackheads', label: 'Черные точки' },
  { value: 'pigmentation', label: 'Пигментные пятна' }, { value: 'wrinkles', label: 'Морщины' },
  { value: 'redness', label: 'Покраснения' }, { value: 'dehydration', label: 'Обезвоженность' },
  { value: 'rosacea', label: 'Розацеа' }, { value: 'enlarged_pores', label: 'Расширенные поры' },
];

const ageRanges = [
  { value: 'under18', label: 'До 18 лет' }, { value: '18-25', label: '18-25 лет' },
  { value: '25-35', label: '25-35 лет' }, { value: '35-45', label: '35-45 лет' },
  { value: '45plus', label: '45+ лет' },
];

const allergiesList = [
  { value: 'alcohol', label: 'Спирт' }, { value: 'fragrance', label: 'Отдушки' },
  { value: 'essential_oils', label: 'Эфирные масла' }, { value: 'parabens', label: 'Парабены' },
  { value: 'sulfates', label: 'Сульфаты (SLS, SLES)' }, { value: 'silicones', label: 'Силиконы' },
];

const formatProblems = (problemsStr: string): string => {
  if (!problemsStr) return 'Не указано';
  return problemsStr.split(', ').map(p => problemsDisplay[p] || p).join(', ');
};

const formatAllergies = (allergiesStr: string): string => {
  if (!allergiesStr) return 'Не указано';
  return allergiesStr.split(', ').map(a => allergiesDisplay[a] || a).join(', ');
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function ProfilePage() {
  const router = useRouter();
  const { setAnswers, clearAnswers } = useQuizStore();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [routines, setRoutines] = useState<RoutineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('skin');
  const [isEditingSkin, setIsEditingSkin] = useState(false);
  const [editSkin, setEditSkin] = useState({
    skin_type: '', problems: [] as string[], age_range: '', allergies: [] as string[],
  });
  const [savingSkin, setSavingSkin] = useState(false);
  const [viewingRoutine, setViewingRoutine] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineData | null>(null);
  const [routineProducts, setRoutineProducts] = useState<Record<string, RoutineProduct | null>>({});
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Выберите изображение'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Размер файла не должен превышать 2 МБ'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const loadData = async () => {
    try {
      const [profileRes, routinesRes] = await Promise.all([profileAPI.get(), routinesAPI.getAll()]);
      const userData = profileRes.data as UserProfileData;
      setProfile(userData);
      if (userData) {
        setUsername(userData.username || '');
        setEmail(userData.email || '');
        setAvatarPreview(fixImageUrl(userData.avatar_url || null) as string | null);
        
        if (userData.skin_type || userData.problems) {
          useUserProfileStore.getState().loadProfileFromServer({
            skin_type: userData.skin_type || '',
            problems: userData.problems || '',
          });
        }
      }
      let routinesData: RoutineData[] = [];
      const data = routinesRes.data;
      if (Array.isArray(data)) routinesData = data as RoutineData[];
      else if (data && 'results' in data && Array.isArray((data as Record<string, unknown>).results)) routinesData = (data as Record<string, unknown>).results as RoutineData[];
      setRoutines(routinesData);
      if (userData?.skin_type) {
        let skinTypeValue = userData.skin_type;
        for (const [eng, rus] of Object.entries(skinTypeDisplay)) {
          if (userData.skin_type.includes(rus)) { skinTypeValue = eng; break; }
        }
        setEditSkin({
          skin_type: skinTypeValue,
          problems: userData.problems ? userData.problems.split(', ') : [],
          age_range: userData.age_range || '',
          allergies: userData.allergies ? userData.allergies.split(', ') : [],
        });
      }
    } catch (error) { toast.error('Ошибка загрузки'); } finally { setLoading(false); }
  };

  const saveSkinProfile = async () => {
    if (!editSkin.skin_type) { toast.error('Выберите тип кожи'); return; }
    setSavingSkin(true);
    try {
      await profileAPI.update({
        skin_type: skinTypeDisplay[editSkin.skin_type] || editSkin.skin_type,
        problems: editSkin.problems.join(', '), age_range: editSkin.age_range, allergies: editSkin.allergies.join(', '),
      });
      setAnswers({ skin_type: editSkin.skin_type, problems: editSkin.problems, age_range: editSkin.age_range, allergies: editSkin.allergies });
      setProfile(prev => prev ? { ...prev, skin_type: skinTypeDisplay[editSkin.skin_type] || editSkin.skin_type, problems: editSkin.problems.join(', '), age_range: editSkin.age_range, allergies: editSkin.allergies.join(', ') } : null);
      
      useUserProfileStore.getState().loadProfileFromServer({
        skin_type: skinTypeDisplay[editSkin.skin_type] || editSkin.skin_type,
        problems: editSkin.problems.join(', '),
      });
      
      toast.success('Параметры кожи сохранены');
      setIsEditingSkin(false);
    } catch (error) { toast.error('Ошибка сохранения'); } finally { setSavingSkin(false); }
  };

  const saveAccount = async () => {
    if (!username.trim()) { toast.error('Имя пользователя не может быть пустым'); return; }
    if (username.length > 30) { toast.error('Имя пользователя не должно превышать 30 символов'); return; }
    setSavingAccount(true);
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('avatar', avatarFile);
        await profileAPI.update(formData);
      } else { await profileAPI.update({ username }); }
      const updated = await profileAPI.get();
      const updatedData = updated.data as UserProfileData;
      setProfile(updatedData);
      setAvatarPreview(fixImageUrl(updatedData.avatar_url || null) as string | null);
      setAvatarFile(null);
      toast.success('Профиль обновлён');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string; username?: string[] } } };
      toast.error(error.response?.data?.detail || error.response?.data?.username?.[0] || 'Ошибка обновления');
    } finally { setSavingAccount(false); }
  };

  const changePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError('Все поля обязательны'); return; }
    if (newPassword.length < 6) { setPasswordError('Пароль должен содержать минимум 6 символов'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Пароли не совпадают'); return; }
    setChangingPassword(true);
    try {
      await profileAPI.changePassword({ old_password: currentPassword, new_password: newPassword });
      toast.success('Пароль изменён');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string; old_password?: string[] } } };
      setPasswordError(error?.response?.data?.detail || error?.response?.data?.old_password?.[0] || 'Ошибка смены пароля');
    } finally { setChangingPassword(false); }
  };

  const resetSkinToQuiz = () => {
    clearAnswers();
    profileAPI.update({ skin_type: '', problems: '', age_range: '', allergies: '' }).then(() => {
      setProfile(prev => prev ? { ...prev, skin_type: '', problems: '', age_range: '', allergies: '' } : null);
      setEditSkin({ skin_type: '', problems: [], age_range: '', allergies: [] });
      toast.success('Данные сброшены. Пройдите анкету');
    }).catch(() => toast.error('Ошибка сброса'));
  };

  const deleteRoutine = async (id: number) => {
    if (confirm('Удалить эту рутину?')) {
      try { await routinesAPI.delete(id); setRoutines(routines.filter(r => r.id !== id)); toast.success('Рутина удалена'); }
      catch { toast.error('Ошибка удаления'); }
    }
  };

  const viewRoutineDetails = async (routine: RoutineData) => {
    setSelectedRoutine(routine);
    setViewingRoutine(true);
    const loadedProducts: Record<string, RoutineProduct | null> = {};
    const productIds: Record<string, number | null | undefined> = {
      cleansing: routine.cleansing, toner: routine.toner, serum: routine.serum, cream: routine.cream, spf: routine.spf,
    };
    for (const [key, id] of Object.entries(productIds)) {
      if (id) { try { const res = await productsAPI.getById(id); loadedProducts[key] = res.data as RoutineProduct; } catch { loadedProducts[key] = null; } }
    }
    setRoutineProducts(loadedProducts);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    useUserProfileStore.getState().clearProfile();
    clearAnswers();
    router.push('/');
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #fce7f3', borderTopColor: '#db2777', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>;
  }

  if (!profile) {
    return <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <p style={{ color: '#6b7280', marginBottom: 20 }}>Не удалось загрузить профиль</p>
      <button onClick={() => router.push('/login')} style={{ padding: '10px 24px', background: '#db2777', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Войти снова</button>
    </div>;
  }

  const displaySkinType = skinTypeDisplay[profile.skin_type] || profile.skin_type || 'Не указано';
  const hasSkinData = !!profile.skin_type;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
      <style>{`
        .profile-header{display:flex;align-items:center;gap:20px;margin-bottom:36px;flex-wrap:wrap}
        .profile-avatar{width:56px;height:56px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .profile-avatar img{width:100%;height:100%;object-fit:cover}
        .avatar-placeholder{background:linear-gradient(135deg,#db2777,#be185d);color:white;font-size:24px;font-weight:600;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
        .profile-info{flex:1;min-width:200px}.profile-info h1{font-size:22px;font-weight:600;margin:0 0 2px}.profile-info p{font-size:14px;color:#9ca3af;margin:0}
        .profile-actions{display:flex;gap:10px;flex-shrink:0}
        .btn-logout{padding:8px 18px;border:1px solid #fecaca;background:white;color:#dc2626;border-radius:8px;font-size:14px;cursor:pointer;white-space:nowrap}
        .btn-logout:hover{background:#fef2f2}
        .profile-tabs{display:flex;border-bottom:1px solid #f0f0f0;margin-bottom:28px;overflow-x:auto}
        .profile-tab{padding:12px 24px;border:none;background:none;font-size:15px;color:#6b7280;cursor:pointer;border-bottom:2px solid transparent;display:flex;align-items:center;gap:8px;white-space:nowrap}
        .profile-tab.active{color:#db2777;border-bottom-color:#db2777}
        .tab-count{background:#fce7f3;color:#db2777;font-size:11px;padding:2px 8px;border-radius:20px}
        .card{background:white;border-radius:16px;padding:28px;border:1px solid #f0f0f0;margin-bottom:24px}
        .card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px}
        .card-header h2{font-size:18px;font-weight:600;margin:0}
        .card-header-btns{display:flex;gap:8px;flex-wrap:wrap}
        .params-view{display:flex;flex-direction:column;gap:16px}
        .param-row{display:flex;gap:16px;padding-bottom:14px;border-bottom:1px solid #f5f5f5;flex-wrap:wrap}
        .param-row:last-child{border-bottom:none;padding-bottom:0}
        .param-label{font-size:14px;color:#9ca3af;min-width:90px}
        .param-value{font-size:14px;font-weight:500;color:#1f2937}
        .btn-edit{padding:6px 16px;border:1px solid #db2777;background:white;color:#db2777;border-radius:20px;font-size:13px;cursor:pointer;white-space:nowrap}
        .btn-retake{padding:6px 16px;border:1px solid #e5e7eb;background:white;color:#6b7280;border-radius:20px;font-size:13px;cursor:pointer;white-space:nowrap}
        .btn-primary{padding:10px 24px;background:#db2777;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;white-space:nowrap}
        .empty-state{text-align:center;padding:40px;background:#f9fafb;border-radius:12px;color:#6b7280}
        .skin-type-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;margin-bottom:24px}
        .skin-type-card{padding:12px 14px;border:1px solid #e5e7eb;border-radius:10px;background:white;cursor:pointer;text-align:left}
        .skin-type-card.selected{border-color:#db2777;background:#fdf2f8}
        .skin-type-name{font-weight:600;font-size:13px;color:#1f2937;margin-bottom:2px}
        .skin-type-desc{font-size:11px;color:#9ca3af}
        .chips-grid{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:24px}
        .chip{padding:6px 14px;border:1px solid #e5e7eb;border-radius:20px;background:white;font-size:13px;color:#6b7280;cursor:pointer;white-space:nowrap}
        .chip:hover{border-color:#db2777}
        .chip.selected{border-color:#db2777;background:#fdf2f8;color:#db2777}
        .form-actions{display:flex;gap:10px;flex-wrap:wrap}
        .btn-cancel{padding:8px 20px;border:1px solid #e5e7eb;background:white;border-radius:8px;color:#6b7280;cursor:pointer;white-space:nowrap}
        .btn-save{padding:8px 24px;background:#db2777;color:white;border:none;border-radius:8px;cursor:pointer;white-space:nowrap}
        .account-avatar-upload{display:flex;align-items:center;gap:20px;margin-bottom:24px;flex-wrap:wrap}
        .upload-btn{padding:8px 18px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;white-space:nowrap}
        .input-field{padding:10px 14px;border:1px solid #e5e7eb;border-radius:8px;width:100%;font-size:15px;margin-bottom:16px;box-sizing:border-box}
        .password-section{margin-top:32px;padding-top:24px;border-top:1px solid #f0f0f0}
        .error-text{color:#dc2626;font-size:13px;margin-top:4px}
        .routines-grid{display:flex;flex-direction:column;gap:10px}
        .routine-card{background:white;border-radius:12px;padding:18px 20px;border:1px solid #f0f0f0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
        .routine-card:hover{border-color:#db2777}
        .routine-card-content{flex:1;min-width:200px}
        .routine-name{font-size:16px;font-weight:600;margin:0 0 2px}
        .routine-date{font-size:12px;color:#9ca3af;margin-bottom:8px}
        .routine-steps{display:flex;flex-wrap:wrap;gap:4px}
        .step-badge{padding:2px 8px;background:#f3f4f6;border-radius:20px;font-size:11px;color:#6b7280;white-space:nowrap}
        .btn-delete-routine{padding:5px 12px;border:1px solid #fecaca;background:white;color:#dc2626;border-radius:6px;font-size:12px;cursor:pointer;flex-shrink:0;white-space:nowrap}
        .btn-delete-routine:hover{background:#fef2f2}
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
        .modal-content{background:white;border-radius:24px;padding:32px;max-width:520px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.12)}
        .modal-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px}
        .modal-title{font-size:22px;font-weight:700;color:#1f2937;margin:0 0 6px;word-break:break-word;padding-right:16px}
        .modal-date{font-size:14px;color:#94a3b8;margin:0}
        .modal-close-btn{background:#f3f4f6;border:none;border-radius:12px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;color:#6b7280;flex-shrink:0;transition:all 0.15s}
        .modal-close-btn:hover{background:#e5e7eb}
        .steps-list{display:flex;flex-direction:column;gap:14px}
        .step-item{display:flex;gap:16px;padding:16px;background:#f9fafb;border-radius:16px;border:1px solid #f3f4f6;transition:all 0.15s;align-items:center;flex-wrap:wrap}
        .step-item:hover{border-color:#fbcfe8}
        .step-image{width:64px;height:64px;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;font-size:24px;font-weight:700;color:#db2777}
        .step-image img{width:100%;height:100%;object-fit:cover}
        .step-body{flex:1;min-width:160px}
        .step-label{font-size:11px;font-weight:600;color:#db2777;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px}
        .step-product-name{font-size:16px;font-weight:600;color:#1f2937;text-decoration:none;display:block;margin-bottom:4px;line-height:1.3;word-break:break-word}
        .step-product-name:hover{color:#db2777}
        .step-brand{font-size:13px;color:#9ca3af;margin-bottom:6px}
        .step-rating{font-size:13px;color:#f59e0b;font-weight:600}
        .step-link-btn{padding:8px 14px;background:#db2777;color:white;border-radius:10px;text-decoration:none;font-size:12px;font-weight:600;white-space:nowrap;flex-shrink:0;transition:background 0.15s;align-self:center}
        .step-link-btn:hover{background:#be185d}
        @media(max-width:500px){
          .step-item{flex-direction:column;align-items:flex-start}
          .step-link-btn{width:auto;text-align:center;align-self:stretch}
          .card-header{flex-direction:column;align-items:flex-start}
          .card-header-btns{width:100%}
          .card-header-btns button{flex:1}
        }
      `}</style>

      <div className="profile-header">
        <div className="profile-avatar">
          {avatarPreview ? <img src={avatarPreview} alt="avatar" /> : <div className="avatar-placeholder">{profile.username ? profile.username.charAt(0).toUpperCase() : '?'}</div>}
        </div>
        <div className="profile-info"><h1>{profile.username || 'Пользователь'}</h1><p>{profile.email || ''}</p></div>
        
      </div>

      <div className="profile-tabs">
        <button onClick={() => setActiveTab('skin')} className={`profile-tab ${activeTab === 'skin' ? 'active' : ''}`}>Параметры кожи</button>
        <button onClick={() => setActiveTab('account')} className={`profile-tab ${activeTab === 'account' ? 'active' : ''}`}>Аккаунт</button>
        <button onClick={() => setActiveTab('routines')} className={`profile-tab ${activeTab === 'routines' ? 'active' : ''}`}>Мои рутины{routines.length > 0 && <span className="tab-count">{routines.length}</span>}</button>
      </div>

      {activeTab === 'skin' && (
        <div className="card">
          <div className="card-header">
            <h2>Параметры кожи</h2>
            {hasSkinData && !isEditingSkin && (
              <div className="card-header-btns">
                <button onClick={() => setIsEditingSkin(true)} className="btn-edit">Редактировать</button>
                <button onClick={resetSkinToQuiz} className="btn-retake">Пройти анкету заново</button>
              </div>
            )}
          </div>
          {hasSkinData ? (isEditingSkin ? (
            <div>
              <div className="skin-type-grid">{skinTypes.map(type => <button key={type.value} onClick={() => setEditSkin(prev => ({ ...prev, skin_type: type.value }))} className={`skin-type-card ${editSkin.skin_type === type.value ? 'selected' : ''}`}><div className="skin-type-name">{type.label}</div><div className="skin-type-desc">{type.desc}</div></button>)}</div>
              <div style={{ marginBottom: 24 }}><div style={{ fontWeight: 600, marginBottom: 10 }}>Проблемы кожи</div><div className="chips-grid">{problemsList.map(p => <button key={p.value} onClick={() => setEditSkin(prev => ({ ...prev, problems: prev.problems.includes(p.value) ? prev.problems.filter(v => v !== p.value) : [...prev.problems, p.value] }))} className={`chip ${editSkin.problems.includes(p.value) ? 'selected' : ''}`}>{p.label}</button>)}</div></div>
              <div style={{ marginBottom: 24 }}><div style={{ fontWeight: 600, marginBottom: 10 }}>Возраст</div><div className="chips-grid">{ageRanges.map(age => <button key={age.value} onClick={() => setEditSkin(prev => ({ ...prev, age_range: age.value }))} className={`chip ${editSkin.age_range === age.value ? 'selected' : ''}`}>{age.label}</button>)}</div></div>
              <div style={{ marginBottom: 24 }}><div style={{ fontWeight: 600, marginBottom: 10 }}>Аллергии</div><div className="chips-grid">{allergiesList.map(allergy => <button key={allergy.value} onClick={() => setEditSkin(prev => ({ ...prev, allergies: prev.allergies.includes(allergy.value) ? prev.allergies.filter(a => a !== allergy.value) : [...prev.allergies, allergy.value] }))} className={`chip ${editSkin.allergies.includes(allergy.value) ? 'selected' : ''}`}>{allergy.label}</button>)}</div></div>
              <div className="form-actions"><button onClick={() => setIsEditingSkin(false)} className="btn-cancel">Отмена</button><button onClick={saveSkinProfile} disabled={savingSkin} className="btn-save">{savingSkin ? 'Сохранение...' : 'Сохранить'}</button></div>
            </div>
          ) : (
            <div className="params-view">
              <div className="param-row"><span className="param-label">Тип кожи</span><span className="param-value">{displaySkinType}</span></div>
              <div className="param-row"><span className="param-label">Проблемы</span><span className="param-value">{formatProblems(profile.problems)}</span></div>
              <div className="param-row"><span className="param-label">Возраст</span><span className="param-value">{ageDisplay[profile.age_range] || profile.age_range || 'Не указано'}</span></div>
              <div className="param-row"><span className="param-label">Аллергии</span><span className="param-value">{formatAllergies(profile.allergies)}</span></div>
            </div>
          )) : (<div className="empty-state"><p>Параметры кожи не заданы</p><button onClick={() => router.push('/questionnaire')} className="btn-primary">Пройти анкету</button></div>)}
        </div>
      )}

      {activeTab === 'account' && (
        <div className="card">
          <h2 style={{ margin: '0 0 24px' }}>Настройки аккаунта</h2>
          <div className="account-avatar-upload">
            <div className="profile-avatar" style={{ width: 72, height: 72 }}>{avatarPreview ? <img src={avatarPreview} alt="avatar" /> : <div className="avatar-placeholder" style={{ fontSize: 30 }}>{profile.username ? profile.username.charAt(0).toUpperCase() : '?'}</div>}</div>
            <div><button className="upload-btn" onClick={() => avatarInputRef.current?.click()}>Загрузить фото</button><input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} /><div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>JPG, PNG до 2 МБ</div></div>
          </div>
          <input className="input-field" placeholder="Имя пользователя" value={username} onChange={e => setUsername(e.target.value)} maxLength={30} />
          <input className="input-field" placeholder="Email" type="email" value={email} disabled style={{ background: '#f9fafb' }} />
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>Email изменить нельзя</div>
          <button onClick={saveAccount} disabled={savingAccount} className="btn-primary">{savingAccount ? 'Сохранение...' : 'Сохранить изменения'}</button>
          <div className="password-section">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Сменить пароль</h3>
            <input className="input-field" type="password" placeholder="Текущий пароль" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
            <input className="input-field" type="password" placeholder="Новый пароль" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
            <input className="input-field" type="password" placeholder="Подтвердите пароль" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
            {passwordError && <div className="error-text">{passwordError}</div>}
            <button onClick={changePassword} disabled={changingPassword} className="btn-primary" style={{ marginTop: 8 }}>{changingPassword ? 'Смена...' : 'Изменить пароль'}</button>
          </div>
        </div>
      )}

      {activeTab === 'routines' && (
        <div>
          <button onClick={() => router.push('/routine')} className="btn-primary" style={{ marginBottom: 20 }}>Создать новую рутину</button>
          {routines.length === 0 ? (<div className="empty-state">У вас пока нет сохраненных рутин</div>) : (
            <div className="routines-grid">
              {routines.map(routine => (
                <div key={routine.id} className="routine-card" onClick={() => viewRoutineDetails(routine)}>
                  <div className="routine-card-content">
                    <h3 className="routine-name">{routine.name}</h3>
                    <div className="routine-date">Создана: {formatDate(routine.created_at)}</div>
                    <div className="routine-steps">
                      {routine.cleansing && <span className="step-badge">Очищение</span>}
                      {routine.toner && <span className="step-badge">Тонер</span>}
                      {routine.serum && <span className="step-badge">Сыворотка</span>}
                      {routine.cream && <span className="step-badge">Крем</span>}
                      {routine.spf && <span className="step-badge">SPF</span>}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteRoutine(routine.id); }} className="btn-delete-routine">Удалить</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewingRoutine && selectedRoutine && (
        <div className="modal-overlay" onClick={() => { setViewingRoutine(false); setRoutineProducts({}); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                <h3 className="modal-title">{selectedRoutine.name}</h3>
                <p className="modal-date">{formatDate(selectedRoutine.created_at)}</p>
              </div>
              <button className="modal-close-btn" onClick={() => { setViewingRoutine(false); setRoutineProducts({}); }}>×</button>
            </div>
            <div className="steps-list">
              {[
                { key: 'cleansing', label: 'Очищение', step: '1' },
                { key: 'toner', label: 'Тонизирование', step: '2' },
                { key: 'serum', label: 'Сыворотка', step: '3' },
                { key: 'cream', label: 'Увлажнение', step: '4' },
                { key: 'spf', label: 'SPF защита', step: '5' },
              ].map(({ key, label, step }) => {
                const product = routineProducts[key];
                if (!product) return null;
                return (
                  <div key={key} className="step-item">
                    <div className="step-image">{product.main_image_url ? <img src={fixImageUrl(product.main_image_url) || ''} alt={product.title} /> : step}</div>
                    <div className="step-body">
                      <div className="step-label">Шаг {step} · {label}</div>
                      <Link href={`/product/${product.id}`} className="step-product-name">{product.title}</Link>
                      <div className="step-brand">{product.brand_name}</div>
                      <div className="step-rating">★ {product.rating}</div>
                    </div>
                    <Link href={`/product/${product.id}`} className="step-link-btn">К товару</Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}