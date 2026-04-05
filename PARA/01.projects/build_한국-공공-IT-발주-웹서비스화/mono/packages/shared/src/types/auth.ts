export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export interface TokenPayload {
  user_id: number;
  email: string;
  iat: number;
  exp: number;
}
