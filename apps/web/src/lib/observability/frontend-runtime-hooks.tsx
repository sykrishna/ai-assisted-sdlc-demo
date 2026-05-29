'use client';

import { useEffect } from 'react';
import { logFrontendEvent } from './frontend-logger';

export function FrontendRuntimeHooks() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logFrontendEvent('error', 'frontend.runtime.error', {
        message: event.message,
        source: event.filename,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      logFrontendEvent('error', 'frontend.runtime.unhandled_rejection', {
        reason:
          event.reason instanceof Error
            ? event.reason.message
            : typeof event.reason === 'string'
              ? event.reason
              : 'Unknown promise rejection',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
