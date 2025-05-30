import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';

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

  console.log('Handler started');
  form.parse(req, async (err, fields, files) => {
    try {
      console.log('Form parse callback');
      if (err) {
        console.error('Formidable parse error:', err);
        res.status(400).json({ error: 'Error parsing form data' });
        return;
      }
      console.log('Fields:', fields);
      console.log('Files:', files);

      const fileField = files.file;
      const file = Array.isArray(fileField) ? fileField[0] : fileField;
      if (!file) {
        console.error('No file provided in upload.');
        res.status(400).json({ error: 'No file provided' });
        return;
      }
      const inputPath = file.filepath || file.path;
      console.log('inputPath:', inputPath);
      console.log('File exists:', fs.existsSync(inputPath));
      if (!inputPath || !fs.existsSync(inputPath)) {
        console.error('Invalid file path or file does not exist:', file);
        res.status(400).json({ error: 'Invalid file path' });
        return;
      }

      const imageBuffer = fs.readFileSync(inputPath);

      const apiKey = process.env.VECTORIZER_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: 'VectorizerAPI.com API key not set' });
        return;
      }

      const response = await fetch('https://vectorizerapi.com/api/v1/vectorize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('VectorizerAPI.com API error:', errorText);
        res.status(500).json({ error: 'VectorizerAPI.com API error', details: errorText });
        return;
      }

      const svg = await response.text();
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(200).send(svg);
    } catch (error: any) {
      console.error('Image processing error:', error, error?.stack);
      res.status(500).json({ error: error.message || 'Failed to process image', details: error.stack });
    }
  });
}