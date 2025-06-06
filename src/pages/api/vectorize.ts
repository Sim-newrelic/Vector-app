import type { NextApiRequest, NextApiResponse } from "next";
import Busboy from "busboy";
import FormData from "form-data";
import fetch, { Response } from "node-fetch";
import { uploadToS3 } from '../../utils/s3';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.VECTORIZER_API_KEY;
  if (!apiKey) {
    console.error("VectorizerAPI.com API key not set");
    res.status(500).json({ error: "VectorizerAPI.com API key not set" });
    return;
  }

  const busboy = Busboy({ headers: req.headers });
  let fileBuffer: Buffer | null = null;
  let filename = "upload.png"; // default
  let contentType = "application/octet-stream"; // default

  busboy.on("file", (fieldname, file, info) => {
    const { filename: uploadedFilename, mimeType } = info;
    filename = uploadedFilename || filename;
    contentType = mimeType || contentType;

    const chunks: Buffer[] = [];
    file.on("data", (data: Buffer) => {
      chunks.push(data);
    });
    file.on("end", () => {
      fileBuffer = Buffer.concat(chunks);
      console.log(
        `[Busboy] File received: fieldname=${fieldname}, filename=${filename}, type=${contentType}, size=${fileBuffer.length}`
      );
    });
  });

  busboy.on("finish", async () => {
    if (!fileBuffer) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    try {
      const form = new FormData();
      form.append("image", fileBuffer, {
        filename,
        contentType,
      });

      const response: Response = await fetch(
        "https://vectorizer.ai/api/v1/vectorize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            ...(form.getHeaders() as Record<string, string>),
          },
          body: form,
        }
      );

      const responseText = await response.text();
      console.log("[VectorizerAPI] Response:", response.status, responseText);

      if (!response.ok) {
        res.status(500).json({
          error: "VectorizerAPI.com API error",
          details: responseText,
        });
        return;
      }

      // Upload the SVG to S3
      const svgBuffer = Buffer.from(responseText);
      const fileName = `${uuidv4()}.svg`;
      const signedUrl = await uploadToS3(svgBuffer, fileName);
      
      // Return the signed URL instead of the SVG content
      res.status(200).json({ 
        url: signedUrl,
        message: "SVG uploaded successfully"
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({
        error: message,
        details: error,
      });
    }
  });

  req.pipe(busboy);
}
