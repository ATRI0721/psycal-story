import { uiActions } from './uiStore';
import functionalToast from "../components/common/Commend/Toast";


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

export const handleError = (key: string, error: Error | unknown) => {
  console.error(error);
  const error_message = getError(error).message;
  functionalToast(`${key}:${error_message}`, "ERROR");
  uiActions.setError(key, error_message);
}

