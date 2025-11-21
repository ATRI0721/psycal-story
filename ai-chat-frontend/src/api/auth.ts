import { AuthResponse, LoginCodeRequest,LoginPasswordRequest, RegisterRequest, ResetPasswordRequest, VerificationType } from "../types";
import api from "./setting";


export const authAPI = {
  async sendVerification(email: string, type: VerificationType) {
    return api.post(`/auth/send-verification/${type}`, { email }, false);
  },

  async login(credentials: LoginCodeRequest | LoginPasswordRequest) {
    if ("verification_code" in credentials) {
      return api.post<AuthResponse>("/user/login/code", credentials, false);
    }else{
      return api.post<AuthResponse>("/user/login/password", credentials, false);
    }
  },

  async register(credentials: RegisterRequest) {
    return api.post<AuthResponse>("/user/register", credentials, false);
  },

  async reset_password(r: ResetPasswordRequest){
    return api.post("/user/reset-password", r, false);
  },

  async delete_account() {
    return api.delete("/user/delete", true);
  },

  async verifyToken() {
    if (!localStorage.getItem("token")) {
      return Promise.reject(new Error("No token found"));
    }
    return api.get<AuthResponse>("/auth/verify");
  },
};
