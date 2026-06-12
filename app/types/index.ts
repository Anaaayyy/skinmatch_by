export interface Product {
  id: number;
  title: string;
  brand: number;
  brand_name: string;
  brand_website?: string;
  brand_shop_url?: string;
  category: number;
  category_name: string;
  description: string;
  volume: string;
  ingredients: string;
  how_to_use: string;
  main_image_url: string | null;
  gallery: ProductImage[];
  rating: number;
  suitable_skin_types: string;
  solves_problems: string;
  has_allergens: string;
  skin_type: string;
  problems: string;
}

export interface Brand {
  id: number;
  name: string;
  description: string;
  logo?: string | null;
  website?: string;      // Добавлено
  shop_url?: string;     // Добавлено
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductsParams {
  page?: number;
  page_size?: number;
  search?: string;
  brand?: number;
  category?: number;
  skin_type?: string;
  ordering?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  skin_type: string;
  problems: string;
  age_range: string;
  allergies: string;
}

export interface Favorite {
  id: number;
  product: number;
  product_details?: Product;
  created_at: string;
}

export interface Comparison {
  id: number;
  name: string;
  products: number[];
  products_details?: Product[];
  created_at: string;
}

export interface Routine {
  id: number;
  name: string;
  goal: string;
  time_of_day: string;  // Добавлено
  cleansing: number | null;
  cleansing_details?: Product | null;
  toner: number | null;
  toner_details?: Product | null;
  serum: number | null;
  serum_details?: Product | null;
  cream: number | null;
  cream_details?: Product | null;
  spf: number | null;
  spf_details?: Product | null;
  created_at: string;
}

// Для создания рутины используем Partial, но goal должен быть обязательным
export interface CreateRoutineData {
  name: string;
  goal: string;
  cleansing: number | null;
  toner: number | null;
  serum: number | null;
  cream: number | null;
  spf: number | null;
}

export interface QuizAnswers {
  skin_type: string;
  problems: string[];
  age_range: string;
  allergies: string[];
}

export interface ProductImage {
  id: number;
  url: string | null;
  caption: string;
}



export interface UserSkinProfile {
  skinType: string;
  problems: string[];
}

export interface ProductWithMatch extends Product {
  matchPercentage?: number;
  matchDetails?: {
    skinTypeMatch: boolean;
    problemsMatch: number;
    totalProblems: number;
  };
}