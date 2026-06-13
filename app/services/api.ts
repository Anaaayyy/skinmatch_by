import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { 
  Product, 
  Brand, 
  Category, 
  ProductsParams, 
  PaginatedResponse,
  LoginData,
  RegisterData,
  TokenResponse,
  UserProfile,
  Favorite,
  Comparison,
  Routine,
  ProductImage
} from '../types';

// Типы для форума
interface ForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  topics_count: number;
  posts_count: number;
  last_post: {
    id: number;
    author: string;
    created_at: string;
    topic_id: number;
    topic_title: string;
  } | null;
}

interface ForumTopic {
  id: number;
  category: number;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
    avatar_url: string | null;
  };
  is_pinned: boolean;
  is_closed: boolean;
  views_count: number;
  posts_count: number;
  posts: ForumPost[];
  last_post: ForumPost | null;
  created_at: string;
  updated_at: string;
}

interface ForumPost {
  id: number;
  topic: number;
  author: {
    id: number;
    username: string;
    avatar_url: string | null;
  };
  content: string;
  image_url: string | null;
  likes_count: number;
  is_liked: boolean;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}


const API_URL = '/api';
const MEDIA_URL = 'http://annabuil.beget.tech';

const getFullImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${MEDIA_URL}${url}`;
};

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: AxiosError): Promise<AxiosResponse> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post<TokenResponse>(
          `${API_URL}/token/refresh/`,
          { refresh: refreshToken }
        );
        localStorage.setItem('access_token', response.data.access);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// API для продуктов
export const productsAPI = {
  getAll: async (params?: ProductsParams): Promise<AxiosResponse<PaginatedResponse<Product>>> => {
    const response = await api.get<PaginatedResponse<Product>>('/products/', { params });
    if (response.data.results) {
      response.data.results = response.data.results.map((product: Product) => ({
        ...product,
        main_image_url: getFullImageUrl(product.main_image_url),
        gallery: product.gallery?.map((img: ProductImage) => ({
          ...img,
          url: getFullImageUrl(img.url)
        })) || []
      }));
    }
    return response;
  },
  
  getById: async (id: number): Promise<AxiosResponse<Product>> => {
    const response = await api.get<Product>(`/products/${id}/`);
    if (response.data) {
      response.data.main_image_url = getFullImageUrl(response.data.main_image_url);
      if (response.data.gallery) {
        response.data.gallery = response.data.gallery.map((img: ProductImage) => ({
          ...img,
          url: getFullImageUrl(img.url)
        }));
      }
    }
    return response;
  },
  
  recommend: async (data: { profile: { skin_type: string | null; problems: string[]; allergies: string[]; age_range: string | null } }): Promise<AxiosResponse<{ results: Product[]; total: number }>> => {
    const response = await api.post('/products/recommend/', data);
    if (response.data.results) {
      response.data.results = response.data.results.map((product: Product) => ({
        ...product,
        main_image_url: getFullImageUrl(product.main_image_url),
        gallery: product.gallery?.map((img: ProductImage) => ({
          ...img,
          url: getFullImageUrl(img.url)
        })) || []
      }));
    }
    return response;
  },
};

export const brandsAPI = {
  getAll: async (): Promise<AxiosResponse<Brand[] | PaginatedResponse<Brand>>> => {
    const response = await api.get<Brand[] | PaginatedResponse<Brand>>('/brands/');
    if (response.data) {
      const brands = Array.isArray(response.data) ? response.data : response.data.results || [];
      brands.forEach((brand: Brand) => {
        if (brand.logo) {
          // Если логотип уже полный URL, оставляем, иначе добавляем MEDIA_URL
          if (typeof brand.logo === 'string' && !brand.logo.startsWith('http')) {
            brand.logo = `${MEDIA_URL}${brand.logo}`;
          }
        }
      });
    }
    return response;
  },
};

// Интерфейс для ответа генерации рутины
interface RoutineProductData {
  id: number;
  title: string;
  brand: string;
  rating: number;
  main_image_url: string | null;
  category?: string;
  match_reason?: string;
}

// Интерфейс для создания рутины
interface CreateRoutineData {
  name: string;
  goal: string;
  time_of_day: string;
  cleansing: number | null;
  toner: number | null;
  serum: number | null;
  cream: number | null;
  spf: number | null;
}

// Интерфейс для ответа генерации рутины
interface GenerateRoutineResponse {
  routine: {
    cleansing: RoutineProductData | null;
    toner: RoutineProductData | null;
    serum: RoutineProductData | null;
    cream: RoutineProductData | null;
    spf: RoutineProductData | null;
  };
  time_of_day: string;
  priority: string;
  message: string;
}

// API для рутин
export const routinesAPI = {
  getAll: (): Promise<AxiosResponse<{ results: Routine[]; count: number }>> => 
    api.get('/routines/'),
  create: (data: CreateRoutineData): Promise<AxiosResponse<Routine>> => 
    api.post('/routines/', data),
  update: (id: number, data: Partial<CreateRoutineData>): Promise<AxiosResponse<Routine>> => 
    api.put(`/routines/${id}/`, data),
  delete: (id: number): Promise<AxiosResponse<void>> => 
    api.delete(`/routines/${id}/`),
};

// API для категорий
export const categoriesAPI = {
  getAll: (): Promise<AxiosResponse<Category[] | PaginatedResponse<Category>>> => 
    api.get('/categories/'),
};

// API для авторизации
export const authAPI = {
  login: (data: LoginData): Promise<AxiosResponse<TokenResponse>> => 
    api.post('/token/', data),
  register: (data: RegisterData): Promise<AxiosResponse<{ id: number; username: string; email: string }>> => 
    api.post('/register/', data),
};

export const profileAPI = {
  get: (): Promise<AxiosResponse<UserProfile>> => 
    api.get('/profile/me/'),
  update: (data: Partial<UserProfile> | FormData): Promise<AxiosResponse<UserProfile>> => {
    if (data instanceof FormData) {
      return api.put('/profile/update-profile/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put('/profile/update-profile/', data);
  },
  changePassword: (data: { old_password: string; new_password: string }): Promise<AxiosResponse<{ status: string }>> => 
    api.post('/profile/change-password/', data),
};


export const forumAPI = {
  getCategories: (): Promise<AxiosResponse<ForumCategory[]>> => api.get('/forum/categories/'),
  getTopics: (params?: { category?: number; page?: number; search?: string; ordering?: string }): Promise<AxiosResponse<{ results: ForumTopic[]; count: number }>> => api.get('/forum/topics/', { params }),
  getTopic: (id: number): Promise<AxiosResponse<ForumTopic>> => api.get(`/forum/topics/${id}/`),
  createTopic: (data: Record<string, unknown>): Promise<AxiosResponse<ForumTopic>> => api.post('/forum/topics/', data),
  createPost: (data: Record<string, unknown>): Promise<AxiosResponse<ForumPost>> => api.post('/forum/posts/', data),
  deletePost: (id: number): Promise<AxiosResponse<{ status: string }>> => api.delete(`/forum/posts/${id}/`),
  likePost: (id: number): Promise<AxiosResponse<{ status: string; likes_count: number }>> => api.post(`/forum/posts/${id}/like/`),
  uploadImage: (image: string): Promise<AxiosResponse<{ image_id: number; url: string }>> => api.post('/forum/posts/upload-image/', { image }),
};

// API для избранного
interface FavoritesApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Favorite[];
}

export const favoritesAPI = {
  getAll: (): Promise<AxiosResponse<FavoritesApiResponse>> => 
    api.get('/favorites/'),
  add: (productId: number): Promise<AxiosResponse<{ status: string }>> => 
    api.post('/favorites/', { product_id: productId }),
  remove: (productId: number): Promise<AxiosResponse<{ status: string }>> => 
    api.delete(`/favorites/remove/?product_id=${productId}`),
};

// API для сравнения
interface ComparisonsApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Comparison[];
}

export const comparisonsAPI = {
  getAll: (): Promise<AxiosResponse<ComparisonsApiResponse>> => 
    api.get('/comparisons/'),
  create: (name: string): Promise<AxiosResponse<Comparison>> => 
    api.post('/comparisons/', { name }),
  addProduct: (comparisonId: number, productId: number): Promise<AxiosResponse<{ status: string }>> => 
    api.post(`/comparisons/${comparisonId}/add_product/`, { product_id: productId }),
  removeProduct: (comparisonId: number, productId: number): Promise<AxiosResponse<{ status: string }>> => 
    api.post(`/comparisons/${comparisonId}/remove_product/`, { product_id: productId }),
};



// API для анкеты
export const quizAPI = {
  saveResults: (data: { skin_type: string; problems: string[]; age_range: string; allergies: string[] }): Promise<AxiosResponse<{ status: string; message: string }>> => 
    api.post('/save-quiz/', data),
};

export const moderationAPI = {
  checkText: (text: string): Promise<AxiosResponse<{ has_bad_words: boolean; message: string }>> => 
    api.post('/check-text/', { text }),
};

export default api;