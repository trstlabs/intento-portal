import { ComponentType } from 'react';

declare module 'next/dynamic' {
  type DynamicOptions<P = {}> = {
    loading?: (props: P) => JSX.Element | null;
    ssr?: boolean;
    loadableGenerated?: {
      webpack?: () => Array<number>;
      modules?: string[];
    };
  };

  // Override the default dynamic import type
  function dynamic<P = {}>(
    load: () => Promise<{ default: ComponentType<P> }>,
    options?: DynamicOptions<P>
  ): ComponentType<P>;

  export = dynamic;
  export as namespace dynamic;
}
