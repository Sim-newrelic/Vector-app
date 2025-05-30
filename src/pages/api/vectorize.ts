import type { NextApiRequest, NextApiResponse } from 'next';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import sharp from 'sharp';
// @ts-ignore: No types for imagetracerjs
import ImageTracer from 'imagetracerjs';

export const config = {
  api: {
    bodyParser: false, // We'll handle form parsing manually
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const formidable = require('formidable');
  const form = new formidable.IncomingForm({ multiples: false });

  form.parse(req, async (err: any, fields: any, files: any) => {
    let inputPath: string | null = null;
    let outputPath: string | null = null;
    try {
      if (err) {
        console.error('Formidable parse error:', err);
        res.status(400).json({ error: 'Error parsing form data' });
        return;
      }
      console.log('Formidable files:', files);
      const fileField = files.file;
      const file = Array.isArray(fileField) ? fileField[0] : fileField;
      if (!file) {
        console.error('No file provided in upload.');
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      inputPath = file.filepath || file.path;
      if (!inputPath) {
        console.error('Invalid file path:', file);
        res.status(400).json({ error: 'Invalid file path' });
        return;
      }
      outputPath = join(tmpdir(), `output-${Date.now()}.png`);

      // Process the image with Sharp and get PNG buffer
      console.log('Processing image with sharp:', inputPath, '->', outputPath);
      const pngBuffer = await sharp(inputPath)
        .resize(1000, 1000, { fit: 'inside' })
        .removeAlpha()
        .threshold(128)
        .png()
        .toBuffer();

      // Use imagetracerjs to convert PNG buffer to SVG
      console.log('Vectorizing with ImageTracerJS');
      // Convert buffer to base64 data URL
      const base64 = pngBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;
      const svg = await new Promise<string>((resolve) => {
        ImageTracer.imageToSVG(dataUrl, (svgString: string) => {
          resolve(svgString);
        }, {});
      });

      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(200).send(svg);
    } catch (error: any) {
      console.error('Image processing error:', error, error?.stack);
      if (outputPath) await unlink(outputPath).catch(() => {});
      res.status(500).json({ error: error.message || 'Failed to process image' });
    }
  });
} 