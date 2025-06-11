import { useEffect, useState } from 'react';
import React from 'react';

type ServiceWorkerState = 'installing' | 'installed' | 'activating' | 'activated' | 'redundant' | 'parsed' | null;

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [state, setState] = useState<ServiceWorkerState>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported in this browser');
      return;
    }

    let isMounted = true;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        if (isMounted) {
          setRegistration(registration);
          setState(registration.installing?.state || registration.waiting?.state || registration.active?.state || null);
        }

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (isMounted) {
              setState(newWorker.state as ServiceWorkerState);
              
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
              
              if (newWorker.state === 'activated') {
                setUpdateAvailable(false);
              }
            }
          });
        });

        // Check for updates on navigation
        if (registration.waiting) {
          setUpdateAvailable(true);
        }

        // Check for updates every hour
        const updateInterval = setInterval(() => {
          registration.update().catch(console.error);
        }, 60 * 60 * 1000);

        return () => clearInterval(updateInterval);
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    // Register service worker after page load
    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker);
    }

    // Listen for controller change (new service worker takes over)
    const onControllerChange = () => {
      if (isMounted) {
        setUpdateAvailable(false);
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      isMounted = false;
      window.removeEventListener('load', registerServiceWorker);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const updateServiceWorker = () => {
    if (!registration?.waiting) return;

    // Tell the service worker to skip waiting and take control
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  return {
    registration,
    state,
    updateAvailable,
    updateServiceWorker,
    isSupported: 'serviceWorker' in navigator,
  };
}

interface ServiceWorkerUpdateDialogProps {
  updateAvailable: boolean;
  updateServiceWorker: () => void;
}

export const ServiceWorkerUpdateDialog: React.FC<ServiceWorkerUpdateDialogProps> = ({
  updateAvailable,
  updateServiceWorker,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setIsVisible(true);
    }
  }, [updateAvailable]);

  const handleUpdate = () => {
    updateServiceWorker();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return React.createElement('div', { 
    className: 'fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-md z-50' 
  },
    React.createElement('div', { className: 'flex items-start' },
      React.createElement('div', { className: 'flex-shrink-0 pt-0.5' },
        React.createElement('svg', { 
          className: 'h-6 w-6 text-yellow-500',
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor'
        },
          React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
          })
        )
      ),
      React.createElement('div', { className: 'ml-3' },
        React.createElement('h3', { className: 'text-sm font-medium text-gray-900' }, 'Update available'),
        React.createElement('div', { className: 'mt-2 text-sm text-gray-500' },
          React.createElement('p', null, 'A new version of the app is available. Please refresh to update.')
        ),
        React.createElement('div', { className: 'mt-4 flex' },
          React.createElement('button', {
            type: 'button',
            className: 'bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            onClick: handleUpdate
          }, 'Update now'),
          React.createElement('button', {
            type: 'button',
            className: 'ml-3 bg-white text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            onClick: () => setIsVisible(false)
          }, 'Dismiss')
        )
      )
    )
  );
};
