import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

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

  const form = new IncomingForm({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        res.status(400).json({ error: 'Error parsing form data' });
        return;
      }
      const fileField = files.file;
      const file = Array.isArray(fileField) ? fileField[0] : fileField;
      if (!file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }
      const inputPath = file.filepath || file.path;
      if (!inputPath) {
        res.status(400).json({ error: 'Invalid file path' });
        return;
      }

      // Prepare form-data for the API request
      const formData = new FormData();
      formData.append('image', fs.createReadStream(inputPath));

      const apiId = process.env.VECTORIZER_API_ID;
      const apiSecret = process.env.VECTORIZER_API_SECRET;
      if (!apiId || !apiSecret) {
        res.status(500).json({ error: 'Vectorizer.AI credentials not set' });
        return;
      }
      const auth = Buffer.from(`${apiId}:${apiSecret}`).toString('base64');

      const response = await fetch('https://api.vectorizer.ai/api/v1/vectorize', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        res.status(500).json({ error: 'Vectorizer.AI API error', details: errorText });
        return;
      }

      const svg = await response.text();
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(200).send(svg);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to process image' });
    }
  });
}