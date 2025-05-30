import type { NextApiRequest, NextApiResponse } from 'next';
import Busboy from 'busboy';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.VECTORIZER_API_KEY;
  if (!apiKey) {
    console.error('VectorizerAPI.com API key not set');
    res.status(500).json({ error: 'VectorizerAPI.com API key not set' });
    return;
  }

  const busboy = Busboy({ headers: req.headers });
  let fileBuffer: Buffer | null = null;

  busboy.on('file', (fieldname, file, info) => {
    const chunks: Buffer[] = [];
    file.on('data', (data) => {
      chunks.push(data);
      console.log(`[Busboy] Received data chunk of size: ${data.length}`);
    });
    file.on('end', () => {
      fileBuffer = Buffer.concat(chunks);
      console.log(`[Busboy] File received: fieldname=${fieldname}, filename=${info?.filename}, size=${fileBuffer.length}`);
    });
  });

  busboy.on('finish', async () => {
    console.log('[Busboy] Finish event triggered');
    if (!fileBuffer) {
      console.error('No file uploaded');
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      console.log(`[VectorizerAPI] Sending buffer of length: ${fileBuffer.length}`);
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/octet-stream',
      };
      console.log('[VectorizerAPI] Request headers:', headers);
      const response = await fetch('https://vectorizerapi.com/api/v1/vectorize', {
        method: 'POST',
        headers,
        body: fileBuffer,
      });
      console.log(`[VectorizerAPI] Response status: ${response.status}`);
      const responseText = await response.text();
      console.log('[VectorizerAPI] Response body:', responseText);
      if (!response.ok) {
        res.status(500).json({ error: 'VectorizerAPI.com API error', details: responseText });
        return;
      }
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(200).send(responseText);
    } catch (error: any) {
      console.error('[VectorizerAPI] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to process image', details: error });
    }
  });

  req.pipe(busboy);
}