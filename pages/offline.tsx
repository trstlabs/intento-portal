import Head from 'next/head';
import Link from 'next/link';

// This is a Next.js page component
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <Head>
        <title>Offline | {process.env.NEXT_PUBLIC_SITE_TITLE} </title>
        <meta name="description" content="You are currently offline" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
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
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">You&apos;re offline</h1>
        <p className="text-lg text-gray-600 mb-8">
          It seems you&apos;re not connected to the internet. Please check your connection and try again.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Try Again
          </button>
          
          <Link href="/" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md transition-colors text-center">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
