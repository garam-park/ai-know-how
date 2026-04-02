export interface UserDto {
  id: number;
  email: string;
  name: string;
  tel?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  tel?: string;
}

export interface UpdateUserRequest {
  name?: string;
  tel?: string;
}
