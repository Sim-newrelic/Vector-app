'use client';

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-xl w-full text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Refund Policy</h1>
        <p className="mb-6 text-gray-700">
          All purchases are final. Due to the nature of digital products and instant delivery, we are unable to offer refunds. However, if you experience any issues with your file or download, please don't hesitate to contact us at <a href="mailto:support@instantvector.com" className="text-blue-600 hover:underline">support@instantvector.com</a> — we're here to help and will do our best to resolve any problems.
        </p>
      </div>
    </main>
  );
} 