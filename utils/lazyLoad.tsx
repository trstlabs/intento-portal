import dynamic from 'next/dynamic';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ComponentType, ReactNode } from 'react';

type LazyLoadOptions = {
  fallback?: ReactNode;
  ssr?: boolean;
};

export function lazyLoad<P = Record<string, unknown>>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  { fallback, ssr = false }: LazyLoadOptions = {}
): ComponentType<P> {
  // Create a component that will be shown while the dynamic component is loading
  const FallbackComponent = () => (
    <>{fallback || <LoadingSpinner />}</>
  );

  // Use Next.js dynamic import with proper typing
  return dynamic(importFunc, {
    loading: () => <FallbackComponent />,
    ssr,
  });
}

// Example usage:
// const HeavyComponent = lazyLoad(() => import('../components/HeavyComponent'));
