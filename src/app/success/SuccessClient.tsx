'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams!.get('session_id');

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('canDownload', 'true');
    }
  }, [sessionId]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-green-700 mb-4">Payment Successful!</h1>
        <p className="mb-2">Thank you for your purchase.</p>
        {sessionId && <p className="text-xs text-gray-400 mb-4">Session ID: {sessionId}</p>}
        <a href="/" className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Return to App</a>
      </div>
    </main>
  );
} 