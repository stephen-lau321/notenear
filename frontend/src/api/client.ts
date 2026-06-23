import axios from "axios";

const API_BASE = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL 
  : "/api";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// 请求拦截器：附加 Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/auth";
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ===== API 方法 =====

// 认证
export const authApi = {
  wechatLogin: (code: string) => apiClient.post("/auth/wechat", { code }),
  phoneLogin: (phone: string, code: string) =>
    apiClient.post("/auth/phone/login", { phone, code }),
  sendSmsCode: (phone: string) =>
    apiClient.post("/auth/phone/send-code", { phone }),
};

// 用户
export const userApi = {
  getProfile: () => apiClient.get("/user/profile"),
  updateProfile: (data: { nickname?: string; avatar?: string }) =>
    apiClient.patch("/user/profile", data),
};

// 老师认证
export const teacherApi = {
  apply: (data: {
    realName: string;
    idCardFront?: string;
    idCardBack?: string;
    instrumentNames: string[];
  }) => apiClient.post("/teacher/apply", data),
  getStatus: () => apiClient.get("/teacher/status"),
};

// 街道认领
export const claimApi = {
  claim: (data: {
    instrumentName: string;
    streetName: string;
    district?: string;
    city?: string;
    lat?: number;
    lng?: number;
  }) => apiClient.post("/claims", data),
  nearby: (lat: number, lng: number, radius?: number) =>
    apiClient.get("/claims/nearby", { params: { lat, lng, radius } }),
  search: (q: string, lat?: number, lng?: number) =>
    apiClient.get("/claims/search", { params: { q, lat, lng } }),
  getById: (id: string) => apiClient.get(`/claims/${id}`),
};

// 活动
export const activityApi = {
  create: (data: {
    title: string;
    description?: string;
    coverImage?: string;
    eventTime?: string;
    location?: string;
    price?: number;
  }) => apiClient.post("/activities", data),
  listByTeacher: (teacherId: string) =>
    apiClient.get(`/activities/teacher/${teacherId}`),
};

// 商品
export const productApi = {
  list: (params?: { teacherId?: string; instrumentId?: string }) =>
    apiClient.get("/products", { params }),
  getById: (id: string) => apiClient.get(`/products/${id}`),
  create: (data: {
    instrumentId: string; name: string; description?: string;
    price: number; images?: string[];
  }) => apiClient.post("/products", data),
  update: (id: string, data: any) => apiClient.patch(`/products/${id}`, data),
};

// 订单
export const orderApi = {
  create: (data: { productId: string; quantity: number }) =>
    apiClient.post("/orders", data),
  mine: () => apiClient.get("/orders/mine"),
};

export default apiClient;