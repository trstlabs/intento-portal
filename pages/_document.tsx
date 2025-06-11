import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';
import { Children } from 'react';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: Children.toArray([initialProps.styles]),
    };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Preconnect to external domains */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* Preload critical fonts */}
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
            media="print"
            onLoad={(e: React.SyntheticEvent<HTMLLinkElement>) => {
              const target = e.target as HTMLLinkElement;
              target.media = 'all';
            }}
          />

          {/* Preload other critical assets */}
          <link
            rel="preload"
            href="/_next/static/chunks/main.js"
            as="script"
          />
          
          {/* Preload page-specific chunks */}
          <link
            rel="preload"
            href="/_next/static/chunks/pages/_app.js"
            as="script"
          />
          
          {/* Performance optimizations */}
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
          <meta httpEquiv="x-ua-compatible" content="ie=edge" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#ffffff" />
          
          {/* Prefetch DNS for external domains */}
          <link rel="dns-prefetch" href="//intento.zone" />
          <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        </Head>
        <body>
          <Main />
          <NextScript />
          
          {/* Load non-critical scripts after the page is interactive */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Polyfill for requestIdleCallback
                window.requestIdleCallback = window.requestIdleCallback || function(cb) {
                  const start = Date.now();
                  return setTimeout(function() {
                    cb({ 
                      didTimeout: false,
                      timeRemaining: function() {
                        return Math.max(0, 50 - (Date.now() - start));
                      }
                    });
                  }, 1);
                };

                // Load non-critical CSS
                document.addEventListener('DOMContentLoaded', function() {
                  window.requestIdleCallback(function() {
                    const links = document.querySelectorAll('link[rel="preload"][as="style"]');
                    links.forEach(link => {
                      link.rel = 'stylesheet';
                    });
                  });
                });
              `,
            }}
          />
        </body>
      </Html>
    );
  }
}
