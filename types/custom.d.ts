import { ComponentType } from 'react';

declare module 'next/dynamic' {
  interface DynamicOptions<T = unknown> {
    loading?: () => JSX.Element | null;
    ssr?: boolean;
  }

  function dynamic<T = {}>(
    loader: () => Promise<{ default: ComponentType<T> }>,
    options?: DynamicOptions<T>
  ): ComponentType<T>;
}

declare module 'next' {
  interface NextPage<P = {}, IP = P> {
    getLayout?: (page: React.ReactElement) => React.ReactNode;
  }
}
