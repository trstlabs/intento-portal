import { useRouter } from 'next/router';
import { useEffect } from 'react';
import type { NextPageContext } from 'next';
import Head from 'next/head';
import Link from 'next/link';

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
}

// Default error messages for common status codes
const errorMessages: Record<number, { title: string; message: string }> = {
  400: {
    title: 'Bad Request',
    message: 'The server cannot process the request due to a client error.',
  },
  401: {
    title: 'Unauthorized',
    message: 'You need to be authenticated to access this resource.',
  },
  403: {
    title: 'Forbidden',
    message: 'You do not have permission to access this resource.',
  },
  404: {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist or has been moved.',
  },
  500: {
    title: 'Internal Server Error',
    message: 'An unexpected error occurred on the server.',
  },
};

export default function ErrorPage({
  statusCode = 500,
  title = 'Error',
  message = 'An error occurred',
}: ErrorPageProps) {
  const router = useRouter();

  useEffect(() => {
    // Log server errors for debugging
    if (statusCode >= 500) {
      console.error(`Error ${statusCode} on ${router.asPath}`);
    }
  }, [statusCode, router.asPath]);

  // Use specific error message if available, otherwise use the provided or default message
  const errorInfo = statusCode ? errorMessages[statusCode] || { title, message } : { title, message };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <Head>
        <title>{`${errorInfo.title} | {process.env.NEXT_PUBLIC_SITE_TITLE}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {statusCode ? `${statusCode} - ${errorInfo.title}` : errorInfo.title}
        </h1>
        <p className="text-lg text-gray-600 mb-8">{errorInfo.message}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md transition-colors text-center"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext): ErrorPageProps => {
  const statusCode = res ? res.statusCode : err ? err.statusCode ?? 500 : 404;
  
  // Return specific error messages for common status codes
  if (statusCode && errorMessages[statusCode]) {
    return { statusCode, ...errorMessages[statusCode] };
  }
  
  // Default error message for other status codes
  return { 
    statusCode, 
    title: statusCode ? `Error ${statusCode}` : 'An Error Occurred', 
    message: 'An unexpected error occurred.' 
  };
};
