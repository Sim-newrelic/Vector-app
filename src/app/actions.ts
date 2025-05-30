/* eslint-disable @typescript-eslint/no-require-imports */
'use server';

// This file is now a stub. The vectorization logic has moved to the API route.
// You can remove or repurpose this file as needed.

export async function processImage(formData: FormData) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/vectorize`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      JSON.stringify({
        message: error.error || 'Failed to process image',
        details: error.details,
        status: error.status,
        statusText: error.statusText
      })
    );
  }
  return await res.text();
} 