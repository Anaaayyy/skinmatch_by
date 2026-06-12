// utils/translations.ts

export const SKIN_TYPE_TRANSLATIONS: Record<string, string> = {
  'dry': 'Сухая',
  'oily': 'Жирная',
  'combination': 'Комбинированная',
  'normal': 'Нормальная',
  'sensitive': 'Чувствительная',
  'all': 'Все типы',
  'Dry': 'Сухая',
  'Oily': 'Жирная',
  'Combination': 'Комбинированная',
  'Normal': 'Нормальная',
  'Sensitive': 'Чувствительная',
  'All': 'Все типы',
};

export const PROBLEM_TRANSLATIONS: Record<string, string> = {
  'acne': 'Акне',
  'blackheads': 'Чёрные точки',
  'pigmentation': 'Пигментация',
  'dark_spots': 'Пигментные пятна',
  'wrinkles': 'Морщины',
  'aging': 'Возрастные изменения',
  'dryness': 'Сухость',
  'dehydration': 'Обезвоженность',
  'oiliness': 'Жирный блеск',
  'redness': 'Покраснения',
  'sensitivity': 'Чувствительность',
  'dullness': 'Тусклый цвет',
  'pores': 'Расширенные поры',
  'firmness': 'Потеря упругости',
  'hydration': 'Увлажнение',
  'nutrition': 'Питание',
  'dark_circles': 'Тёмные круги',
  'puffiness': 'Отёчность',
  'inflammation': 'Воспаления',
};

export const translateSkinType = (type: string): string => {
  if (!type) return 'Не указан';
  if (type.toLowerCase() === 'all' || type === 'Все типы') return 'Все типы кожи';
  
  const types = type.split(',').map(t => t.trim());
  return types.map(t => SKIN_TYPE_TRANSLATIONS[t] || t).join(', ') || 'Не указан';
};

export const translateProblems = (problems: string): string => {
  if (!problems) return '';
  
  return problems
    .split(',')
    .map(p => PROBLEM_TRANSLATIONS[p.trim()] || p.trim())
    .join(', ');
};

export const calculateMatchPercentage = (
  productSuitableTypes: string,
  productSolvesProblems: string,
  userProfile: { skinType: string; problems: string[] }
): { percentage: number; skinTypeMatch: boolean; problemsMatch: number; totalProblems: number } => {
  
  let skinTypeMatch = false;
  
  if (!productSuitableTypes || productSuitableTypes === 'all' || productSuitableTypes === 'Все типы') {
    skinTypeMatch = true;
  } else {
    const productTypes = productSuitableTypes.split(',').map(t => t.trim().toLowerCase());
    skinTypeMatch = productTypes.includes(userProfile.skinType.toLowerCase());
  }
  
  const productProblems = productSolvesProblems
    ? productSolvesProblems.split(',').map(p => p.trim().toLowerCase())
    : [];
  
  const userProblems = userProfile.problems.map(p => p.toLowerCase());
  const matchedProblems = productProblems.filter(p => userProblems.includes(p));
  
  const totalProblems = userProblems.length || 1;
  const problemsMatch = matchedProblems.length;
  
  const skinWeight = skinTypeMatch ? 40 : 0;
  const problemWeight = totalProblems > 0 ? (problemsMatch / totalProblems) * 60 : 40;
  const percentage = Math.round(skinWeight + problemWeight);
  
  return {
    percentage: Math.min(percentage, 100),
    skinTypeMatch,
    problemsMatch,
    totalProblems: userProblems.length,
  };
};