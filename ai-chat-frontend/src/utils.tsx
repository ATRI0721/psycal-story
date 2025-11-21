
import { ClassifiedConversations, Conversation, StreamInitResponse, StreamMessageResponse } from "./types";

export function getError(error: unknown): Error {
  const t = ["detail", "message", "error", "data", "description"] as const;
  const hasKey = (obj: object, key: string): obj is { [k in string]: unknown } => key in obj;
  if (typeof error === "string") {
    return new Error(error);
  }else if (error instanceof Error) {
    return error;
  } else if (error instanceof Object) {
    for (const key of t) {
      if (hasKey(error, key)) {
        return getError(error[key]) as Error;
      }
    }
  }
  return new Error("Unknown error");
}

export function classifyConversations(
  conversations: Conversation[]
): ClassifiedConversations[] {
  const sortedConversations = conversations.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  const t: ClassifiedConversations[] = [
    {
      group_name: "今天",
      date_before: new Date().setHours(0, 0, 0, 0),
      conversations: [],
    },
    {
      group_name: "昨天",
      date_before: new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000,
      conversations: [],
    },
    {
      group_name: "七天内",
      date_before: new Date().setHours(0, 0, 0, 0) - 7 * 24 * 60 * 60 * 1000,
      conversations: [],
    },
    {
      group_name: "三十天内",
      date_before: new Date().setHours(0, 0, 0, 0) - 30 * 24 * 60 * 60 * 1000,
      conversations: [],
    },
  ];
  let i = 0;
  for (const conversation of sortedConversations) {
    while (i < t.length && new Date(conversation.updated_at).getTime() < t[i].date_before) {
      i++;
    }
    if (i === t.length) {
      const year = new Date(conversation.updated_at).getFullYear();
      const month = new Date(conversation.updated_at).getMonth();
      t.push({
        group_name: `${year}年${month + 1}月`,
        date_before: new Date(year, month, 1).getTime(),
        conversations: [],
      });
    }
    t[i].conversations.push(conversation);
  }
  return t.filter((c) => c.conversations.length > 0);
}

const DATA_THEME_KEY = "data-theme";

const THEMES = ["system", "light", "dark"];

function systemThemeListener(event: MediaQueryListEvent) {
  const theme = event.matches ? "dark" : "light";
  document.documentElement.setAttribute(DATA_THEME_KEY, theme);
}

function setSystemTheme() {
  if (!window.matchMedia){
    document.documentElement.setAttribute(DATA_THEME_KEY, "light");
    return;
  }
  const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
  const systemTheme = mediaQueryList.matches ? "dark" : "light";
  document.documentElement.setAttribute(DATA_THEME_KEY, systemTheme);
  mediaQueryList.addEventListener("change", systemThemeListener);
}

function removeSystemThemeListener() {
  if (!window.matchMedia) {
    return;
  }
  const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQueryList.removeEventListener("change", systemThemeListener);
}

export function themeInitializer() {
  setTheme(getTheme());
}

export function setTheme(theme: string) {
  if (!THEMES.includes(theme) || theme === "system") {
    setSystemTheme();
    localStorage.setItem(DATA_THEME_KEY, "system");
    return;
  }
  removeSystemThemeListener();
  localStorage.setItem(DATA_THEME_KEY, theme);
  document.documentElement.setAttribute(DATA_THEME_KEY, theme);
}

export function getTheme() {
  const storedTheme = localStorage.getItem(DATA_THEME_KEY);
  if (!storedTheme || !THEMES.includes(storedTheme)) {
    setTheme("system");
    return "system";
  }
  return storedTheme;
}



// ------------------ Token 检查 ------------------
export function checkToken() {
  const token = localStorage.getItem("token");
  return token && token.trim().length > 0;
}

// ------------------ 临时 ID ------------------
export function getTempId() {
  return `temp-${new Date().getTime()}-${Math.floor(Math.random() * 1000000)}`
}

// ------------------ 流式处理 ------------------
export async function handleStream(
  stream: ReadableStream,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  handleChunk: (data) => void
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  async function read(): Promise<void> {
    const { value, done } = await reader.read();
    if (done) return;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      try {
        handleChunk(JSON.parse(line));
      } catch {
        throw Error(`Failed to parse message: ${line}`);
      }
    }
    return read();
  }

  await read();
  if (buffer.trim()) {
    handleChunk(JSON.parse(buffer));
  }
}

export async function processStream(
  stream: ReadableStream,
  handlers: {
    onMessage?: (data: StreamMessageResponse) => void;
    onInit?: (data: StreamInitResponse) => void;
  }
) {
  await handleStream(stream, (data) => {
    if (data.type === "message" && handlers.onMessage) {
      handlers.onMessage(data);
    } else if (data.type === "init" && handlers.onInit) {
      handlers.onInit(data);
    }
  });
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export function withTimeWindow<F extends (this: any, ...args: any[]) => any>(
  fn: F,
  windowMs: number
): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>> | void> {
  let lastExec = 0;

  // 使用普通 function 并声明 this 的类型，保证调用时能正确传递 this
  return async function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    const now = Date.now();
    if (now - lastExec < windowMs) {
      // 在窗口内直接返回 undefined（以 Promise.resolve(undefined) 的形式）
      return;
    }
    lastExec = now;
    // await 用于解包可能的 Promise 返回值，返回类型匹配 Promise<Awaited<ReturnType<F>>>
    return (await fn.apply(this, args)) as Awaited<ReturnType<F>>;
  };
}

