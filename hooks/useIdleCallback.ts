import { useEffect, useRef, useCallback } from 'react';

type CallbackFunction = (deadline: IdleDeadline) => void;

const useIdleCallback = (callback: CallbackFunction, options?: IdleRequestOptions) => {
  const requestId = useRef<number | null>(null);

  const handleCallback = useCallback((idleDeadline: IdleDeadline) => {
    callback(idleDeadline);
  }, [callback]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestId.current = window.requestIdleCallback(handleCallback, options);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      const timeoutId = setTimeout(() => {
        handleCallback({
          didTimeout: false,
          timeRemaining: () => 50, // 50ms time remaining
        } as IdleDeadline);
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }

    return () => {
      if (requestId.current !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(requestId.current);
      }
    };
  }, [handleCallback, options]);

  const cancel = useCallback(() => {
    if (requestId.current !== null && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(requestId.current);
      requestId.current = null;
    }
  }, []);

  return { cancel };
};

export default useIdleCallback;
