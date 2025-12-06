// src/store/uiStore.ts
import { proxy } from "valtio";

interface UIState {
  loading: boolean;
  error: { [key: string]: string | null };
  storyUIState: Record<string, { input: string; loading: boolean; showConversation: boolean; }>;
  conversationUIState: Record<string, { input: string; loading: boolean }>;
}

export const uiState = proxy<UIState>({
  loading: false,
  error: {},
  storyUIState : {},
  conversationUIState: {}
});

export const uiActions = {
  setError(key: string, message: string | null) {
    uiState.error[key] = message;
  },
  getStoryUIState(id: string) {
    if (!uiState.storyUIState[id])
      uiState.storyUIState[id] = { input: "", loading: false, showConversation: false };
    return uiState.storyUIState[id];
  },
  getConversationUIState(id: string){
    if (!uiState.conversationUIState[id])
      uiState.conversationUIState[id] = { input: "", loading: false };
    return uiState.conversationUIState[id];
  },
};
