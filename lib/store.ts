import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  username: string | null;
  setToken: (token: string, username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      setToken: (token, username) => {
        localStorage.setItem("heimdall_token", token);
        set({ token, username });
      },
      logout: () => {
        localStorage.removeItem("heimdall_token");
        set({ token: null, username: null });
      },
    }),
    { name: "heimdall-auth" }
  )
);

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  model?: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (msg) => set((s) => ({ messages: [...s.messages.slice(-100), msg] })),
      clearMessages: () => set({ messages: [] }),
    }),
    { name: "heimdall-chat" }
  )
);
