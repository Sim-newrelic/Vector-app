'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { processImage } from './actions';
import { loadStripe } from '@stripe/stripe-js';
import { useSearchParams } from 'next/navigation';

function injectSvgAttributes(svg: string) {
  // Add width, height, and preserveAspectRatio to the <svg> tag
  return svg.replace(
    /<svg([^>]*)>/,
    '<svg$1 width="100%" height="100%" preserveAspectRatio="xMidYMid meet">'
  );
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const handleStripeCheckout = async (type: 'one_time' | 'subscription') => {
  const res = await fetch('/api/checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  } else {
    alert('Error creating Stripe session');
  }
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [svgResult, setSvgResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canDownload, setCanDownload] = useState(false);
  const searchParams = useSearchParams();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      setFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  });

  useEffect(() => {
    // Check for payment confirmation via session_id in URL
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      localStorage.setItem('canDownload', 'true');
      setCanDownload(true);
    } else if (localStorage.getItem('canDownload') === 'true') {
      setCanDownload(true);
    } else {
      setCanDownload(false);
    }
  }, [searchParams]);

  const handleProcess = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setSvgResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await processImage(formData);
      setSvgResult(result as string);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!svgResult) return;
    
    const blob = new Blob([svgResult], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vectorized-design.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Image Vectorizer
        </h1>
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center">
          <button
            onClick={() => handleStripeCheckout('one_time')}
            className="py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            One-Time Download ($1)
          </button>
          <button
            onClick={() => handleStripeCheckout('subscription')}
            className="py-3 px-6 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Unlimited Subscription ($5/month)
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full h-auto rounded-lg"
                />
              ) : (
                <div className="text-gray-500">
                  <p className="text-lg mb-2">Drag & drop an image here</p>
                  <p className="text-sm">or click to select a file</p>
                </div>
              )}
            </div>

            {file && (
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                  disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Process Image'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-white">
              <h2 className="text-xl font-semibold mb-4 text-gray-400">
                Vectorized Result
              </h2>
              <div className="aspect-square bg-gray-50 rounded-lg mb-4 overflow-hidden flex items-center justify-center" style={{ minHeight: 320 }}>
                {isProcessing ? (
                  <div className="text-gray-400 animate-pulse">Processing...</div>
                ) : svgResult ? (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ minHeight: 320 }}
                    dangerouslySetInnerHTML={{ __html: injectSvgAttributes(svgResult) }}
                  />
                ) : (
                  <div className="text-gray-400">Processed vector will appear here</div>
                )}
              </div>
              <button
                onClick={handleDownload}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={!svgResult || isProcessing || !canDownload}
              >
                {canDownload ? 'Download SVG' : 'Pay to Download'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
