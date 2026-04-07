export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: string;
}

export interface AttendanceLocation {
  officeLat: number;
  officeLng: number;
  radius: number; // in meters
}

export interface RefreshTokenPayload {
  userId: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}
