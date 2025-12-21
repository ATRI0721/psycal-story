import { create } from "zustand";
import { LoginCodeRequest, LoginPasswordRequest, RegisterRequest, ResetPasswordRequest, User, SendVerificationRequest, UserGroup, UIMode } from "../types";
import { authAPI } from "../api/auth";
import { errorHandlingMiddleware } from "./middleware";
import { uiState } from "./uiStore";

interface AuthState {
  user: User | null;

  login: (credentials: LoginCodeRequest | LoginPasswordRequest) => Promise<void>;
  register: (credentials: RegisterRequest) => Promise<void>;
  resetPassword: (credentials: ResetPasswordRequest) => Promise<void>;
  logout: () => void;
  sendVerification: (r: SendVerificationRequest) => Promise<void>;
  verifyToken: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

function setToken(token: string) {
  localStorage.setItem("token", token);
}

function removeToken() {
  localStorage.removeItem("token");
}

export const useAuthStore = create<AuthState>(
  errorHandlingMiddleware<AuthState>()((set, get) => ({
    user: null,

    login: async (credentials) => {
      try {
        uiState.loading = true;
        const response = await authAPI.login(credentials);
        setToken(response.access_token);
        set({ user: response.user });
        uiState.uiMode = response.user.group === UserGroup.CONTROL?UIMode.CONTROL:UIMode.EXPERIMENT;
      } finally {
        uiState.loading = false;
      }
    },

    register: async (credentials: RegisterRequest) => {
      try {
        uiState.loading = true;
        const response = await authAPI.register(credentials);
        setToken(response.access_token);
        set({ user: response.user });
        uiState.uiMode =
          response.user.group === UserGroup.CONTROL
            ? UIMode.CONTROL
            : UIMode.EXPERIMENT;
      } finally {
        uiState.loading = false;
      }
    },

    resetPassword: async (credentials: ResetPasswordRequest) => {
        await authAPI.reset_password(credentials);
    },

    logout: () => {
      removeToken();
      set({ user: null });
    },

    deleteAccount: async () => {
      uiState.loading = true;
      authAPI.delete_account().then(() => {
        get().logout()
      }).finally(()=>uiState.loading = false);
    },

    sendVerification: async ({ email, type }) => {
      await authAPI.sendVerification(email, type);
    },

    verifyToken: async () => {
      try {
        const response = await authAPI.verifyToken();
        setToken(response.access_token);
        set({ user: response.user });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        set({ user: null });
      }
    },
  })));
