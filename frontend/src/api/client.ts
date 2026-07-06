import axios from "axios";

const API_BASE = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL 
  : "/api";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: unwrap data, handle 401
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      // Redirect to login if not already there
      if (window.location.pathname !== "/xtwhttra/auth") {
        window.location.href = "/xtwhttra/auth";
        return;
      }
    }
    const errData = error.response?.data || error;
    const msg = typeof errData === "string" ? errData : errData?.message || errData?.error || "请求失败";
    return Promise.reject(new Error(msg));
  }
);

// ===== API Methods =====

// Auth
export const authApi = {
  register: (email: string, password: string, role?: string) =>
    apiClient.post("/auth/register", { email, password, role }),
  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),
  phoneLogin: (phone: string, code: string) =>
    apiClient.post("/auth/phone/login", { phone, code }),
};

// User
export const userApi = {
  getProfile: () => apiClient.get("/user/profile"),
  updateProfile: (data: { nickname?: string; avatar?: string; residentialArea?: string; phone?: string; studentName?: string; experienceLevel?: string; childGender?: string; childAge?: string; childGrade?: string; experienceType?: string; experienceSubjects?: string; idCardNo?: string; selfGender?: string; selfExperienceYears?: string; age?: number; school?: string; experienceFormat?: string }) =>
    apiClient.patch("/user/profile", data),
};

// Teacher
export const teacherApi = {
  apply: (data: {
    realName: string;
    idCardFront?: string;
    idCardBack?: string;
    idCardNo?: string;
    instrumentNames: string[];
    teacherType?: string;
    gender?: string;
    graduationSchool?: string;
    major?: string;
    experienceYears?: string;
    graduationCert?: string;
    teacherCert?: string;
    experienceItems?: string;
    highestDegree?: string;
    isStudent?: boolean;
  }) => apiClient.post("/teacher/apply", data),
  getStatus: () => apiClient.get("/teacher/status"),
};

// Map
const amapApi = {
  searchCommunities: (street: string, district?: string) =>
    apiClient.get("/map/communities", { params: { street, district } }),
};

// Street Claim
export const claimApi = {
  claim: (data: {
    instrumentName: string;
    streetName: string;
    communityName?: string;
    district?: string;
    city?: string;
    lat?: number;
    lng?: number;
  }) => apiClient.post("/claims", data),
  nearby: (lat: number, lng: number, radius?: number, mode?: string) =>
    apiClient.get("/claims/nearby", { params: { lat, lng, radius, mode } }),
  search: (q: string, lat?: number, lng?: number, mode?: string) =>
    apiClient.get("/claims/search", { params: { q, lat, lng, mode } }),
  getById: (id: string) => apiClient.get(`/claims/${id}`),
};

// Activity
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
  listMy: () => apiClient.get("/activities/my"),
  getById: (id: string) => apiClient.get(`/activities/${id}`),
};

// Product
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

// Order
export const orderApi = {
  create: (data: { productId: string; quantity: number }) =>
    apiClient.post("/orders", data),
  mine: () => apiClient.get("/orders/mine"),
};

// Admin
export const adminApi = {
  getDashboard: () => apiClient.get("/admin/dashboard"),
  listPendingTeachers: () => apiClient.get("/admin/teachers/pending"),
  reviewTeacher: (authId: string, approved: boolean, reason?: string) =>
    apiClient.post("/admin/teachers/review", { authId, approved, reason }),
  listPendingActivities: () => apiClient.get("/admin/activities/pending"),
  reviewActivity: (activityId: string, approved: boolean, reason?: string) =>
    apiClient.post("/admin/activities/review", { activityId, approved, reason }),
  listClaims: (page?: number) => apiClient.get("/admin/claims", { params: { page } }),
  releaseClaim: (id: string) => apiClient.post(`/admin/claims/${id}/release`),
  getDuplicates: () => apiClient.get("/admin/duplicates"),
};

export const adminFullApi = {
  listUsers: (role?: string, page?: number) =>
    apiClient.get("/admin/users", { params: { role, page } }),
};

// Neighbor registration (no auth required)
export const neighborApi = {
  register: (data: {
    phone: string;
    experienceType: string;
    province?: string; city?: string; district?: string;
    street?: string; community?: string;
    age?: number; selfGender?: string;
    experienceSubjects?: string;
    studentName?: string; childGender?: string;
    childAge?: string; childGrade?: string; school?: string;
  }) => apiClient.post("/auth/neighbor/register", data),
};

// Contact / Messaging
export const contactApi = {
  sendMessage: (teacherId: string, message: string) =>
    apiClient.post("/contact/message", { teacherId, message }),
  listMessages: () => apiClient.get("/contact/messages"),
  reply: (messageId: string, reply: string) =>
    apiClient.post(`/contact/message/${messageId}/reply`, { reply }),
  checkPhone: (targetUserId: string) =>
    apiClient.get(`/contact/phone-check/${targetUserId}`),
  unlockByIdCard: (targetUserId: string, idCardNo: string) =>
    apiClient.post("/contact/unlock-phone/idcard", { targetUserId, idCardNo }),
  unlockByPoints: (targetUserId: string) =>
    apiClient.post("/contact/unlock-phone/points", { targetUserId }),
  buyPoints: (amount: number) =>
    apiClient.post("/contact/buy-points", { amount }),
  connectorRegister: (data: any) =>
    apiClient.post("/contact/connector/register", data),
  getBackupClaims: () =>
    apiClient.get("/contact/backup-claims"),
};

// File upload helper (multipart/form-data)
export async function uploadFile(file: File): Promise<{ url: string; originalName: string; size: number }> {
  const token = localStorage.getItem("access_token");
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(`${API_BASE}/media/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: 30000,
  });
  return res.data?.data || res.data;
}

// ===== V2 新增: 生源需求 =====
export const demandApi = {
  list: (params?: { city?: string; instrument?: string; status?: string; skip?: number; take?: number }) =>
    apiClient.get("/demands", { params }),
  getById: (id: string) => apiClient.get(`/demands/${id}`),
  rescore: (id: string) => apiClient.post(`/demands/${id}/rescore`),
};

// ===== V2 新增: 匹配引擎 =====
export const matchingApi = {
  matchDemand: (demandId: string) => apiClient.post(`/matching/match/${demandId}`),
  myMatches: () => apiClient.get("/matching/my"),
  accept: (matchId: string) => apiClient.post(`/matching/${matchId}/accept`),
  decline: (matchId: string) => apiClient.post(`/matching/${matchId}/decline`),
  listAll: (skip?: number, take?: number) => apiClient.get("/matching", { params: { skip, take } }),
};

// ===== V2 新增: 评价 =====
export const reviewApi = {
  create: (claimId: string, rating: number, content?: string) =>
    apiClient.post("/reviews", { claimId, rating, content }),
  listByClaim: (claimId: string, skip?: number, take?: number) =>
    apiClient.get(`/reviews/${claimId}`, { params: { skip, take } }),
};

// ===== V2 新增: 收藏 =====
export const favoriteApi = {
  toggle: (claimId: string) => apiClient.post(`/favorites/${claimId}`),
  listMy: () => apiClient.get("/favorites"),
  check: (claimId: string) => apiClient.get(`/favorites/check/${claimId}`),
};

// ===== V2 新增: 通知 =====
export const notificationApi = {
  listMy: (skip?: number, take?: number) =>
    apiClient.get("/notifications", { params: { skip, take } }),
  markRead: (id: string) => apiClient.post(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post("/notifications/read-all"),
  getUnreadCount: () => apiClient.get("/notifications/unread-count"),
};

export default apiClient;

