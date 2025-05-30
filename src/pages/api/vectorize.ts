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
    res.status(500).json({ error: 'VectorizerAPI.com API key not set' });
    return;
  }

  const busboy = Busboy({ headers: req.headers });
  let fileBuffer: Buffer | null = null;

  busboy.on('file', (fieldname, file) => {
    const chunks: Buffer[] = [];
    file.on('data', (data) => chunks.push(data));
    file.on('end', () => {
      fileBuffer = Buffer.concat(chunks);
    });
  });

  busboy.on('finish', async () => {
    if (!fileBuffer) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      const response = await fetch('https://vectorizerapi.com/api/v1/vectorize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: fileBuffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        res.status(500).json({ error: 'VectorizerAPI.com API error', details: errorText });
        return;
      }

      const svg = await response.text();
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(200).send(svg);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to process image' });
    }
  });

  req.pipe(busboy);
}