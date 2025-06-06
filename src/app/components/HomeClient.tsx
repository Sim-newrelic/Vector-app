"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { loadStripe } from "@stripe/stripe-js";
import { useSearchParams } from "next/navigation";

function injectSvgAttributes(svg: string) {
  return svg.replace(
    /<svg([^>]*)>/,
    '<svg$1 width="100%" height="100%" preserveAspectRatio="xMidYMid meet">'
  );
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const handleStripeCheckout = async (type: "one_time" | "subscription") => {
  const res = await fetch("/api/checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  } else {
    alert("Error creating Stripe session");
  }
};

export default function HomeClient() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    "http://localhost:3000";
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [svgResult, setSvgResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canDownload, setCanDownload] = useState(false);
  const searchParams = useSearchParams();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      setFile(file);
      localStorage.removeItem("svgResult");
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
        localStorage.setItem("preview", reader.result as string);
      };
      reader.readAsDataURL(file);
    },
  });

  useEffect(() => {
    const sessionId = searchParams?.get("session_id");
    const paid = localStorage.getItem("canDownload") === "true";
    if (sessionId) {
      localStorage.setItem("canDownload", "true");
      setCanDownload(true);
    } else if (paid) {
      setCanDownload(true);
    } else {
      setCanDownload(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const savedPreview = localStorage.getItem("preview");
    const savedSvg = localStorage.getItem("svgResult");
    if (savedPreview) setPreview(savedPreview);
    if (savedSvg) setSvgResult(savedSvg);
  }, []);

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setSvgResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await fetch("/api/vectorize", {
        method: "POST",
        body: formData,
      });
      const data = await result.json();
      setSvgResult(data.url);
      localStorage.setItem("svgResult", data.url);
    } catch (error: any) {
      let errorMessage = "Error processing image. Please try again.";
      try {
        const errorDetails = JSON.parse(error.message);
        errorMessage = `Error: ${errorDetails.message}\nDetails: ${
          errorDetails.details || "No additional details"
        }`;
      } catch {
        // If parsing fails, use the original error message
      }
      alert(errorMessage);
      console.error("Processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!svgResult) return;
    if (!canDownload) {
      alert("You must pay to download.");
      return;
    }
    const a = document.createElement("a");
    a.href = svgResult;
    a.download = "vectorized-design.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Image Vectorizer
        </h1>
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center">
          <button
            onClick={() => handleStripeCheckout("one_time")}
            className="py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            One-Time Download ($1)
          </button>
          <button
            onClick={() => handleStripeCheckout("subscription")}
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
                ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
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
            <p className="text-xs text-gray-400 mt-2 text-center">
              Supported formats: PNG, JPG, JPEG, GIF, BMP, TIFF, WEBP, PDF, EPS,
              PSD, AI, SVG
            </p>
            {file && (
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                  disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? "Processing..." : "Process Image"}
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-white">
              <h2 className="text-xl font-semibold mb-4 text-gray-400">
                Vectorized Result
              </h2>
              <div
                className="aspect-square bg-gray-50 rounded-lg mb-4 overflow-hidden flex items-center justify-center"
                style={{ minHeight: 320 }}
              >
                {isProcessing ? (
                  <div className="text-gray-400 animate-pulse">
                    Processing...
                  </div>
                ) : svgResult ? (
                  <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 320 }}>
                    <img src={svgResult} alt="Vectorized result" className="max-w-full h-auto" />
                  </div>
                ) : (
                  <div className="text-gray-400">
                    Processed vector will appear here
                  </div>
                )}
              </div>
              <button
                onClick={handleDownload}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={!svgResult || isProcessing || !canDownload}
              >
                {canDownload ? "Download SVG" : "Pay to Download"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <footer className="w-full text-center mt-12 mb-4 text-xs text-gray-400">
        <div className="max-w-xl mx-auto px-2">
          <div className="mb-2 text-gray-500">
            <strong>Refund & Cancellation Policy:</strong>
            <br />
            All purchases are final. Due to the nature of digital products and
            instant delivery, we are unable to offer refunds. However, if you
            experience any issues with your file or download, please don't
            hesitate to contact us at{" "}
            <a
              href="mailto:support@instantvector.com"
              className="text-blue-600 hover:underline"
            >
              support@instantvector.com
            </a>{" "}
            — we're here to help and will do our best to resolve any problems.
            <br />
            <br />
            If you would like to cancel your subscription, simply email us at{" "}
            <a
              href="mailto:support@instantvector.com"
              className="text-blue-600 hover:underline"
            >
              support@instantvector.com
            </a>
            . We'll process your cancellation within 24 hours and confirm once
            it's complete.
          </div>
        </div>
      </footer>
    </main>
  );
}
