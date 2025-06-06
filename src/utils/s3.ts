import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(fileBuffer: Buffer, fileName: string): Promise<string> {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: `vectorized/${fileName}`,
    Body: fileBuffer,
    ContentType: 'image/svg+xml',
  }));

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: `vectorized/${fileName}`,
    }),
    { expiresIn: 3600 }
  );
  return url;
} 