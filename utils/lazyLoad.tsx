import dynamic, { LoaderComponent } from 'next/dynamic';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ComponentType, ReactNode } from 'react';

type ImportFunc<T = unknown> = () => Promise<{ default: ComponentType<T> }>;

type LazyLoadOptions = {
  fallback?: ReactNode;
  ssr?: boolean;
};

export function lazyLoad<P = Record<string, unknown>>(
  importFunc: ImportFunc<P>,
  { fallback, ssr = false }: LazyLoadOptions = {}
): ComponentType<P> {
  // Create a component that will be shown while the dynamic component is loading
  const FallbackComponent = () => (
    <>{fallback || <LoadingSpinner />}</>
  );

  // Use Next.js dynamic import with proper typing
  return dynamic<{}>(
    importFunc as unknown as LoaderComponent<{}>,
    {
      loading: () => <FallbackComponent />,
      ssr,
    }
  ) as unknown as ComponentType<P>;
}

// Example usage:
// const HeavyComponent = lazyLoad(() => import('../components/HeavyComponent'));
