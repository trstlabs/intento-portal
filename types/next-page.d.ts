import { NextPage } from 'next';

declare module 'next' {
  type NextPageWithLayout<P = unknown, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: React.ReactElement) => React.ReactNode;
  };
}
