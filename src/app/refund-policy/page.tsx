'use client';

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-xl w-full text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Refund Policy</h1>
        <p className="mb-6 text-gray-700">
          All sales are final. We do not offer refunds for any purchases made on InstantVector.com. If you have any questions or concerns about your order, please contact us.
        </p>
        <div className="mt-8 text-gray-500 text-sm">
          Contact: <a href="mailto:support@instantvector.com" className="text-blue-600 hover:underline">support@instantvector.com</a>
        </div>
      </div>
    </main>
  );
} 