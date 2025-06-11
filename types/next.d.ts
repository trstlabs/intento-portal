import { ComponentType, ReactNode } from 'react';

declare module 'next/dynamic' {
  interface DynamicOptions<P = unknown> {
    loading?: (() => ReactNode) | (() => JSX.Element);
    ssr?: boolean;
  }
  
  type ComponentType<P = unknown> = React.ComponentType<P>;
  
  function dynamic<P = unknown>(
    dynamicOptions: () => Promise<{ default: ComponentType<P> }>,
    options?: DynamicOptions<P>
  ): ComponentType<P>;
  
  function dynamic<P = unknown>(
    dynamicOptions: { load: () => Promise<{ default: ComponentType<P> }> },
    options?: DynamicOptions<P>
  ): ComponentType<P>;
}

declare module 'next' {
  interface NextPage<P = unknown, IP = P> {
    getLayout?: (page: React.ReactElement) => React.ReactNode;
  }
}
