// 基础类型定义
export type VerificationType = "register" | "login" | "reset";
export type MessageRole = "user" | "assistant";
export type StreamMessageType = "init" | "message";


// 通用类型定义
export interface User {
  id: string;
  email: string;
}

// 认证模块类型定义
export interface SendVerificationRequest {
  type: VerificationType;
  email: string;
}

export interface SendVerificationResponse {
  message: string;
}

export interface VerifyVerificationRequest {
  email: string;
  verification_code: string;
}

export interface VerifyVerificationResponse {
  message: string;
  valid: boolean;
}

// export interface RefreshTokenResponse {
//   access_token: string;
//   refresh_token: string;
//   expires_in: number;
// }

// 用户管理模块类型定义
export interface RegisterRequest {
  email: string;
  verification_code: string;
  password: string;
}

export interface LoginCodeRequest {
  email: string;
  verification_code: string;
}

export interface LoginPasswordRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ResetPasswordRequest {
  email: string;
  verification_code: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface DeleteUserResponse {
  message: string;
}

// 对话管理模块类型定义
export interface ConversationResponse {
  id: string;
  title: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  loading: boolean;
  updated_at: string; // ISO 8601 format
}

export interface CreateConversationRequest {
  title: string;
}

export interface CreateConversationResponse {
  id: string;
  title: string;
  updated_at: string;
}

export interface UpdateConversationTitleRequest {
  title: string;
}

export interface UpdateConversationTitleResponse {
  id: string;
  title: string;
  updated_at: string;
}

export interface DeleteResponse {
  message: string;
}

export interface ClassifiedConversations {
  group_name: string;
  date_before: number;
  conversations: Conversation[];
}

export interface StreamTitleResponse {
  type: "title";
  conversation_id: string;
  value: string;
  updated_at?: string;
  done: boolean;
}

// 消息类型定义
export interface Message {
  id: string;
  content: string;
  role: MessageRole;
}

export interface SendMessageRequest {
  message: string;
  temp_id: string;
}

// 流式响应类型定义
export interface StreamInitResponse {
  type: "init";
  temp_id: string;
  user_message_id: string;
  ai_message_id: string;
  done: false;
}

export interface StreamMessageResponse {
  type: "message";
  id: string;
  value: string;
  done: boolean;
}

export type StreamResponse = StreamInitResponse | StreamMessageResponse;

// API 错误响应类型
export interface ApiError {
  message: string;
  code?: number;
  details?: any;
}

// HTTP 状态码枚举
export enum HttpStatus {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

// API 响应包装器
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  status: HttpStatus;
}

// 请求配置类型
export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// JWT Token 相关类型
export interface TokenPayload {
  user_id: string;
  email: string;
  exp: number;
  iat: number;
}

// 分页相关类型（如果需要）
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}
