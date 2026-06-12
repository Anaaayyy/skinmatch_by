'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useQuizStore } from '../store/quizStore';
import { profileAPI } from '../services/api';

const questions = [
  {
    id: 'q1',
    text: 'Через 2-3 часа после умывания, не нанося никаких средств, ваша кожа:',
    options: [
      { value: 1, text: 'Сильно шелушится или чувствуется стянутой', type: 'dry' },
      { value: 2, text: 'Чувствуется комфортно, блеска нет', type: 'normal' },
      { value: 3, text: 'Слегка блестит в Т-зоне (лоб, нос, подбородок)', type: 'combination' },
      { value: 4, text: 'Сильно блестит по всему лицу', type: 'oily' }
    ]
  },
  {
    id: 'q2',
    text: 'Как часто у вас появляются черные точки или расширенные поры?',
    options: [
      { value: 1, text: 'Никогда или очень редко', type: 'dry' },
      { value: 2, text: 'Только на носу, в небольшом количестве', type: 'normal' },
      { value: 3, text: 'Периодически в Т-зоне', type: 'combination' },
      { value: 4, text: 'Постоянно, по всему лицу', type: 'oily' }
    ]
  },
  {
    id: 'q3',
    text: 'Как выглядят ваши поры на щеках?',
    options: [
      { value: 1, text: 'Почти незаметны', type: 'dry' },
      { value: 2, text: 'Едва различимы', type: 'normal' },
      { value: 3, text: 'Заметны невооруженным глазом', type: 'combination' },
      { value: 4, text: 'Крупные, хорошо видны', type: 'oily' }
    ]
  },
  {
    id: 'q4',
    text: 'Как часто у вас появляются покраснения, зуд или раздражение на коже?',
    options: [
      { value: 1, text: 'Никогда', type: 'normal' },
      { value: 2, text: 'Редко, только после определенных процедур', type: 'normal' },
      { value: 3, text: 'Несколько раз в месяц', type: 'sensitive' },
      { value: 4, text: 'Раз в неделю или чаще', type: 'sensitive' }
    ]
  },
  {
    id: 'q5',
    text: 'Вызывает ли у вас раздражение новая косметика (жжение, покраснение, шелушение)?',
    options: [
      { value: 1, text: 'Никогда не вызывает', type: 'normal' },
      { value: 2, text: 'Редко, на отдельные средства', type: 'normal' },
      { value: 3, text: 'Часто, на многие средства', type: 'sensitive' },
      { value: 4, text: 'Почти всегда, даже на гипоаллергенную', type: 'sensitive' }
    ]
  },
  {
    id: 'q6',
    text: 'Как ваша кожа реагирует на солнце?',
    options: [
      { value: 1, text: 'Хорошо загорает, не обгорает', type: 'normal' },
      { value: 2, text: 'Сначала краснеет, потом загорает', type: 'normal' },
      { value: 3, text: 'Легко обгорает, загар ложится плохо', type: 'sensitive' },
      { value: 4, text: 'Сразу краснеет и начинает шелушиться', type: 'sensitive' }
    ]
  },
  {
    id: 'q7',
    text: 'Появляются ли у вас веснушки или темные пятна после пребывания на солнце?',
    options: [
      { value: 1, text: 'Никогда', type: 'nonpigmented' },
      { value: 2, text: 'Иногда, но они быстро проходят', type: 'nonpigmented' },
      { value: 3, text: 'Часто появляются и долго не проходят', type: 'pigmented' },
      { value: 4, text: 'Всегда, у меня много пигментных пятен', type: 'pigmented' }
    ]
  },
  {
    id: 'q8',
    text: 'Остаются ли у вас темные следы после того, как прыщ проходит?',
    options: [
      { value: 1, text: 'Нет, кожа восстанавливается полностью', type: 'nonpigmented' },
      { value: 2, text: 'Иногда, но быстро проходят', type: 'nonpigmented' },
      { value: 3, text: 'Да, остаются надолго', type: 'pigmented' },
      { value: 4, text: 'Всегда остаются темные пятна', type: 'pigmented' }
    ]
  },
  {
    id: 'q9',
    text: 'Есть ли у вас мимические морщины (вокруг глаз, на лбу)?',
    options: [
      { value: 1, text: 'Нет, кожа гладкая', type: 'tight' },
      { value: 2, text: 'Небольшие морщинки, заметны только при улыбке', type: 'tight' },
      { value: 3, text: 'Заметны даже в спокойном состоянии', type: 'wrinkled' },
      { value: 4, text: 'Глубокие морщины, заметные всегда', type: 'wrinkled' }
    ]
  },
  {
    id: 'q10',
    text: 'Как бы вы оценили упругость вашей кожи?',
    options: [
      { value: 1, text: 'Кожа упругая, подтянутая', type: 'tight' },
      { value: 2, text: 'Хорошая упругость, но есть небольшой овал лица', type: 'tight' },
      { value: 3, text: 'Упругость снижена, заметен птоз', type: 'wrinkled' },
      { value: 4, text: 'Кожа дряблая, есть заметное провисание', type: 'wrinkled' }
    ]
  }
];

