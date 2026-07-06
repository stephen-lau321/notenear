// 用户角色
export type UserRole = "ADMIN" | "TEACHER" | "PARENT";

export interface User {
  id: string;
  nickname: string | null;
  avatar: string | null;
  phone: string | null;
  role: UserRole;
  residentialArea?: string | null;
  studentName?: string | null;
  experienceLevel?: string | null;
  childGender?: string | null;
  childAge?: string | null;
  childGrade?: string | null;
  experienceType?: string | null;
  experienceSubjects?: string | null;
  createdAt: string;
}

// 老师认证
export type TeacherAuthStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TeacherAuth {
  teacherType?: string;
  id: string;
  userId: string;
  realName: string;
  gender?: string | null;
  graduationSchool?: string | null;
  major?: string | null;
  experienceYears?: string | null;
  experienceItems?: string | null;
  isStudent?: boolean;
  status: TeacherAuthStatus;
  streetClaims: StreetClaim[];
}

// 乐器
export interface Instrument {
  id: string;
  name: string;
}

// 街道认领
export type ClaimStatus = "ACTIVE" | "RELEASED";

export interface StreetClaim {
  id: string;
  teacherId: string;
  instrumentId: string;
  instrument: Instrument;
  streetName: string;
  communityName?: string | null;
  streetRaw: string | null;
  district: string | null;
  city: string | null;
  province: string | null;
  lat: number | null;
  lng: number | null;
  status: ClaimStatus;
  teacher?: {
    realName?: string;
    gender?: string | null;
    graduationSchool?: string | null;
    major?: string | null;
    experienceYears?: string | null;
    experienceItems?: string | null;
    isStudent?: boolean;
    status?: string;
    user: {
      id: string;
      nickname: string | null;
      avatar: string | null;
    };
  };
}

// 活动
export type ActivityStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Activity {
  id: string;
  teacherId: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  eventTime: string | null;
  location: string | null;
  price: number | null;
  status: ActivityStatus;
  createdAt: string;
}

// API 通用响应
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode: number;
}

// 商品
export interface Product {
  id: string;
  teacherId: string;
  instrumentId: string;
  name: string;
  description: string | null;
  price: number;
  images: string;
  stock: number;
  status: string;
  createdAt: string;
  instrument: Instrument;
  teacher: {
    user: {
      id: string;
      nickname: string | null;
      avatar: string | null;
    };
  };
}

// 订单
export interface Order {
  id: string;
  productId: string;
  buyerId: string;
  quantity: number;
  totalFee: number;
  status: string;
  createdAt: string;
  product: Product;
}