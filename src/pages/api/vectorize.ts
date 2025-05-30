import type { NextApiRequest, NextApiResponse } from 'next';
// @ts-ignore: No types for formidable
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // We'll handle form parsing manually
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Handler started');
  if (req.method !== 'POST') {
    console.log('Wrong method:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = new formidable.IncomingForm({ multiples: false });

  console.log('Starting vectorize API handler');
  console.log('API handler started');
  console.log('API ID:', process.env.VECTORIZER_API_ID ? 'set' : 'not set');
  console.log('API Secret:', process.env.VECTORIZER_API_SECRET ? 'set' : 'not set');
  form.parse(req, async (err: any, fields: any, files: any) => {
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
      if (!inputPath) {
        console.error('Invalid file path:', file);
        res.status(400).json({ error: 'Invalid file path' });
        return;
      }
      console.log('Input path:', inputPath);

      // Read the file as a buffer
      const imageBuffer = fs.readFileSync(inputPath);
      console.log('Image buffer length:', imageBuffer.length);

      // Prepare the request to Vectorizer.AI
      const apiId = process.env.VECTORIZER_API_ID;
      const apiSecret = process.env.VECTORIZER_API_SECRET;
      if (!apiId || !apiSecret) {
        console.error('Missing Vectorizer.AI credentials');
        res.status(500).json({ error: 'Vectorizer.AI credentials not set' });
        return;
      }
      const auth = Buffer.from(`${apiId}:${apiSecret}`).toString('base64');
      console.log('Sending request to Vectorizer.AI...');

      const response = await fetch('https://vectorizer.ai/api/v1/vectorize', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        body: imageBuffer,
      });

      console.log('Vectorizer.AI response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vectorizer.AI error:', errorText);
        res.status(500).json({ error: 'Vectorizer.AI API error', details: errorText });
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