const problemsList = [
  { value: 'acne', label: 'Акне, прыщи' },
  { value: 'blackheads', label: 'Черные точки' },
  { value: 'pigmentation', label: 'Пигментные пятна' },
  { value: 'wrinkles', label: 'Морщины' },
  { value: 'redness', label: 'Покраснения, купероз' },
  { value: 'dehydration', label: 'Обезвоженность' },
  { value: 'rosacea', label: 'Розацеа' },
  { value: 'enlarged_pores', label: 'Расширенные поры' }
];

const ageRanges = [
  { value: 'under18', label: 'До 18 лет' },
  { value: '18-25', label: '18-25 лет' },
  { value: '25-35', label: '25-35 лет' },
  { value: '35-45', label: '35-45 лет' },
  { value: '45plus', label: '45+ лет' }
];

const allergiesList = [
  { value: 'alcohol', label: 'Спирт' },
  { value: 'fragrance', label: 'Отдушки' },
  { value: 'essential_oils', label: 'Эфирные масла' },
  { value: 'parabens', label: 'Парабены' },
  { value: 'sulfates', label: 'Сульфаты (SLS, SLES)' },
  { value: 'silicones', label: 'Силиконы' }
];

export default function QuestionnairePage() {
  const router = useRouter();
  const { setAnswers } = useQuizStore();
  const [step, setStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [selectedAge, setSelectedAge] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    queueMicrotask(() => {
      const token = localStorage.getItem('access_token');
      if (isMounted.current) {
        setIsAuthenticated(!!token);
      }
    });
    return () => {
      isMounted.current = false;
    };
  }, []);

  const calculateSkinType = (): string => {
    const scores: Record<string, number> = {
      dry: 0, oily: 0, combination: 0, normal: 0,
      sensitive: 0, pigmented: 0, nonpigmented: 0,
      wrinkled: 0, tight: 0
    };
    
    for (let i = 1; i <= 10; i++) {
      const answer = quizAnswers[`q${i}`];
      if (answer) {
        scores[answer]++;
      }
    }
    
    let primaryType = 'normal';
    if (scores.oily > scores.dry && scores.oily > scores.combination) primaryType = 'oily';
    else if (scores.dry > scores.oily && scores.dry > scores.combination) primaryType = 'dry';
    else if (scores.combination > scores.oily && scores.combination > scores.dry) primaryType = 'combination';
    
    const isSensitive = scores.sensitive >= 2;
    const isPigmented = scores.pigmented > scores.nonpigmented;
    const isWrinkled = scores.wrinkled > scores.tight;
    
    let result = '';
    if (primaryType === 'oily') result = 'Жирная кожа';
    else if (primaryType === 'dry') result = 'Сухая кожа';
    else if (primaryType === 'combination') result = 'Комбинированная кожа';
    else result = 'Нормальная кожа';
    
    if (isSensitive) result += ', чувствительная';
    if (isPigmented) result += ', склонная к пигментации';
    if (isWrinkled) result += ', с признаками возрастных изменений';
    
    return result;
  };

  const updateAnswer = (questionId: string, type: string) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: type }));
    setTimeout(() => {
      if (step < questions.length) {
        setStep(step + 1);
      } else if (step === questions.length) {
        setStep(step + 1);
      }
    }, 300);
  };

  const saveQuizToServer = async (skinType: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
      await profileAPI.update({
        skin_type: skinType,
        problems: selectedProblems.join(', '),
        age_range: selectedAge,
        allergies: selectedAllergies.join(', '),
      });
      return true;
    } catch (error) {
      console.error('Error saving to server:', error);
      return false;
    }
  };

  const handleComplete = async () => {
    if (!selectedAge) {
      toast.error('Выберите возраст');
      return;
    }
    
    setIsLoading(true);
    const skinType = calculateSkinType();
    
    setAnswers({
      skin_type: skinType,
      problems: selectedProblems,
      age_range: selectedAge,
      allergies: selectedAllergies,
    });
    
    const token = localStorage.getItem('access_token');
    
    if (token) {
      const saved = await saveQuizToServer(skinType);
      if (saved) {
        toast.success(`Ваш тип кожи: ${skinType}. Результаты сохранены в профиль`);
      } else {
        toast.success(`Ваш тип кожи: ${skinType}`);
      }
      setTimeout(() => router.push('/catalog'), 1500);
    } else {
      toast.success(`Ваш тип кожи: ${skinType}. Войдите, чтобы сохранить результат`);
      setTimeout(() => router.push('/login'), 1500);
    }
  };

  if (step <= questions.length) {
    const currentQ = questions[step - 1];
    return (
      <div style={{ minHeight: '100vh', background: '#fff', padding: '40px 20px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Вопрос {step} из {questions.length}</span>
            </div>
            <div style={{ height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${(step / questions.length) * 100}%`, height: '100%', backgroundColor: '#db2777', transition: 'width 0.3s' }} />
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', border: '1px solid #f0f0f0' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '500', color: '#1f2937', marginBottom: '32px', lineHeight: '1.4' }}>
              {currentQ.text}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => updateAnswer(currentQ.id, opt.type)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '16px 20px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '15px',
                    color: '#374151'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#db2777';
                    e.currentTarget.style.backgroundColor = '#fdf2f8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === questions.length + 1) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', padding: '40px 20px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', border: '1px solid #f0f0f0' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '500', color: '#1f2937', marginBottom: '8px' }}>
              Какие проблемы вас беспокоят?
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '32px' }}>Выберите все подходящие варианты</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
              {problemsList.map(problem => (
                <button
                  key={problem.value}
                  onClick={() => {
                    if (selectedProblems.includes(problem.value)) {
                      setSelectedProblems(selectedProblems.filter(p => p !== problem.value));
                    } else {
                      setSelectedProblems([...selectedProblems, problem.value]);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    border: selectedProblems.includes(problem.value) ? '2px solid #db2777' : '1px solid #e5e7eb',
                    borderRadius: '10px',
                    backgroundColor: selectedProblems.includes(problem.value) ? '#fdf2f8' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  <span>{problem.label}</span>
                  {selectedProblems.includes(problem.value) && <span style={{ marginLeft: 'auto', color: '#db2777' }}>✓</span>}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(step - 1)} style={{ padding: '10px 24px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>
                ← Назад
              </button>
              <button onClick={() => setStep(step + 1)} style={{ padding: '10px 32px', backgroundColor: '#db2777', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Далее →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: '40px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', border: '1px solid #f0f0f0' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '500', color: '#1f2937', marginBottom: '32px' }}>
            Завершающий этап
          </h2>
          
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>Ваш возраст</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {ageRanges.map(age => (
                <button
                  key={age.value}
                  onClick={() => setSelectedAge(age.value)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '30px',
                    border: selectedAge === age.value ? '2px solid #db2777' : '1px solid #e5e7eb',
                    backgroundColor: selectedAge === age.value ? '#fdf2f8' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  {age.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>Есть ли аллергия на компоненты?</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {allergiesList.map(allergy => (
                <button
                  key={allergy.value}
                  onClick={() => {
                    if (selectedAllergies.includes(allergy.value)) {
                      setSelectedAllergies(selectedAllergies.filter(a => a !== allergy.value));
                    } else {
                      setSelectedAllergies([...selectedAllergies, allergy.value]);
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '30px',
                    border: selectedAllergies.includes(allergy.value) ? '2px solid #db2777' : '1px solid #e5e7eb',
                    backgroundColor: selectedAllergies.includes(allergy.value) ? '#fdf2f8' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  {allergy.label}
                  {selectedAllergies.includes(allergy.value) && <span style={{ marginLeft: '6px' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button onClick={() => setStep(step - 1)} style={{ padding: '10px 24px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>
              ← Назад
            </button>
            <button 
              onClick={handleComplete} 
              disabled={!selectedAge || isLoading}
              style={{
                padding: '10px 32px',
                backgroundColor: '#db2777',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: !selectedAge || isLoading ? 'not-allowed' : 'pointer',
                opacity: !selectedAge || isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? 'Сохранение...' : 'Завершить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}