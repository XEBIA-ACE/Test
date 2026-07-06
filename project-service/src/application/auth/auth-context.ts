// Auth context passed from JWT claims forwarded by the API Gateway.

export enum Role {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  VIEWER = 'VIEWER',
}

export interface AuthContext {
  userId: string;
  role: Role;
  email?: string;
}
