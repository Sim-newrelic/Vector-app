'use client';

export default function CancelPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-red-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-red-700 mb-4">Payment Cancelled</h1>
        <p className="mb-2">Your payment was cancelled. No charges were made.</p>
        <a href="/" className="inline-block mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Return to App</a>
      </div>
    </main>
  );
} 