// src/stores/middleware/errorHandling.ts

import { StateCreator } from 'zustand';

import functionalToast from "../components/Commend/Toast";
import { getError } from "../utils";

export const handleError = (error: Error | unknown) => {
  console.error(error);
  functionalToast(getError(error).message, "ERROR");
}


type ErrorHandler = (error: unknown) => void;

/**
 * Zustand 中间件，用于为所有 action 自动添加 try...catch 错误处理。
 * @param errorHandler 可选的自定义错误处理函数。
 */
export const baseErrorHandlingMiddleware = <T>(
  errorHandler?: ErrorHandler
) => (config: StateCreator<T>): StateCreator<T> => {
  // 返回一个新的 store 配置
  return (set, get, api) => {
    // 首先，用原始配置创建 store
    const initializedStore = config(set, get, api);

    // 然后，遍历 store 的所有属性
    const wrappedActions = Object.keys(initializedStore).reduce((acc, key) => {
      const property = initializedStore[key as keyof T];

      // 如果属性是一个函数，我们就包装它
      if (typeof property === 'function') {
        acc[key as keyof T] = (...args: any[]) => {
          try {
            // 执行原始的 action
            return (property as any).apply(initializedStore, args);
          } catch (error) {
            console.error(`[Zustand Error] Caught in action "${key}":`, error);
            
            // 如果提供了自定义错误处理器，则调用它
            if (errorHandler) {
              errorHandler(error, key, initializedStore);
            }

          }
        };
      } else {
        acc[key as keyof T] = property;
      }
      return acc;
    }, {} as T);

    return wrappedActions as T;
  };
};

export const errorHandlingMiddleware = <T>() => baseErrorHandlingMiddleware<T>(handleError);
